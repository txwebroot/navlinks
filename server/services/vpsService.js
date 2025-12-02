import { getDatabase, promisifyDb } from '../database/index.js';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '../utils/crypto.js';

// --- Groups ---

export const getGroups = async () => {
    const db = getDatabase();
    const { all } = promisifyDb(db);
    return await all('SELECT * FROM vps_groups ORDER BY sort_order ASC, created_at DESC');
};

export const createGroup = async (group) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    const id = uuidv4();
    await run(
        'INSERT INTO vps_groups (id, name, description, sort_order) VALUES (?, ?, ?, ?)',
        [id, group.name, group.description || '', group.sort_order || 0]
    );
    return { id, ...group };
};

export const updateGroup = async (id, group) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run(
        'UPDATE vps_groups SET name = ?, description = ?, sort_order = ? WHERE id = ?',
        [group.name, group.description, group.sort_order, id]
    );
    return { id, ...group };
};

export const deleteGroup = async (id) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run('DELETE FROM vps_groups WHERE id = ?', [id]);
    return { id };
};

// --- Servers ---

export const getServers = async () => {
    const db = getDatabase();
    const { all } = promisifyDb(db);
    const servers = await all('SELECT * FROM vps_servers ORDER BY created_at DESC');

    // Decrypt sensitive data before returning (or keep encrypted and decrypt only when needed for connection?)
    // Usually we don't send passwords to frontend. We should omit them.
    return servers.map(server => {
        const { password, private_key, ...rest } = server;
        return {
            ...rest,
            has_password: !!password,
            has_private_key: !!private_key
        };
    });
};

export const getServerById = async (id, includeSecrets = false) => {
    const db = getDatabase();
    const { get } = promisifyDb(db);
    const server = await get('SELECT * FROM vps_servers WHERE id = ?', [id]);

    if (!server) return null;

    if (includeSecrets) {
        if (server.password) server.password = decrypt(server.password);
        if (server.private_key) server.private_key = decrypt(server.private_key);
        return server;
    }

    const { password, private_key, ...rest } = server;
    return {
        ...rest,
        has_password: !!password,
        has_private_key: !!private_key
    };
};

export const createServer = async (server) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    const id = uuidv4();

    const encryptedPassword = server.password ? encrypt(server.password) : null;
    const encryptedKey = server.private_key ? encrypt(server.private_key) : null;

    await run(
        `INSERT INTO vps_servers (
            id, group_id, name, description, host, port, username, password, private_key, auth_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, server.group_id || null, server.name, server.description || '',
            server.host, server.port || 22, server.username,
            encryptedPassword, encryptedKey, server.auth_type || 'password'
        ]
    );

    return { id, ...server, password: null, private_key: null }; // Don't return secrets
};

export const updateServer = async (id, server) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);

    const updates = [];
    const params = [];

    // Handle standard fields
    const fields = [
        'name', 'description', 'host', 'port', 'username', 'auth_type',
        'os_info', 'cpu_info', 'mem_info', 'disk_info', 'status', 'latency', 'last_check_time'
    ];

    fields.forEach(field => {
        if (server[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(server[field]);
        }
    });

    // Handle group_id specifically for empty string -> null conversion
    if (server.group_id !== undefined) {
        updates.push('group_id = ?');
        params.push(server.group_id || null);
    }

    // Handle secrets: Only update if provided and not empty
    if (server.password) {
        updates.push('password = ?');
        params.push(encrypt(server.password));
    }
    if (server.private_key) {
        updates.push('private_key = ?');
        params.push(encrypt(server.private_key));
    }

    if (updates.length === 0) return { id };

    const sql = `UPDATE vps_servers SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await run(sql, params);
    return { id, ...server, password: null, private_key: null };
};

export const deleteServer = async (id) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run('DELETE FROM vps_servers WHERE id = ?', [id]);
    return { id };
};

export const checkServerConnectivity = async (id) => {
    const server = await getServerById(id);
    if (!server) throw new Error('Server not found');

    return new Promise((resolve) => {
        const start = Date.now();
        const socket = net.createConnection(server.port || 22, server.host);

        const cleanup = () => {
            socket.destroy();
        };

        socket.setTimeout(5000); // 5s timeout

        socket.on('connect', async () => {
            const latency = Date.now() - start;
            cleanup();

            // Update DB
            await updateServer(id, {
                status: 'online',
                latency: latency,
                last_check_time: new Date().toISOString()
            });

            resolve({ id, status: 'online', latency });
        });

        socket.on('error', async (err) => {
            cleanup();
            console.error(`[Ping] Error connecting to ${server.host}:`, err.message);

            await updateServer(id, {
                status: 'offline',
                latency: null,
                last_check_time: new Date().toISOString()
            });

            resolve({ id, status: 'offline', latency: null, error: err.message });
        });

        socket.on('timeout', async () => {
            cleanup();

            await updateServer(id, {
                status: 'offline',
                latency: null,
                last_check_time: new Date().toISOString()
            });

            resolve({ id, status: 'offline', latency: null, error: 'Timeout' });
        });
    });
};

// --- Snippets ---

export const getSnippets = async () => {
    const db = getDatabase();
    const { all } = promisifyDb(db);
    return await all('SELECT * FROM vps_snippets ORDER BY category ASC, title ASC');
};

export const createSnippet = async (snippet) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    const id = uuidv4();
    await run(
        'INSERT INTO vps_snippets (id, category, title, command, description) VALUES (?, ?, ?, ?, ?)',
        [id, snippet.category, snippet.title, snippet.command, snippet.description || '']
    );
    return { id, ...snippet };
};

export const updateSnippet = async (id, snippet) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run(
        'UPDATE vps_snippets SET category = ?, title = ?, command = ?, description = ? WHERE id = ?',
        [snippet.category, snippet.title, snippet.command, snippet.description, id]
    );
    return { id, ...snippet };
};

export const deleteSnippet = async (id) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run('DELETE FROM vps_snippets WHERE id = ?', [id]);
    return { id };
};

// --- Snippet Categories ---

export const getSnippetCategories = async () => {
    const db = getDatabase();
    const { all } = promisifyDb(db);
    return await all('SELECT * FROM vps_snippet_categories ORDER BY sort_order ASC, created_at DESC');
};

export const createSnippetCategory = async (category) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    const id = uuidv4();
    await run(
        'INSERT INTO vps_snippet_categories (id, name, sort_order) VALUES (?, ?, ?)',
        [id, category.name, category.sort_order || 0]
    );
    return { id, ...category };
};

export const updateSnippetCategory = async (id, category) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run(
        'UPDATE vps_snippet_categories SET name = ?, sort_order = ? WHERE id = ?',
        [category.name, category.sort_order, id]
    );
    return { id, ...category };
};

export const deleteSnippetCategory = async (id) => {
    const db = getDatabase();
    const { run } = promisifyDb(db);
    await run('DELETE FROM vps_snippet_categories WHERE id = ?', [id]);
    return { id };
};
