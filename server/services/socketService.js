import { Server } from 'socket.io';
import { Client } from 'ssh2';
import { decrypt } from '../utils/crypto.js';
import { getServerById, updateServer } from './vpsService.js';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Allow all origins for dev, restrict in prod
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('[Socket] Client connected:', socket.id);

        let sshClient = null;
        let sshStream = null;
        let currentServerId = null;

        // Handle SSH Connection Request
        socket.on('ssh:connect', async ({ serverId, cols = 80, rows = 24 }) => {
            try {
                currentServerId = serverId;
                const server = await getServerById(serverId, true); // Get with secrets
                if (!server) {
                    socket.emit('ssh:error', 'Server not found');
                    return;
                }

                let isRetry = false;

                const setupClientListeners = () => {
                    sshClient.on('ready', async () => {
                        // socket.emit('ssh:ready'); // Moved to after shell is ready
                        // await updateServer(serverId, { status: 'online' }); // Moved to after shell is ready

                        // Fetch Detailed System Info (OS, CPU, RAM, Disk)
                        const infoCmd = 'cat /etc/os-release; echo "|||"; lscpu; echo "|||"; free -m; echo "|||"; df -h /';
                        sshClient.exec(infoCmd, (err, stream) => {
                            if (err) return;
                            let output = '';
                            stream.on('data', (data) => output += data);
                            stream.on('close', async () => {
                                try {
                                    const parts = output.split('|||').map(s => s.trim());
                                    if (parts.length < 4) return;

                                    const [osRaw, cpuRaw, memRaw, diskRaw] = parts;

                                    // 1. Parse OS
                                    let osInfo = 'Linux';
                                    const prettyName = osRaw.match(/PRETTY_NAME="([^"]+)"/);
                                    if (prettyName) osInfo = prettyName[1];
                                    else {
                                        const name = osRaw.match(/NAME="([^"]+)"/);
                                        if (name) osInfo = name[1];
                                    }

                                    // 2. Parse CPU
                                    let cpuModel = 'Unknown';
                                    let cpuCores = '1';
                                    const modelMatch = cpuRaw.match(/Model name:\s+(.+)/);
                                    if (modelMatch) cpuModel = modelMatch[1];
                                    const cpuMatch = cpuRaw.match(/CPU\(s\):\s+(\d+)/);
                                    if (cpuMatch) cpuCores = cpuMatch[1];
                                    const cpuInfoStr = `${cpuModel} (${cpuCores} Cores)`;

                                    // 3. Parse Memory (MB)
                                    let memTotal = '0';
                                    let swapTotal = '0';
                                    const memMatch = memRaw.match(/Mem:\s+(\d+)/);
                                    if (memMatch) memTotal = memMatch[1];
                                    const swapMatch = memRaw.match(/Swap:\s+(\d+)/);
                                    if (swapMatch) swapTotal = swapMatch[1];
                                    const memInfoStr = `${memTotal} MB (Swap: ${swapTotal} MB)`;

                                    // 4. Parse Disk
                                    let diskTotal = 'Unknown';
                                    const diskLines = diskRaw.split('\n');
                                    if (diskLines.length > 1) {
                                        const diskInfo = diskLines[1].split(/\s+/);
                                        if (diskInfo.length >= 2) diskTotal = diskInfo[1];
                                    }

                                    await updateServer(serverId, {
                                        os_info: osInfo,
                                        cpu_info: cpuInfoStr,
                                        mem_info: memInfoStr,
                                        disk_info: diskTotal
                                    });
                                } catch (e) {
                                    console.error('Failed to parse static info:', e);
                                }
                            });
                        });

                        sshClient.shell({
                            term: 'xterm-256color',
                            cols,
                            rows,
                        }, (err, stream) => {
                            if (err) {
                                socket.emit('ssh:error', 'Shell error: ' + err.message);
                                return;
                            }

                            sshStream = stream;

                            // Notify frontend that SSH (and Shell) is ready
                            socket.emit('ssh:ready');
                            updateServer(serverId, { status: 'online' });

                            // Data from Server -> Client
                            stream.on('data', (data) => {
                                socket.emit('ssh:data', data.toString('utf-8'));
                            });

                            stream.on('close', () => {
                                socket.emit('ssh:close');
                                sshClient.end();
                            });

                            // Data from Client -> Server
                            socket.on('ssh:data', (data) => {
                                if (stream.writable) {
                                    stream.write(data);
                                }
                            });

                            // Handle Resize
                            socket.on('ssh:resize', ({ cols, rows }) => {
                                if (stream.writable) {
                                    stream.setWindow(rows, cols, 0, 0);
                                }
                            });
                        });
                    });

                    sshClient.on('error', (err) => {
                        console.error('[SSH] Connection Error:', err.message);

                        if (err.message.includes('All configured authentication methods failed') && !isRetry && server.password) {
                            console.log('[SSH] Auth failed, retrying with keyboard-interactive only...');
                            isRetry = true;
                            connectSSH(true);
                            return;
                        }

                        socket.emit('ssh:error', 'Connection error: ' + err.message);
                        if (currentServerId) {
                            updateServer(currentServerId, { status: 'error' });
                        }
                    });

                    sshClient.on('close', () => {
                        socket.emit('ssh:close');
                        if (currentServerId) {
                            updateServer(currentServerId, { status: 'offline' });
                        }
                    });

                    sshClient.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
                        console.log('[SSH] keyboard-interactive triggered');
                        if (prompts.length > 0 && server.password) {
                            finish([server.password]);
                        } else {
                            finish([]);
                        }
                    });
                };

                const connectSSH = (forceKeyboardInteractive = false) => {
                    // Clean up previous client if exists
                    if (sshClient) {
                        sshClient.removeAllListeners();
                        sshClient.end();
                    }

                    sshClient = new Client();
                    setupClientListeners();

                    const config = {
                        host: server.host,
                        port: server.port,
                        username: server.username,
                        readyTimeout: 20000,
                        tryKeyboard: true,
                    };

                    if (server.auth_type === 'password' && server.password && !forceKeyboardInteractive) {
                        config.password = server.password;
                    } else if (server.auth_type === 'key' && server.private_key) {
                        config.privateKey = server.private_key;
                    }

                    console.log(`[SSH] Connecting... (Force Keyboard: ${forceKeyboardInteractive})`);
                    sshClient.connect(config);
                };

                // Initial connection
                connectSSH(false);

            } catch (error) {
                console.error('[Socket] SSH Connect Error:', error);
                socket.emit('ssh:error', 'Internal server error');
            }
        });

        // Handle Monitoring
        let monitorInterval = null;
        let prevNetStats = null;
        let prevCpu = null;
        let lastCheckTime = null;

        socket.on('monitor:start', () => {
            if (!sshClient) return;
            if (monitorInterval) clearInterval(monitorInterval);

            const fetchStats = () => {
                // Lightweight commands to get system stats
                const cmd = 'cat /proc/stat; echo "|||"; cat /proc/meminfo; echo "|||"; df -h /; echo "|||"; cat /proc/net/dev';

                sshClient.exec(cmd, (err, stream) => {
                    if (err) return; // Ignore errors for now
                    let output = '';
                    stream.on('data', (data) => output += data);
                    stream.on('close', async () => {
                        try {
                            const parts = output.split('|||').map(s => s.trim());
                            if (parts.length < 4) return;

                            const [cpuRaw, memRaw, diskRaw, netRaw] = parts;
                            const now = Date.now();

                            // 1. Parse CPU
                            const cpuLine = cpuRaw.split('\n').find(l => l.startsWith('cpu '));
                            let cpuUsage = 0;
                            if (cpuLine) {
                                const nums = cpuLine.split(/\s+/).slice(1).map(Number);
                                const idle = nums[3];
                                const total = nums.reduce((a, b) => a + b, 0);

                                if (prevCpu) {
                                    const totalDiff = total - prevCpu.total;
                                    const idleDiff = idle - prevCpu.idle;
                                    if (totalDiff > 0) {
                                        cpuUsage = ((totalDiff - idleDiff) / totalDiff) * 100;
                                    }
                                }
                                prevCpu = { total, idle };
                            }

                            // 2. Parse Memory
                            const memTotal = parseInt(memRaw.match(/MemTotal:\s+(\d+)/)?.[1] || '0');
                            const memFree = parseInt(memRaw.match(/MemFree:\s+(\d+)/)?.[1] || '0');
                            const memBuffers = parseInt(memRaw.match(/Buffers:\s+(\d+)/)?.[1] || '0');
                            const memCached = parseInt(memRaw.match(/Cached:\s+(\d+)/)?.[1] || '0');
                            const memUsed = memTotal - memFree - memBuffers - memCached;

                            // 3. Parse Disk
                            const diskLines = diskRaw.split('\n');
                            const diskInfo = diskLines.length > 1 ? diskLines[1].split(/\s+/) : [];
                            const diskUsage = diskInfo.length >= 5 ? parseInt(diskInfo[4]) : 0;

                            // 4. Parse Network
                            // Simple sum of all interfaces (except lo)
                            let rx = 0, tx = 0;
                            netRaw.split('\n').forEach(line => {
                                if (line.includes(':') && !line.trim().startsWith('lo:')) {
                                    const stats = line.split(':')[1].trim().split(/\s+/).map(Number);
                                    rx += stats[0];
                                    tx += stats[8];
                                }
                            });

                            let netSpeed = { up: 0, down: 0 };
                            if (prevNetStats && lastCheckTime) {
                                const duration = (now - lastCheckTime) / 1000;
                                if (duration > 0) {
                                    netSpeed.down = (rx - prevNetStats.rx) / duration;
                                    netSpeed.up = (tx - prevNetStats.tx) / duration;
                                }
                            }
                            prevNetStats = { rx, tx };
                            lastCheckTime = now;

                            const statsData = {
                                cpu: Math.round(cpuUsage),
                                mem: { total: memTotal, used: memUsed },
                                disk: diskUsage,
                                net: netSpeed
                            };

                            socket.emit('monitor:data', statsData);

                            // Optional: Update basic stats to DB occasionally? 
                            // For now, we only update static info on connect.

                        } catch (e) {
                            console.error('Parse stats error:', e);
                        }
                    });
                });
            };

            fetchStats(); // Run immediately
            monitorInterval = setInterval(fetchStats, 2000);
        });

        socket.on('monitor:stop', () => {
            if (monitorInterval) {
                clearInterval(monitorInterval);
                monitorInterval = null;
            }
        });

        // Handle SFTP
        let sftpSession = null;
        const getSftp = (cb) => {
            if (sftpSession) return cb(null, sftpSession);
            if (!sshClient) return cb(new Error('SSH not connected'));

            sshClient.sftp((err, sftp) => {
                if (err) return cb(err);
                sftpSession = sftp;
                cb(null, sftp);
            });
        };

        socket.on('sftp:home', () => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.realpath('.', (err, path) => {
                    if (err) return socket.emit('sftp:error', err.message);
                    socket.emit('sftp:home:data', path);
                });
            });
        });

        socket.on('sftp:list', (path) => {
            console.log(`[SFTP] List requested for: ${path}`);
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.readdir(path, (err, list) => {
                    if (err) {
                        console.error(`[SFTP] List error for ${path}:`, err.message);
                        return socket.emit('sftp:error', err.message);
                    }

                    try {
                        // Filter out . and ..
                        const files = list
                            .filter(item => item.filename !== '.' && item.filename !== '..')
                            .map(item => ({
                                name: item.filename,
                                longname: item.longname || '',
                                attrs: item.attrs,
                                // Treat directories (d) and symlinks (l) as navigable directories
                                isDirectory: (item.longname && (item.longname.startsWith('d') || item.longname.startsWith('l'))) || false
                            }));

                        console.log(`[SFTP] Sending ${files.length} items for ${path}`);
                        socket.emit('sftp:list:data', { path, files });
                    } catch (processErr) {
                        console.error(`[SFTP] Error processing list for ${path}:`, processErr);
                        socket.emit('sftp:error', 'Failed to process file list');
                    }
                });
            });
        });

        socket.on('sftp:read', (path) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.readFile(path, 'utf8', (err, content) => {
                    if (err) return socket.emit('sftp:error', err.message);
                    socket.emit('sftp:read:data', { path, content });
                });
            });
        });

        socket.on('sftp:download', (path) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.readFile(path, (err, content) => { // Buffer
                    if (err) return socket.emit('sftp:error', err.message);
                    socket.emit('sftp:download:data', { path, content, filename: path.split('/').pop() });
                });
            });
        });

        // Upload State
        const uploadHandles = new Map(); // path -> handle

        socket.on('sftp:upload:start', ({ path }) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                // Open for writing, create if not exists, truncate if exists
                sftp.open(path, 'w', (err, handle) => {
                    if (err) {
                        console.error(`[SFTP] Upload start error for ${path}:`, err.message);
                        return socket.emit('sftp:error', err.message);
                    }
                    uploadHandles.set(path, handle);
                    socket.emit('sftp:upload:start:ack', path);
                });
            });
        });

        socket.on('sftp:upload:chunk', ({ path, content, position }) => {
            const handle = uploadHandles.get(path);
            if (!handle) return socket.emit('sftp:error', 'Upload handle not found');

            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                // content is received as Buffer from socket.io
                sftp.write(handle, content, 0, content.length, position, (err) => {
                    if (err) {
                        console.error(`[SFTP] Upload chunk error for ${path}:`, err.message);
                        return socket.emit('sftp:error', err.message);
                    }
                    socket.emit('sftp:upload:chunk:ack', path);
                });
            });
        });

        socket.on('sftp:upload:finish', ({ path }) => {
            const handle = uploadHandles.get(path);
            if (!handle) return;

            getSftp((err, sftp) => {
                if (err) return; // Should handle error
                sftp.close(handle, (err) => {
                    uploadHandles.delete(path);
                    if (err) {
                        console.error(`[SFTP] Upload finish error for ${path}:`, err.message);
                        return socket.emit('sftp:error', err.message);
                    }
                    console.log(`[SFTP] Upload success for: ${path}`);
                    socket.emit('sftp:write:success', path);
                });
            });
        });

        socket.on('sftp:write', ({ path, content }) => {
            console.log(`[SFTP] Write requested for: ${path}, size: ${content ? content.byteLength : 'unknown'}`);
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.writeFile(path, content, (err) => {
                    if (err) {
                        console.error(`[SFTP] Write error for ${path}:`, err.message);
                        return socket.emit('sftp:error', err.message);
                    }
                    console.log(`[SFTP] Write success for: ${path}`);
                    socket.emit('sftp:write:success', path);
                });
            });
        });

        socket.on('sftp:mkdir', (path) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.mkdir(path, (err) => {
                    if (err) return socket.emit('sftp:error', err.message);
                    socket.emit('sftp:action:success', { action: 'mkdir', path });
                });
            });
        });

        socket.on('sftp:delete', (path) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                // Try unlink (file) first, then rmdir (dir)
                sftp.unlink(path, (err) => {
                    if (!err) return socket.emit('sftp:action:success', { action: 'delete', path });
                    sftp.rmdir(path, (err2) => {
                        if (err2) return socket.emit('sftp:error', err.message); // Return original error or err2?
                        socket.emit('sftp:action:success', { action: 'delete', path });
                    });
                });
            });
        });

        socket.on('sftp:rename', ({ oldPath, newPath }) => {
            getSftp((err, sftp) => {
                if (err) return socket.emit('sftp:error', err.message);
                sftp.rename(oldPath, newPath, (err) => {
                    if (err) return socket.emit('sftp:error', err.message);
                    socket.emit('sftp:action:success', { action: 'rename', path: newPath });
                });
            });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Client disconnected:', socket.id);
            if (monitorInterval) clearInterval(monitorInterval);
            if (sftpSession) {
                // sftpSession.end(); // sftp session usually ends with client
                sftpSession = null;
            }
            if (sshClient) {
                sshClient.end();
            }
            if (currentServerId) {
                updateServer(currentServerId, { status: 'offline' });
            }
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
