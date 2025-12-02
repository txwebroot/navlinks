import React, { useState, useEffect } from 'react';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

interface AppConfig {
    enabledApps: {
        [key: string]: boolean;
    };
}

interface AppInfo {
    name: string;
    label: string;
    description: string;
    icon: string;
    canDisable: boolean;
}

const AVAILABLE_APPS: AppInfo[] = [
    {
        name: 'sub',
        label: '订阅管理',
        description: '管理您的订阅服务，跟踪到期时间和费用',
        icon: 'fa-solid fa-credit-card',
        canDisable: true
    },
    {
        name: 'docker',
        label: 'Docker管理',
        description: '管理Docker服务器、容器、镜像和网络资源',
        icon: 'fa-brands fa-docker',
        canDisable: true
    },
    {
        name: 'vps',
        label: 'VPS管理',
        description: '管理远程VPS服务器，支持SSH终端、文件管理和资源监控',
        icon: 'fa-solid fa-server',
        canDisable: true
    }
];

export const AppManagementSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { alertDialog, showAlert, hideAlert } = useDialogs();
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // 加载应用配置
    useEffect(() => {
        loadAppConfig();
    }, []);

    const loadAppConfig = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/app-management', {
                headers
            });

            if (response.ok) {
                const config = await response.json();
                setAppConfig(config);
            } else {
                console.error('加载应用配置失败:', response.status, response.statusText);
                // 使用默认配置
                setAppConfig({
                    enabledApps: {
                        sub: true
                    }
                });
            }
        } catch (error) {
            console.error('加载应用配置错误:', error);
            // 使用默认配置
            setAppConfig({
                enabledApps: {
                    sub: true
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleApp = async (appName: string) => {
        if (!appConfig) return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            showAlert('未登录', '请先登录后再进行操作！', 'warning');
            return;
        }

        setUpdating(appName);
        try {
            const newStatus = !appConfig.enabledApps[appName];

            const response = await fetch(`/api/app-management/${appName}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled: newStatus })
            });

            if (response.ok) {
                const result = await response.json();
                setAppConfig(result.config);

                // 如果禁用了当前应用，提示用户
                if (!newStatus && window.location.pathname.startsWith(`/${appName}`)) {
                    showAlert('应用已禁用', `${appName} 应用已禁用，页面将刷新`, 'info');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: '未知错误' }));
                console.error('更新应用状态失败:', response.status, errorData);
                showAlert('更新失败', errorData.error || response.statusText, 'error');
            }
        } catch (error) {
            console.error('更新应用状态错误:', error);
            showAlert('更新失败', error instanceof Error ? error.message : '网络错误', 'error');;
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!appConfig) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Icon icon="fa-solid fa-exclamation-triangle" className="text-4xl mb-4" />
                <p>加载配置失败</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">应用管理</h3>
                <p className="text-sm text-gray-500">启用或禁用系统中的应用模块</p>
            </div>

            <div className="space-y-4">
                {AVAILABLE_APPS.map(app => {
                    const isEnabled = appConfig.enabledApps[app.name] ?? false;
                    const isUpdating = updating === app.name;

                    return (
                        <div
                            key={app.name}
                            className={`
                                bg-white border rounded-xl p-6 transition-all
                                ${isEnabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
                            `}
                        >
                            <div className="flex items-start gap-4">
                                {/* 应用图标 */}
                                <div className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                                    ${isEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                                `}>
                                    <Icon icon={app.icon} className="text-xl" />
                                </div>

                                {/* 应用信息 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900">{app.label}</h4>
                                        {isEnabled && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                已启用
                                            </span>
                                        )}
                                        {!isEnabled && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                已禁用
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{app.description}</p>
                                </div>

                                {/* 开关按钮 */}
                                <div className="shrink-0">
                                    {app.canDisable ? (
                                        <button
                                            onClick={() => toggleApp(app.name)}
                                            disabled={isUpdating}
                                            className={`
                                                relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                                                ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
                                                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                                                    ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400">必需应用</span>
                                    )}
                                </div>
                            </div>

                            {/* 禁用提示 */}
                            {!isEnabled && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Icon icon="fa-solid fa-info-circle" className="text-yellow-600 mt-0.5" />
                                        <div className="text-xs text-yellow-800">
                                            <p className="font-medium mb-1">应用已禁用</p>
                                            <p>用户无法通过任何方式访问此应用，但数据将保留。</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <Icon icon="fa-solid fa-lightbulb" className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">💡 提示</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>禁用应用后，用户将无法访问该应用的任何功能</li>
                            <li>应用数据会被保留，重新启用后可立即恢复使用</li>
                            <li>如需删除应用数据，请前往"数据管理"页面操作</li>
                        </ul>
                    </div>
                </div>
            </div>

            {alertDialog && (
                <AlertDialog
                    isOpen={alertDialog.isOpen}
                    title={alertDialog.title}
                    message={alertDialog.message}
                    variant={alertDialog.variant}
                    onClose={hideAlert}
                />
            )}
        </div>
    );
}
