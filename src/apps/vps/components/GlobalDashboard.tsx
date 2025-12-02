
import React, { useMemo, useState, useEffect } from 'react';
import { VpsServer, VpsGroup } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';

interface GlobalDashboardProps {
    servers: VpsServer[];
    groups: VpsGroup[];
    onConnect: (serverId: string) => void;
    onAddServer: () => void;
    onEditServer: (server: VpsServer) => void;
    onDeleteServer: (server: VpsServer) => void;
    onRefresh: () => void;
}

export default function GlobalDashboard({ servers, groups, onConnect, onAddServer, onEditServer, onDeleteServer, onRefresh }: GlobalDashboardProps) {
    const [activeTab, setActiveTab] = useState<string>('All');
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [editingGroup, setEditingGroup] = useState<VpsGroup | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [isAddingGroup, setIsAddingGroup] = useState(false);

    const stats = useMemo(() => {
        const total = servers.length;
        const online = servers.filter(s => s.status === 'online').length;
        const offline = servers.filter(s => s.status === 'offline').length;
        const unknown = total - online - offline;

        // OS Distribution
        const osDist: Record<string, number> = {};
        servers.forEach(s => {
            if (s.os_info) {
                // Simple normalization: take first word (Ubuntu, CentOS, Debian, etc.)
                const osName = s.os_info.split(' ')[0];
                osDist[osName] = (osDist[osName] || 0) + 1;
            } else {
                osDist['Unknown'] = (osDist['Unknown'] || 0) + 1;
            }
        });

        const cpuCores = servers.reduce((acc, s) => {
            const match = s.cpu_info?.match(/\((\d+)\s+Cores\)/);
            return acc + (match ? parseInt(match[1]) : 0);
        }, 0);
        const ramTotal = servers.reduce((acc, s) => {
            const match = s.mem_info?.match(/^(\d+)\s+MB/);
            return acc + (match ? parseInt(match[1]) : 0);
        }, 0);
        // Disk total is hard to sum due to units, skipping for now or just count count
        const diskTotal = 0;

        return { total, online, offline, unknown, osDist, cpuCores, ramTotal, diskTotal };
    }, [servers]);

    // Polling for status and latency
    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Only check if there are servers
                if (servers.length === 0) return;

                const token = localStorage.getItem('auth_token'); // Use auth_token as elsewhere
                const res = await fetch('/api/vps/servers/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids: servers.map(s => s.id) })
                });

                if (res.ok) {
                    const results = await res.json();
                    // We need to update the parent state with new status/latency
                    // Since props are read-only, we should probably call onRefresh 
                    // But calling onRefresh fetches everything which might be heavy?
                    // Ideally we should have a local state or a way to update just status.
                    // For now, let's just trigger a refresh which updates everything.
                    // Or better, we can't easily update props.servers.
                    // Let's assume onRefresh handles it.
                    onRefresh();
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        };

        // Check immediately on mount (if not just fetched)
        // checkStatus(); 

        const interval = setInterval(checkStatus, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [servers.length, onRefresh]); // Depend on length to avoid re-creating on every update if possible, but servers change...

    const filteredServers = useMemo(() => {
        if (activeTab === 'All') return servers;
        const group = groups.find(g => g.name === activeTab);
        return group ? servers.filter(s => s.group_id === group.id) : [];
    }, [servers, groups, activeTab]);

    // Group Management
    const handleAddGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/vps/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token} ` },
                body: JSON.stringify({ name: newGroupName })
            });
            onRefresh();
            setNewGroupName('');
            setIsAddingGroup(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRenameGroup = async (group: VpsGroup, newName: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/vps/groups/${group.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token} ` },
                body: JSON.stringify({ name: newName })
            });
            onRefresh();
            setEditingGroup(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('确定要删除此分组吗？组内服务器将变为未分组状态。')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/vps/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token} ` }
            });
            onRefresh();
            if (activeTab === groups.find(g => g.id === groupId)?.name) {
                setActiveTab('All');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">总览</h2>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Servers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Icon icon="fa-solid fa-server" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.total}</div>
                    <div className="text-sm text-gray-500">总服务器数</div>
                </div>

                {/* Online */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                            <Icon icon="fa-solid fa-signal" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Online</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.online}</div>
                    <div className="text-sm text-gray-500">在线服务器</div>
                </div>

                {/* Offline */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                            <Icon icon="fa-solid fa-power-off" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Offline</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.offline}</div>
                    <div className="text-sm text-gray-500">离线服务器</div>
                </div>

                {/* OS Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                            <Icon icon="fa-brands fa-linux" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Systems</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.osDist).slice(0, 3).map(([os, count]) => (
                            <span key={os} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {os}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Server List Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 overflow-hidden w-full md:w-auto">
                        <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap">服务器详情</h3>
                        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`
                                    px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all
                                    ${activeTab === 'All'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }
                                `}
                            >
                                全部
                            </button>
                            {groups.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setActiveTab(g.name)}
                                    className={`
                                        px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all
                                        ${activeTab === g.name
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={onAddServer}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Icon icon="fa-solid fa-plus" />
                            <span>添加服务器</span>
                        </button>
                        <button
                            onClick={() => setShowGroupSettings(true)}
                            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Icon icon="fa-solid fa-cog" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3 font-medium">状态</th>
                                <th className="px-6 py-3 font-medium">名称 / 主机</th>
                                <th className="px-6 py-3 font-medium">操作系统</th>
                                <th className="px-6 py-3 font-medium">CPU</th>
                                <th className="px-6 py-3 font-medium">内存</th>
                                <th className="px-6 py-3 font-medium">硬盘</th>
                                <th className="px-6 py-3 font-medium text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredServers.map(server => (
                                <tr key={server.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${server.status === 'online' ? 'bg-green-500' : server.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                            <span className="text-sm text-gray-500">
                                                {server.status === 'online'
                                                    ? (server.latency ? `${server.latency}ms` : 'Online')
                                                    : (server.status === 'error' ? 'Error' : 'Offline')
                                                }
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{server.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{server.host}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="fa-brands fa-linux" className="text-gray-400" />
                                            {server.os_info || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {server.cpu_info || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {server.mem_info || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{server.disk_info || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onConnect(server.id)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                                            >
                                                连接
                                            </button>
                                            <button
                                                onClick={() => onEditServer(server)}
                                                className="text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors"
                                                title="编辑"
                                            >
                                                <Icon icon="fa-solid fa-pen" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteServer(server)}
                                                className="text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                                                title="删除"
                                            >
                                                <Icon icon="fa-solid fa-trash" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {servers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Icon icon="fa-solid fa-server" className="text-5xl text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">暂无服务器</p>
                                            <p className="text-sm text-gray-500 mt-1">点击 "添加服务器" 按钮来添加您的第一台服务器。</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Group Settings Modal */}
            {showGroupSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">分组管理</h3>
                            <button onClick={() => setShowGroupSettings(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                {/* Add Group Input */}
                                {isAddingGroup ? (
                                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={e => setNewGroupName(e.target.value)}
                                            placeholder="输入分组名称"
                                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                            autoFocus
                                        />
                                        <button onClick={handleAddGroup} className="text-blue-600 hover:text-blue-700 px-2 font-medium text-sm">确定</button>
                                        <button onClick={() => setIsAddingGroup(false)} className="text-gray-400 hover:text-gray-600 px-2">
                                            <Icon icon="fa-solid fa-times" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setIsAddingGroup(true); setNewGroupName(''); }}
                                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors text-sm font-medium mb-4"
                                    >
                                        <Icon icon="fa-solid fa-plus" className="mr-2" /> 新增分组
                                    </button>
                                )}

                                {groups.map(group => (
                                    <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                        {editingGroup?.id === group.id ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newGroupName}
                                                    onChange={e => setNewGroupName(e.target.value)}
                                                    className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleRenameGroup(group, newGroupName)}
                                                    className="text-green-600 hover:text-green-700 px-2"
                                                >
                                                    <Icon icon="fa-solid fa-check" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingGroup(null)}
                                                    className="text-gray-400 hover:text-gray-600 px-2"
                                                >
                                                    <Icon icon="fa-solid fa-times" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium text-gray-700">{group.name}</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingGroup(group);
                                                            setNewGroupName(group.name);
                                                        }}
                                                        className="text-gray-400 hover:text-blue-600 p-1"
                                                        title="重命名"
                                                    >
                                                        <Icon icon="fa-solid fa-pen" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        className="text-gray-400 hover:text-red-600 p-1"
                                                        title="删除"
                                                    >
                                                        <Icon icon="fa-solid fa-trash" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {groups.length === 0 && !isAddingGroup && (
                                    <div className="text-center text-gray-400 text-sm py-4">
                                        暂无分组
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

