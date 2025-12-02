import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';

interface SystemOverviewProps {
    stats: {
        cpu: number;
        mem: { total: number; used: number };
        disk: number;
        net: { up: number; down: number };
    } | null;
    systemInfo: {
        os: string;
        cpu: { model: string; cores: string; arch: string };
        mem: { total: string; swap: string };
        disk: { total: string };
    } | null;
}

export default function SystemOverview({ stats, systemInfo }: SystemOverviewProps) {
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

    // Helper for info items
    const InfoItem = ({ icon, label, value, subValue }: { icon: string, label: string, value: string, subValue?: string }) => (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <Icon icon={icon} />
            </div>
            <div className="min-w-0">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-sm font-medium text-gray-800 truncate" title={value}>{value}</div>
                {subValue && <div className="text-xs text-gray-400">{subValue}</div>}
            </div>
        </div>
    );

    if (!stats) {
        return (
            <div className="bg-white p-6 border-b border-gray-200 flex items-center justify-center h-[200px]">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Icon icon="fa-solid fa-spinner" className="animate-spin" />
                    Waiting for data...
                </span>
            </div>
        );
    }

    const memPercent = stats.mem.total > 0 ? Math.round((stats.mem.used / stats.mem.total) * 100) : 0;

    return (
        <div className="bg-white border-b border-gray-200 flex flex-col">
            {/* Top Row: Real-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-100">
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

            {/* Bottom Row: System Details */}
            {systemInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white">
                    <InfoItem
                        icon="fa-brands fa-linux"
                        label="操作系统"
                        value={systemInfo.os}
                    />
                    <InfoItem
                        icon="fa-solid fa-microchip"
                        label="CPU 信息"
                        value={systemInfo.cpu.model}
                        subValue={`${systemInfo.cpu.cores} 核心 / ${systemInfo.cpu.arch}`}
                    />
                    <InfoItem
                        icon="fa-solid fa-memory"
                        label="内存容量"
                        value={`${systemInfo.mem.total} MB`}
                        subValue={`Swap: ${systemInfo.mem.swap} MB`}
                    />
                    <InfoItem
                        icon="fa-solid fa-hard-drive"
                        label="硬盘容量"
                        value={systemInfo.disk.total}
                    />
                </div>
            )}
        </div>
    );
}
