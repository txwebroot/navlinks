import React, { useState } from 'react';
import { AdminTabProps } from '../types';
import { Button } from '../ui/AdminButton';
import { Icon } from '@/src/shared/components/common/Icon';
import { checkAllLinks, getHealthStats, getUnhealthyLinks } from '@/src/shared/utils/linkHealthChecker';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

export const LinkHealthSettings: React.FC<AdminTabProps> = ({ config, setConfig }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant?: 'success' | 'error' | 'info' | 'warning';
    } | null>(null);

    const stats = getHealthStats(config);
    const unhealthyLinks = getUnhealthyLinks(config);

    // 检测所有链接
    const handleCheckAll = async () => {
        if (isChecking) return;

        setIsChecking(true);
        setProgress({ current: 0, total: 0 });

        try {
            const updatedConfig = await checkAllLinks(config, (current, total) => {
                setProgress({ current, total });
            });

            if (setConfig) {
                setConfig(updatedConfig);
                setLastCheckTime(new Date().toLocaleString('zh-CN'));

                // 使用更新后的配置计算统计数据
                const newStats = getHealthStats(updatedConfig);
                setAlertDialog({
                    isOpen: true,
                    title: '检测完成',
                    message: `总链接: ${newStats.total}\n健康: ${newStats.healthy}\n失效: ${newStats.unhealthy}`,
                    variant: 'success'
                });
            }
        } catch (error) {
            setAlertDialog({
                isOpen: true,
                title: '检测失败',
                message: (error as Error).message,
                variant: 'error'
            });
            console.error('Health check error:', error);
        } finally {
            setIsChecking(false);
        }
    };

    // 批量删除失效链接
    const handleBatchDelete = () => {
        if (unhealthyLinks.length === 0) {
            setAlertDialog({
                isOpen: true,
                title: '提示',
                message: '没有失效链接需要清理',
                variant: 'info'
            });
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: '确认删除失效链接',
            message: `确定要删除所有 ${unhealthyLinks.length} 个失效链接吗？\n此操作不可撤销！`,
            onConfirm: () => {
                setConfirmDialog(null);
                performBatchDelete();
            }
        });
    };

    const performBatchDelete = () => {

        const newConfig = JSON.parse(JSON.stringify(config));

        // 从配置中删除失效链接
        newConfig.categories.forEach((category: any) => {
            if (category.items) {
                category.items = category.items.filter((item: any) =>
                    !item.health || item.health.isHealthy
                );
            }

            if (category.subCategories) {
                category.subCategories.forEach((subCat: any) => {
                    subCat.items = subCat.items.filter((item: any) =>
                        !item.health || item.health.isHealthy
                    );
                });
            }
        });

        newConfig.promo.forEach((tab: any) => {
            tab.items = tab.items.filter((item: any) =>
                !item.health || item.health.isHealthy
            );
        });

        if (setConfig) {
            setConfig(newConfig);
            setAlertDialog({
                isOpen: true,
                title: '删除成功',
                message: `已删除 ${unhealthyLinks.length} 个失效链接`,
                variant: 'success'
            });
        }
    };

    // 清除所有健康检测数据
    const handleClearHealthData = () => {
        setConfirmDialog({
            isOpen: true,
            title: '确认清除数据',
            message: '确定要清除所有链接的健康检测数据吗？',
            onConfirm: () => {
                setConfirmDialog(null);
                performClearHealthData();
            }
        });
    };

    const performClearHealthData = () => {

        const newConfig = JSON.parse(JSON.stringify(config));

        const clearHealth = (items: any[]) => {
            items.forEach(item => delete item.health);
        };

        newConfig.categories.forEach

            ((category: any) => {
                if (category.items) clearHealth(category.items);
                if (category.subCategories) {
                    category.subCategories.forEach((subCat: any) => clearHealth(subCat.items));
                }
            });

        newConfig.promo.forEach((tab: any) => clearHealth(tab.items));

        if (setConfig) {
            setConfig(newConfig);
            setLastCheckTime(null);
            setAlertDialog({
                isOpen: true,
                title: '清除成功',
                message: '已清除所有健康检测数据',
                variant: 'success'
            });
        }
    };

    // 自动检测设置
    const [scheduleEnabled, setScheduleEnabled] = useState(config.healthCheckSchedule?.enabled || false);
    const [scheduleTime, setScheduleTime] = useState(config.healthCheckSchedule?.time || '03:00');
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    const handleSaveSchedule = async () => {
        setIsSavingSchedule(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/health-check-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    enabled: scheduleEnabled,
                    time: scheduleTime
                })
            });

            if (response.ok) {
                if (setConfig) {
                    setConfig({
                        ...config,
                        healthCheckSchedule: {
                            enabled: scheduleEnabled,
                            time: scheduleTime
                        }
                    });
                }
                setAlertDialog({
                    isOpen: true,
                    title: '保存成功',
                    message: '自动检测计划已保存',
                    variant: 'success'
                });
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            setAlertDialog({
                isOpen: true,
                title: '保存失败',
                message: (error as Error).message,
                variant: 'error'
            });
        } finally {
            setIsSavingSchedule(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h3 className="text-xl font-bold text-gray-800 sticky top-0 bg-white/95 backdrop-blur py-2 z-10 border-b border-gray-100">
                链接健康检测
            </h3>

            {/* Schedule Settings */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                            <Icon icon="fa-solid fa-clock" />
                            自动定时检测
                        </h3>
                        <p className="text-sm text-indigo-600 mt-1">
                            设置系统每天自动检测所有链接的时间
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        className="bg-indigo-500 hover:bg-indigo-600 border-indigo-600"
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule}
                    >
                        <Icon icon={isSavingSchedule ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} className="mr-1" />
                        {isSavingSchedule ? '保存中...' : '保存设置'}
                    </Button>
                </div>

                <div className="mt-4 flex items-center gap-6 bg-white/60 p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={scheduleEnabled}
                                onChange={(e) => setScheduleEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">启用自动检测</span>
                        </label>
                    </div>

                    {scheduleEnabled && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <span className="text-sm font-medium text-gray-700">检测时间:</span>
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Overview Statistics */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                            <Icon icon="fa-solid fa-chart-line" />
                            健康状况统计
                        </h3>
                        <p className="text-sm text-blue-600 mt-1">
                            {lastCheckTime ? `最后检测: ${lastCheckTime}` : '尚未进行检测'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            className="bg-blue-500 hover:bg-blue-600 border-blue-600"
                            onClick={handleCheckAll}
                            disabled={isChecking}
                        >
                            <Icon icon={isChecking ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-stethoscope'} className="mr-1" />
                            {isChecking ? '检测中...' : '检测所有链接'}
                        </Button>
                        {stats.total > 0 && (
                            <Button variant="secondary" onClick={handleClearHealthData}>
                                <Icon icon="fa-solid fa-eraser" className="mr-1" />
                                清除数据
                            </Button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {isChecking && progress.total > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-blue-700 mb-2">
                            <span>检测进度</span>
                            <span>{progress.current} / {progress.total}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Icon icon="fa-solid fa-link" />
                            <span className="text-sm">总链接数</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                            <Icon icon="fa-solid fa-circle-check" />
                            <span className="text-sm">健康链接</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                            <Icon icon="fa-solid fa-triangle-exclamation" />
                            <span className="text-sm">失效链接</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">{stats.unhealthy}</div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Icon icon="fa-solid fa-clock" />
                            <span className="text-sm">平均响应</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                            {stats.avgResponseTime}
                            <span className="text-sm font-normal text-gray-500 ml-1">ms</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unhealthy Links List */}
            {stats.unhealthy > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <Icon icon="fa-solid fa-circle-exclamation" />
                                失效链接列表
                            </h3>
                            <p className="text-sm text-red-600 mt-1">
                                共 {unhealthyLinks.length} 个链接无法访问
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            className="bg-red-500 hover:bg-red-600 border-red-600"
                            onClick={handleBatchDelete}
                        >
                            <Icon icon="fa-solid fa-trash" className="mr-1" />
                            批量清理
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {unhealthyLinks.map((link, index) => (
                            <div
                                key={index}
                                className="bg-white/80 p-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon={link.item.icon || 'fa-solid fa-link'} className="text-red-500" />
                                            <h4 className="font-bold text-gray-800">{link.item.title}</h4>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-1 break-all">{link.item.url}</p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-gray-500">
                                                <Icon icon="fa-solid fa-folder" className="mr-1" />
                                                {link.categoryName}
                                                {link.subCategoryName && ` / ${link.subCategoryName}`}
                                            </span>
                                            {link.item.health?.statusCode && (
                                                <span className="text-red-600">
                                                    状态码: {link.item.health.statusCode}
                                                </span>
                                            )}
                                            {link.item.health?.errorMessage && (
                                                <span className="text-red-600">
                                                    {link.item.health.errorMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {stats.total === 0 && (
                <div className="bg-gray-50 p-12 rounded-xl border border-gray-200 text-center">
                    <Icon icon="fa-solid fa-inbox" className="text-5xl text-gray-300 mb-4" />
                    <p className="text-gray-600">暂无链接数据</p>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <Icon icon="fa-solid fa-lightbulb" />
                    使用说明
                </h3>
                <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-start gap-2">
                        <Icon icon="fa-solid fa-check" className="mt-0.5 text-purple-500" />
                        <span>点击"检测所有链接"开始全站链接健康检测</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Icon icon="fa-solid fa-check" className="mt-0.5 text-purple-500" />
                        <span>失效链接会在首页显示红色警告标记</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Icon icon="fa-solid fa-check" className="mt-0.5 text-purple-500" />
                        <span>健康链接鼠标悬停时会显示响应时间</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Icon icon="fa-solid fa-check" className="mt-0.5 text-purple-500" />
                        <span>使用"批量清理"可一键删除所有失效链接</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Icon icon="fa-solid fa-info-circle" className="mt-0.5 text-purple-500" />
                        <span>检测数据会自动保存到配置文件中</span>
                    </li>
                </ul>
            </div>

            {/* 确认对话框 */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            {/* 提示对话框 */}
            {alertDialog && (
                <AlertDialog
                    isOpen={alertDialog.isOpen}
                    title={alertDialog.title}
                    message={alertDialog.message}
                    variant={alertDialog.variant}
                    onClose={() => setAlertDialog(null)}
                />
            )}
        </div>
    );
};
