import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface LogViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    containerId: string;
    containerName: string;
    fetchLogs: (containerId: string, tail?: number) => Promise<string>;
}

export function LogViewerModal({ isOpen, onClose, containerId, containerName, fetchLogs }: LogViewerModalProps) {
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tail, setTail] = useState(100);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && containerId) {
            loadLogs();
        } else {
            setLogs('');
            setError(null);
        }
    }, [isOpen, containerId]);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLogs(containerId, tail);
            setLogs(data);
            // Auto scroll to bottom
            setTimeout(() => {
                logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">
                            容器日志: <span className="font-mono text-[var(--theme-primary)]">{containerName}</span>
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>行数:</span>
                            <select
                                value={tail}
                                onChange={e => setTail(Number(e.target.value))}
                                className="border border-gray-200 rounded px-2 py-1 outline-none focus:border-[var(--theme-primary)]"
                            >
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLogs}
                            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition shadow-sm"
                            title="刷新"
                        >
                            <Icon icon="fa-solid fa-rotate-right" className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition shadow-sm">
                            <Icon icon="fa-solid fa-times" className="text-xl" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-[#1e1e1e] p-4 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {error ? (
                        <div className="text-red-400 flex items-center gap-2">
                            <Icon icon="fa-solid fa-triangle-exclamation" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <>
                            {logs || <span className="text-gray-500 italic">暂无日志或加载中...</span>}
                            <div ref={logsEndRef} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
