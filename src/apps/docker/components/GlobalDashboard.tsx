import React, { useMemo } from 'react';
import { DockerServer, SystemInfo, AuditLog } from '../types/docker';
import { Icon } from '@/src/shared/components/common/Icon';
import { useAllDockerServersInfo, useDockerAuditLogs } from '../hooks/useDocker';

interface GlobalDashboardProps {
    servers: DockerServer[];
    onSelectServer: (server: DockerServer) => void;
    onEditServer: (server: DockerServer) => void;
    onDeleteServer: (serverId: string) => void;
    onSetDefault: (serverId: string) => void;
    onAddServer: () => void;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ servers, onSelectServer, onEditServer, onDeleteServer, onSetDefault, onAddServer }) => {
    const { allInfo, loading, loadAllInfo } = useAllDockerServersInfo(servers);
    const { logs, loading: logsLoading, loadLogs } = useDockerAuditLogs(undefined, 10);

    const stats = useMemo(() => {
        let totalContainers = 0;
        let runningContainers = 0;
        let pausedContainers = 0;
        let stoppedContainers = 0;
        let totalImages = 0;
        let totalCPUs = 0;
        let totalMemory = 0;
        let onlineServers = 0;

        servers.forEach(server => {
            if (server.status === 'online') onlineServers++;
            const info = allInfo[server.id];
            if (info) {
                totalContainers += info.containers;
                runningContainers += info.containersRunning;
                pausedContainers += info.containersPaused;
                stoppedContainers += info.containersStopped;
                totalImages += info.images;
                totalCPUs += info.cpus;
                totalMemory += info.memory;
            }
        });

        return {
            totalContainers,
            runningContainers,
            pausedContainers,
            stoppedContainers,
            totalImages,
            totalCPUs,
            totalMemory,
            onlineServers
        };
    }, [servers, allInfo]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const handleRefresh = () => {
        loadAllInfo();
        loadLogs();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Quick Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">全局概览</h2>
                    <p className="text-gray-500 text-sm mt-1">查看所有服务器的运行状态和最近活动</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition shadow-sm"
                >
                    <Icon icon={`fa-solid fa-refresh ${loading || logsLoading ? 'animate-spin' : ''}`} />
                    <span>刷新数据</span>
                </button>
            </div>

            {/* Aggregate Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                            <Icon icon="fa-solid fa-server" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Servers</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{servers.length}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {stats.onlineServers} 在线</span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {servers.length - stats.onlineServers} 离线</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition">
                            <Icon icon="fa-solid fa-box" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Containers</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalContainers}</div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-green-600 font-medium">{stats.runningContainers} 运行</span>
                        <span className="text-orange-500">{stats.pausedContainers} 暂停</span>
                        <span className="text-gray-400">{stats.stoppedContainers} 停止</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition">
                            <Icon icon="fa-solid fa-layer-group" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Images</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalImages}</div>
                    <div className="text-sm text-gray-500">本地镜像总数</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition">
                            <Icon icon="fa-solid fa-microchip" className="text-xl" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Resources</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalCPUs} <span className="text-sm font-normal text-gray-400">Cores</span></div>
                    <div className="text-sm text-gray-500">内存: {formatBytes(stats.totalMemory)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Server Grid (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon icon="fa-solid fa-server" className="text-[var(--theme-primary)]" />
                        服务器状态
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {servers.map(server => {
                            const info = allInfo[server.id];
                            const isOnline = server.status === 'online';

                            return (
                                <div
                                    key={server.id}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer group relative overflow-hidden"
                                    onClick={() => onSelectServer(server)}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-[var(--theme-primary)] transition flex items-center gap-2">
                                                    {server.name}
                                                    {server.is_default === 1 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">DEFAULT</span>}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <span>{isOnline ? '运行正常' : '连接断开'}</span>
                                                    {isOnline && <span className="text-gray-300">|</span>}
                                                    {isOnline && <span>{server.latency}ms</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {server.is_default !== 1 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSetDefault(server.id); }}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition"
                                                        title="设为默认"
                                                    >
                                                        <Icon icon="fa-solid fa-star" className="text-sm" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditServer(server); }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                                                    title="编辑"
                                                >
                                                    <Icon icon="fa-solid fa-pen" className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteServer(server.id); }}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                                                    title="删除"
                                                >
                                                    <Icon icon="fa-solid fa-trash" className="text-sm" />
                                                </button>
                                            </div>
                                        </div>

                                        {loading && !info ? (
                                            <div className="py-4 flex justify-center">
                                                <div className="w-5 h-5 border-2 border-gray-200 border-t-[var(--theme-primary)] rounded-full animate-spin"></div>
                                            </div>
                                        ) : info ? (
                                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-700">{info.containersRunning}</div>
                                                    <div className="text-xs text-gray-400">运行容器</div>
                                                </div>
                                                <div className="text-center border-l border-gray-100">
                                                    <div className="text-lg font-bold text-gray-700">{info.images}</div>
                                                    <div className="text-xs text-gray-400">镜像</div>
                                                </div>
                                                <div className="text-center border-l border-gray-100">
                                                    <div className="text-lg font-bold text-gray-700">{info.cpus}</div>
                                                    <div className="text-xs text-gray-400">CPU</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 pt-3 border-t border-gray-50 text-center text-sm text-gray-400">
                                                暂无详细数据
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Server Card */}
                        <button
                            className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--theme-primary)] hover:bg-white transition flex flex-col items-center justify-center min-h-[160px] group text-gray-400 hover:text-[var(--theme-primary)]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddServer();
                            }}
                        >
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-2 group-hover:border-[var(--theme-primary)] group-hover:scale-110 transition">
                                <Icon icon="fa-solid fa-plus" className="text-lg" />
                            </div>
                            <span className="font-medium text-sm">添加服务器</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activity (1/3 width) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon icon="fa-solid fa-clock-rotate-left" className="text-orange-500" />
                        最近活动
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[400px]">
                        <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
                            {logsLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : logs.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {logs.map((log: AuditLog) => {
                                        const server = servers.find(s => s.id === log.server_id);
                                        const isSuccess = log.status === 'success';
                                        let icon = 'fa-solid fa-info-circle';
                                        let color = 'text-blue-500 bg-blue-50';

                                        if (log.action.includes('start')) { icon = 'fa-solid fa-play'; color = 'text-green-500 bg-green-50'; }
                                        else if (log.action.includes('stop')) { icon = 'fa-solid fa-stop'; color = 'text-orange-500 bg-orange-50'; }
                                        else if (log.action.includes('delete') || log.action.includes('remove')) { icon = 'fa-solid fa-trash'; color = 'text-red-500 bg-red-50'; }
                                        else if (log.action.includes('create')) { icon = 'fa-solid fa-plus'; color = 'text-blue-500 bg-blue-50'; }

                                        return (
                                            <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                                        <Icon icon={icon} className="text-xs" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-800 truncate">
                                                            {log.action} {log.resource_type}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {log.resource_name || (log.resource_id ? log.resource_id.substring(0, 12) : '-')}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                                {server?.name || 'Unknown Server'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {formatDate(log.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!isSuccess && (
                                                        <div className="text-red-500 text-xs" title={log.error_message}>
                                                            <Icon icon="fa-solid fa-exclamation-circle" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                    <Icon icon="fa-regular fa-clipboard" className="text-4xl mb-2 opacity-20" />
                                    <p className="text-sm">暂无活动记录</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalDashboard;
