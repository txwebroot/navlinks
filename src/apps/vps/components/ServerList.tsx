import React, { useState, useEffect } from 'react';
import { VpsServer, VpsGroup } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import ServerFormModal from './ServerFormModal';

interface ServerListProps {
    onConnect?: (serverId: string) => void;
}

export default function ServerList({ onConnect }: ServerListProps) {
    const [servers, setServers] = useState<VpsServer[]>([]);
    const [groups, setGroups] = useState<VpsGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingServer, setEditingServer] = useState<VpsServer | null>(null);

    // Mock data for initial dev if API fails or is empty
    const fetchData = async () => {
        try {
            setLoading(true);
            // TODO: Replace with real API calls
            // const [serversRes, groupsRes] = await Promise.all([
            //     fetch('/api/vps/servers'),
            //     fetch('/api/vps/groups')
            // ]);
            // ...

            // Temporary Mock
            setTimeout(() => {
                setServers([
                    {
                        id: '1',
                        name: 'Production Web',
                        host: '192.168.1.100',
                        port: 22,
                        username: 'root',
                        auth_type: 'password',
                        status: 'online',
                        latency: 45,
                        os_info: 'Ubuntu 22.04 LTS',
                        cpu_info: '4 vCPU',
                        mem_info: '8GB / 16GB',
                        has_password: true
                    },
                    {
                        id: '2',
                        name: 'Database Master',
                        host: '192.168.1.101',
                        port: 22,
                        username: 'root',
                        auth_type: 'key',
                        status: 'offline',
                        has_private_key: true
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddServer = () => {
        setEditingServer(null);
        setShowModal(true);
    };

    const handleEditServer = (server: VpsServer) => {
        setEditingServer(server);
        setShowModal(true);
    };

    const handleSaveServer = async (serverData: Partial<VpsServer>) => {
        // TODO: Call API to save
        console.log('Saving server:', serverData);

        // Mock Update
        if (editingServer) {
            setServers(prev => prev.map(s => s.id === editingServer.id ? { ...s, ...serverData } as VpsServer : s));
        } else {
            const newServer = {
                ...serverData,
                id: Math.random().toString(36).substr(2, 9),
                status: 'unknown'
            } as VpsServer;
            setServers(prev => [...prev, newServer]);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading servers...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">服务器列表</h2>
                <button
                    onClick={handleAddServer}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <Icon icon="fa-solid fa-plus" />
                    <span>添加服务器</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map(server => (
                    <div key={server.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <Icon icon="fa-solid fa-server" className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{server.name}</h3>
                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <span>{server.host}</span>
                                        {server.port !== 22 && <span className="text-xs bg-gray-100 px-1.5 rounded text-gray-600">:{server.port}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${server.status === 'online' ? 'bg-green-50 text-green-600 border-green-100' :
                                    server.status === 'offline' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                        'bg-yellow-50 text-yellow-600 border-yellow-100'
                                }`}>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${server.status === 'online' ? 'bg-green-500' :
                                            server.status === 'offline' ? 'bg-gray-400' :
                                                'bg-yellow-500'
                                        }`}></span>
                                    {server.status.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="pl-[64px] space-y-2 mb-6">
                            {server.os_info && (
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                    <Icon icon="fa-brands fa-linux" className="w-4 text-center text-gray-400" />
                                    <span>{server.os_info}</span>
                                </div>
                            )}
                            {server.cpu_info && (
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                    <Icon icon="fa-solid fa-microchip" className="w-4 text-center text-gray-400" />
                                    <span>{server.cpu_info}</span>
                                </div>
                            )}
                        </div>

                        <div className="pl-[64px] flex gap-3">
                            <button
                                onClick={() => onConnect && onConnect(server.id)}
                                className="flex-1 bg-gray-50 hover:bg-[var(--theme-primary)] hover:text-white text-gray-600 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon icon="fa-solid fa-terminal" />
                                终端
                            </button>
                            <button
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                title="Files"
                            >
                                <Icon icon="fa-solid fa-folder-open" />
                            </button>
                            <button
                                onClick={() => handleEditServer(server)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                title="Settings"
                            >
                                <Icon icon="fa-solid fa-cog" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ServerFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSaveServer}
                initialData={editingServer}
                groups={groups}
            />
        </div>
    );
}
