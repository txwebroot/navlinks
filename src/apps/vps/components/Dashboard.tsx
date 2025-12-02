import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { VpsServer } from '../types';

interface DashboardProps {
    stats: {
        cpu: number;
        mem: { total: number; used: number };
        disk: number;
        net: { up: number; down: number };
    } | null;
    server?: VpsServer;
}

export default function Dashboard({ stats, server }: DashboardProps) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatSpeed = (bytesPerSec: number) => {
        return formatBytes(bytesPerSec) + '/s';
    };

    if (!stats) {
        return (
            <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-center h-[80px]">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Icon icon="fa-solid fa-spinner" className="animate-spin" />
                    Waiting for data...
                </span>
            </div>
        );
    }

    const memPercent = stats.mem.total > 0 ? Math.round((stats.mem.used / stats.mem.total) * 100) : 0;

    return (
        <div className="bg-white p-4 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[100px]">
            {/* CPU */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-microchip" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">CPU</span>
                        <span className="text-sm font-bold text-gray-800">{stats.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.cpu > 80 ? 'bg-red-500' : 'bg-orange-500'}`}
                            style={{ width: `${stats.cpu}%` }}
                        ></div>
                    </div>
                    {server?.cpu_info && (
                        <div className="text-[10px] text-gray-400 mt-1 truncate" title={server.cpu_info}>
                            {server.cpu_info}
                        </div>
                    )}
                </div>
            </div>

            {/* Memory */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-memory" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">Memory</span>
                        <span className="text-sm font-bold text-gray-800">{memPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${memPercent > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                            style={{ width: `${memPercent}%` }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {Math.round(stats.mem.used / 1024)}MB / {Math.round(stats.mem.total / 1024)}MB
                    </div>
                    {server?.mem_info && server.mem_info.includes('Swap') && (
                        <div className="text-[10px] text-gray-400 truncate" title={server.mem_info}>
                            Swap: {server.mem_info.split('Swap:')[1].trim().replace(')', '')}
                        </div>
                    )}
                </div>
            </div>

            {/* Disk */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-hard-drive" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">Disk</span>
                        <span className="text-sm font-bold text-gray-800">{stats.disk}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.disk > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${stats.disk}%` }}
                        ></div>
                    </div>
                    {server?.disk_info && (
                        <div className="text-[10px] text-gray-400 mt-1 truncate">
                            Total: {server.disk_info}
                        </div>
                    )}
                </div>
            </div>

            {/* Network */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-network-wired" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon icon="fa-solid fa-arrow-down" className="text-green-500" />
                            <span>Down</span>
                        </div>
                        <span className="text-xs font-mono font-medium">{formatSpeed(stats.net.down)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon icon="fa-solid fa-arrow-up" className="text-blue-500" />
                            <span>Up</span>
                        </div>
                        <span className="text-xs font-mono font-medium">{formatSpeed(stats.net.up)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
