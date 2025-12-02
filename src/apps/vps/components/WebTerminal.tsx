import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import io, { Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface WebTerminalProps {
    serverId: string;
    onClose?: () => void;
    onSocketReady?: (socket: Socket) => void;
    visible?: boolean;
    onStatusChange?: (status: 'online' | 'offline') => void;
}

export interface WebTerminalRef {
    send: (data: string) => void;
}

const WebTerminal = forwardRef<WebTerminalRef, WebTerminalProps>(({ serverId, onClose, onSocketReady, visible = true, onStatusChange }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        send: (data: string) => {
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('ssh:data', data);
            } else {
                console.warn('[WebTerminal] Cannot send data: Socket not connected');
            }
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
            }
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        term.open(terminalRef.current);
        // The line `term.open(terminalRef.current);` was duplicated, removing the second one.

        // Initial fit attempt
        if (visible && terminalRef.current.clientWidth > 0) {
            try {
                fitAddon.fit();
            } catch (e) {
                // Ignore initial fit error
            }
        }

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        term.writeln('Connecting to server...');

        // Initialize Socket.io
        // In dev, we might need full URL if ports differ, but proxy usually handles /socket.io
        const socket = io({
            path: '/socket.io',
            transports: ['websocket']
        });
        socketRef.current = socket;

        if (onSocketReady) {
            onSocketReady(socket);
        }

        socket.on('connect', () => {
            term.writeln('Socket connected. Authenticating...');
            // Request SSH connection
            socket.emit('ssh:connect', {
                serverId,
                cols: term.cols,
                rows: term.rows
            });
        });

        socket.on('ssh:ready', () => {
            setConnected(true);
            term.clear();
            // Start monitoring
            socket.emit('monitor:start');
            onStatusChange?.('online');
        });

        socket.on('ssh:data', (data: string) => {
            term.write(data);
        });

        socket.on('ssh:error', (msg: string) => {
            setError(msg);
            term.writeln(`\r\n\x1b[31mError: ${msg}\x1b[0m`);
            onStatusChange?.('offline');
        });

        socket.on('ssh:close', () => {
            setConnected(false);
            term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
            onStatusChange?.('offline');
        });

        socket.on('disconnect', () => {
            setConnected(false);
            // term.writeln('\r\nSocket disconnected.');
            onStatusChange?.('offline');
        });

        // Handle Input
        term.onData((data) => {
            socket.emit('ssh:data', data);
        });

        // Cleanup
        return () => {
            socket.off('connect');
            socket.off('ssh:ready');
            socket.off('ssh:data');
            socket.off('ssh:error');
            socket.off('ssh:close');
            socket.off('disconnect');
            socket.disconnect();
            term.dispose();
        };

    }, [serverId]);

    // Use ResizeObserver for robust fitting
    useEffect(() => {
        if (!terminalRef.current || !fitAddonRef.current) return;

        const observer = new ResizeObserver(() => {
            if (visible && terminalRef.current && terminalRef.current.clientWidth > 0) {
                try {
                    fitAddonRef.current?.fit();
                    // Also notify server of resize
                    if (socketRef.current && xtermRef.current) {
                        socketRef.current.emit('ssh:resize', {
                            cols: xtermRef.current.cols,
                            rows: xtermRef.current.rows
                        });
                    }
                } catch (e) {
                    // Ignore fit errors
                }
            }
        });

        observer.observe(terminalRef.current);

        return () => observer.disconnect();
    }, [visible]);

    // Handle visibility change
    useEffect(() => {
        if (visible && fitAddonRef.current && terminalRef.current) {
            // Small delay to ensure container is rendered
            setTimeout(() => {
                try {
                    if (terminalRef.current?.clientWidth > 0) {
                        fitAddonRef.current?.fit();
                    }
                } catch (e) {
                    console.warn('Failed to fit terminal:', e);
                }
            }, 100);
        }
    }, [visible]);

    return (
        <div className="h-full w-full bg-[#1e1e1e] p-2 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center border-b border-[#3d3d3d]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-300 text-sm font-mono">SSH Terminal</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <i className="fa-solid fa-times"></i>
                    </button>
                )}
            </div>

            {/* Terminal Container */}
            <div className="flex-1 overflow-hidden p-2" ref={terminalRef}></div>

            {error && (
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
                    {error}
                </div>
            )}
        </div>
    );
});

export default WebTerminal;
