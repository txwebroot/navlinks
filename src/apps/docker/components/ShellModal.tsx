import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface ShellModalProps {
    isOpen: boolean;
    onClose: () => void;
    containerId: string;
    containerName: string;
}

export function ShellModal({ isOpen, onClose, containerId, containerName }: ShellModalProps) {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // This is a placeholder for actual shell functionality.
    // Real shell requires WebSocket and xterm.js which are not currently available.
    // We will implement a simple "Exec" feature instead.

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

        setLoading(true);
        setOutput(prev => prev + `\n$ ${command}\n`);

        // TODO: Implement actual exec API call here
        // For now, we simulate a response
        setTimeout(() => {
            setOutput(prev => prev + `> Command execution is not yet implemented in backend.\n> You typed: ${command}\n`);
            setLoading(false);
            setCommand('');
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800">
                        容器 Shell: <span className="font-mono text-[var(--theme-primary)]">{containerName}</span>
                    </h2>
                    <button onClick={onClose} className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition shadow-sm">
                        <Icon icon="fa-solid fa-times" className="text-xl" />
                    </button>
                </div>

                <div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    <div className="text-green-400 mb-2">Connected to {containerName} (Simulated)</div>
                    {output}
                </div>

                <form onSubmit={handleExecute} className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <span className="text-gray-500 py-2">$</span>
                    <input
                        type="text"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-gray-800 font-mono"
                        placeholder="输入命令..."
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <Icon icon="fa-solid fa-paper-plane" />
                        <span>发送</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
