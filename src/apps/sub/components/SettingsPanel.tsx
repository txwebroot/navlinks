/**
 * 配置管理面板
 * 包含：时区设置、通知设置、各类通知配置
 */

console.log('[设置面板] 模块加载时间:', new Date().toLocaleTimeString());

import React, { useState, useEffect } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { NotificationSettings } from '../types/settings';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

interface SettingsPanelProps {
    onClose: () => void;
    subscriptions: any[];
    settings: NotificationSettings;
    onUpdateSettings: (settings: NotificationSettings) => void;
    isAuthenticated: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, subscriptions, settings, onUpdateSettings, isAuthenticated }) => {
    console.log('[设置面板] 组件渲染时间:', new Date().toLocaleTimeString());
    const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'data'>('general');
    const [subscriptionsData, setSubscriptionsData] = useState<string>('[]');
    const [testingNotification, setTestingNotification] = useState<string | null>(null);
    const { confirmDialog, showConfirm, hideConfirm, alertDialog, showAlert, hideAlert } = useDialogs();

    // 加载订阅数据
    useEffect(() => {
        setSubscriptionsData(JSON.stringify(subscriptions, null, 2));
    }, [subscriptions]);

    // 测试通知函数
    const handleTestNotification = async (platform: 'telegram' | 'notifyx' | 'webhook' | 'bark') => {
        setTestingNotification(platform);
        try {
            const token = localStorage.getItem('auth_token'); // 修正token key
            if (!token) {
                showAlert('需要登录', '请先登录！', 'error');
                setTestingNotification(null);
                return;
            }

            const response = await fetch('/api/subscriptions/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ platform, settings })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                showAlert('测试成功', `${platform.toUpperCase()} 测试通知发送成功！`, 'success');
            } else {
                showAlert('测试失败', `${platform.toUpperCase()} 测试失败：${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Test notification error:', error);
            showAlert('测试失败', `${error instanceof Error ? error.message : '未知错误'}`, 'error');
        } finally {
            setTestingNotification(null);
        }
    };

    // 导入数据
    const handleImportData = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const formData = new FormData();
                formData.append('file', file);

                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showAlert('认证失败', '未找到登录凭证，请重新登录', 'error');
                    return;
                }

                const response = await fetch('/api/subscriptions/import', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    showAlert('导入成功', result.message || '数据已成功导入，页面将自动刷新', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    const errorData = await response.json();
                    showAlert('导入失败', errorData.error || '数据导入失败，请检查数据格式', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showAlert('导入错误', '导入过程中发生错误', 'error');
            }
        };
        input.click();
    };


    // 清空数据
    const handleClearData = async () => {
        showConfirm('确认清空', '确定要清空所有订阅数据吗？此操作不可恢复！', async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/subscriptions/clear', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    showAlert('清空成功', '所有订阅数据已清空，页面将自动刷新', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showAlert('清空失败', '数据清空失败，请重试', 'error');
                }
            } catch (error) {
                showAlert('操作失败', '清空操作失败，请重试', 'error');
            } finally {
                hideConfirm();
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center backdrop-blur-sm animate-fade-in p-0 md:p-4">
            <div className="bg-white w-full max-w-7xl h-screen md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-14 md:h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 z-10 pt-safe">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-[var(--theme-primary)] text-white rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
                            <Icon icon="fa-solid fa-gear" className="text-base md:text-lg" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-gray-800">订阅管理配置</h2>
                            <p className="text-xs text-gray-400 hidden md:block">实时保存生效</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                            <Icon icon="fa-solid fa-times" className="text-lg md:text-xl" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs - 移动端隐藏，改为顶部标签 */}
                    <div className="hidden md:flex w-64 bg-gray-50 border-r border-gray-100 flex-col shrink-0 overflow-y-auto p-4">
                        <div className="space-y-2">
                            {[
                                { id: 'general', icon: 'fa-solid fa-gear', label: '常规设置' },
                                { id: 'notifications', icon: 'fa-solid fa-bell', label: '通知集成' },
                                { id: 'data', icon: 'fa-solid fa-database', label: '数据管理' },
                            ].map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id as any)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-[15px]
                                        ${activeSection === section.id
                                            ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-red-100'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }
                                    `}
                                >
                                    <Icon icon={section.icon} className={activeSection === section.id ? 'text-white' : 'text-gray-600'} />
                                    <span>{section.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* 移动端顶部标签切换 */}
                        <div className="md:hidden border-b border-gray-200 bg-white sticky top-0 z-10">
                            <div className="flex overflow-x-auto custom-scrollbar">
                                {[
                                    { id: 'general', icon: 'fa-solid fa-gear', label: '常规' },
                                    { id: 'notifications', icon: 'fa-solid fa-bell', label: '通知' },
                                    { id: 'data', icon: 'fa-solid fa-database', label: '数据' },
                                ].map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id as any)}
                                        className={`
                                            flex-1 min-w-[80px] flex flex-col items-center gap-1 px-4 py-3 transition-all
                                            ${activeSection === section.id
                                                ? 'text-[var(--theme-primary)] border-b-2 border-[var(--theme-primary)]'
                                                : 'text-gray-500'
                                            }
                                        `}
                                    >
                                        <Icon icon={section.icon} className="text-lg" />
                                        <span className="text-xs font-medium">{section.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white pb-safe">
                            {/* Authentication Warning */}
                            {!isAuthenticated && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                    <Icon icon="fa-solid fa-lock" className="text-yellow-600 mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-yellow-900 mb-1">需要登录才能修改设置</h4>
                                        <p className="text-sm text-yellow-700">
                                            您当前未登录。某些设置项需要登录后才能修改，以确保数据安全。
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* General Settings Section */}
                            {activeSection === 'general' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">基本设置</h3>
                                        <p className="text-sm text-gray-500 mb-6">配置时区和显示偏好</p>
                                    </div>

                                    {/* 时区设置 */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-clock" className="text-blue-500" />
                                            时区设置
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">选择时区</label>
                                                <select
                                                    value={settings.timezone || 'Asia/Shanghai'}
                                                    onChange={(e) => onUpdateSettings({ ...settings, timezone: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                >
                                                    <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                                                    <option value="America/New_York">东部时间 (UTC-5)</option>
                                                    <option value="America/Los_Angeles">太平洋时间 (UTC-8)</option>
                                                    <option value="Europe/London">伦敦时间 (UTC+0)</option>
                                                    <option value="Europe/Paris">巴黎时间 (UTC+1)</option>
                                                    <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
                                                    <option value="Asia/Dubai">迪拜时间 (UTC+4)</option>
                                                </select>
                                                <p className="mt-2 text-xs text-gray-500">当前时间：{new Date().toLocaleString('zh-CN', { timeZone: settings.timezone || 'Asia/Shanghai' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 分类管理 */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-tags" className="text-green-500" />
                                            分类管理
                                        </h4>
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-600">自定义订阅分类，便于管理和筛选</p>

                                            {/* 分类列表 */}
                                            <div className="space-y-2">
                                                {(settings.categories || []).map((category, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                        <Icon icon="fa-solid fa-tag" className="text-gray-400" />
                                                        <span className="flex-1 text-sm text-gray-700">{category}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newCategories = settings.categories.filter((_, i) => i !== index);
                                                                onUpdateSettings({ ...settings, categories: newCategories });
                                                            }}
                                                            className="text-red-500 hover:text-red-700 transition-colors"
                                                            title="删除分类"
                                                        >
                                                            <Icon icon="fa-solid fa-times" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 添加分类 */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="输入新分类名称"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const input = e.target as HTMLInputElement;
                                                            const newCategory = input.value.trim();
                                                            if (newCategory && !settings.categories.includes(newCategory)) {
                                                                onUpdateSettings({
                                                                    ...settings,
                                                                    categories: [...settings.categories, newCategory]
                                                                });
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                                        const newCategory = input.value.trim();
                                                        if (newCategory && !settings.categories.includes(newCategory)) {
                                                            onUpdateSettings({
                                                                ...settings,
                                                                categories: [...settings.categories, newCategory]
                                                            });
                                                            input.value = '';
                                                        } else if (!newCategory) {
                                                            showAlert('请输入分类名称', '请输入分类名称', 'warning');
                                                        } else {
                                                            showAlert('分类已存在', '该分类已存在', 'warning');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                                                >
                                                    <Icon icon="fa-solid fa-plus" />
                                                    添加
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">按 Enter 键或点击"添加"按钮添加新分类</p>
                                        </div>
                                    </div>

                                    {/* 显示设置 */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-palette" className="text-purple-500" />
                                            显示设置
                                        </h4>

                                        {/* 卡片颜色模式 */}
                                        <div className="space-y-4 mb-6">
                                            <label className="block text-sm font-medium text-gray-700">卡片颜色模式</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="cardColorMode"
                                                        checked={settings.display?.cardColorMode === 'status'}
                                                        onChange={() => onUpdateSettings({
                                                            ...settings,
                                                            display: { ...settings.display, cardColorMode: 'status' }
                                                        })}
                                                        className="text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                                                    />
                                                    <span className="text-sm text-gray-700">状态颜色（根据到期时间）</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="cardColorMode"
                                                        checked={settings.display?.cardColorMode === 'fixed'}
                                                        onChange={() => onUpdateSettings({
                                                            ...settings,
                                                            display: { ...settings.display, cardColorMode: 'fixed' }
                                                        })}
                                                        className="text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                                                    />
                                                    <span className="text-sm text-gray-700">固定颜色</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* 固定颜色选择器 */}
                                        {settings.display?.cardColorMode === 'fixed' && (
                                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">选择卡片颜色</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={settings.display?.cardColor || '#3b82f6'}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            display: { ...settings.display, cardColor: e.target.value }
                                                        })}
                                                        className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">{settings.display?.cardColor || '#3b82f6'}</p>
                                                        <p className="text-xs text-gray-500">所有卡片将使用该颜色</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 状态颜色自定义 */}
                                        {settings.display?.cardColorMode === 'status' && (
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">自定义状态颜色</label>
                                                {[
                                                    { key: 'normal', label: '正常 (15天以上)', default: '#10b981' },
                                                    { key: 'attention', label: '注意 (8-15天)', default: '#fbbf24' },
                                                    { key: 'warning', label: '警告 (4-7天)', default: '#fb923c' },
                                                    { key: 'urgent', label: '紧急 (0-3天)', default: '#ef4444' },
                                                    { key: 'expired', label: '已过期', default: '#6b7280' },
                                                ].map(status => (
                                                    <div key={status.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-700 font-medium">{status.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={settings.display?.statusColors?.[status.key as keyof typeof settings.display.statusColors] || status.default}
                                                                onChange={(e) => onUpdateSettings({
                                                                    ...settings,
                                                                    display: {
                                                                        ...settings.display,
                                                                        statusColors: {
                                                                            ...(settings.display?.statusColors || {
                                                                                normal: '#10b981',
                                                                                attention: '#fbbf24',
                                                                                warning: '#fb923c',
                                                                                urgent: '#ef4444',
                                                                                expired: '#6b7280',
                                                                            }),
                                                                            [status.key]: e.target.value
                                                                        }
                                                                    }
                                                                })}
                                                                className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                                                            />
                                                            <span className="text-xs text-gray-500 w-20 font-mono">
                                                                {settings.display?.statusColors?.[status.key as keyof typeof settings.display.statusColors] || status.default}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notifications Section */}
                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">通知集成</h3>
                                        <p className="text-sm text-gray-500 mb-6">配置各种通知渠道和提醒规则</p>
                                    </div>

                                    {/* 通知时段 */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-bell-concierge" className="text-orange-500" />
                                            通知时段
                                        </h4>
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-600">选择希望接收通知的时间段（基于您设置的时区）</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                                                    <input
                                                        type="time"
                                                        value={settings.notification?.timeRange?.start || '09:00'}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            notification: {
                                                                ...settings.notification,
                                                                timeRange: {
                                                                    ...settings.notification?.timeRange,
                                                                    start: e.target.value
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                                                    <input
                                                        type="time"
                                                        value={settings.notification?.timeRange?.end || '22:00'}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            notification: {
                                                                ...settings.notification,
                                                                timeRange: {
                                                                    ...settings.notification?.timeRange,
                                                                    end: e.target.value
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">只在该时间段内发送通知</p>
                                        </div>
                                    </div>

                                    {/* 通知间隔和次数 */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-repeat" className="text-green-500" />
                                            通知间隔和次数
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">通知间隔（小时）</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="24"
                                                    value={settings.notification?.interval || 6}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        notification: {
                                                            ...settings.notification,
                                                            interval: parseInt(e.target.value) || 6
                                                        }
                                                    })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">每隔多少小时发送一次通知</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">最大通知次数</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={settings.notification?.maxCount || 3}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        notification: {
                                                            ...settings.notification,
                                                            maxCount: parseInt(e.target.value) || 3
                                                        }
                                                    })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">达到此次数后停止通知</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Telegram 通知 */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                    <Icon icon="fa-brands fa-telegram" className="text-blue-600" />
                                                    Telegram 通知
                                                </h4>
                                                <p className="text-sm text-blue-700">通过 Telegram Bot 接收通知</p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.telegram?.enabled || false}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        telegram: { ...settings.telegram, enabled: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-blue-900">启用</span>
                                            </label>
                                        </div>
                                        {settings.telegram?.enabled && (
                                            <div className="space-y-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-900 mb-2">Bot Token</label>
                                                    <input
                                                        type="text"
                                                        value={settings.telegram?.botToken || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            telegram: { ...settings.telegram, botToken: e.target.value }
                                                        })}
                                                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                                        className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <p className="mt-1 text-xs text-blue-600">从 @BotFather 获取</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-900 mb-2">Chat ID</label>
                                                    <input
                                                        type="text"
                                                        value={settings.telegram?.chatId || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            telegram: { ...settings.telegram, chatId: e.target.value }
                                                        })}
                                                        placeholder="123456789"
                                                        className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <p className="mt-1 text-xs text-blue-600">从 @userinfobot 获取</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTestNotification('telegram')}
                                                    disabled={testingNotification === 'telegram' || !settings.telegram?.botToken || !settings.telegram?.chatId}
                                                    className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <Icon icon="fa-solid fa-paper-plane" />
                                                    {testingNotification === 'telegram' ? '发送中...' : '发送测试通知'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* NotifyX 通知 */}
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                                    <Icon icon="fa-solid fa-bell" className="text-purple-600" />
                                                    NotifyX 通知
                                                </h4>
                                                <p className="text-sm text-purple-700">通过 NotifyX 服务发送通知</p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifyx?.enabled || false}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        notifyx: { ...settings.notifyx, enabled: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-purple-900">启用</span>
                                            </label>
                                        </div>
                                        {settings.notifyx?.enabled && (
                                            <div className="space-y-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-purple-900 mb-2">API Key</label>
                                                    <input
                                                        type="text"
                                                        value={settings.notifyx?.apiKey || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            notifyx: { ...settings.notifyx, apiKey: e.target.value }
                                                        })}
                                                        placeholder="your-api-key-here"
                                                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-purple-900 mb-2">Endpoint</label>
                                                    <input
                                                        type="url"
                                                        value={settings.notifyx?.endpoint || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            notifyx: { ...settings.notifyx, endpoint: e.target.value }
                                                        })}
                                                        placeholder="https://api.notifyx.com/v1/notify"
                                                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleTestNotification('notifyx')}
                                                    disabled={testingNotification === 'notifyx' || !settings.notifyx?.apiKey}
                                                    className="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <Icon icon="fa-solid fa-paper-plane" />
                                                    {testingNotification === 'notifyx' ? '发送中...' : '发送测试通知'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Webhook 通知 */}
                                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                    <Icon icon="fa-solid fa-link" className="text-green-600" />
                                                    Webhook 通知
                                                </h4>
                                                <p className="text-sm text-green-700">通过 Webhook 发送通知到自定义服务</p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.webhook?.enabled || false}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        webhook: { ...settings.webhook, enabled: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm font-medium text-green-900">启用</span>
                                            </label>
                                        </div>
                                        {settings.webhook?.enabled && (
                                            <div className="space-y-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-green-900 mb-2">Webhook URL</label>
                                                    <input
                                                        type="url"
                                                        value={settings.webhook?.url || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            webhook: { ...settings.webhook, url: e.target.value }
                                                        })}
                                                        placeholder="https://your-server.com/webhook"
                                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-green-900 mb-2">HTTP 方法</label>
                                                    <select
                                                        value={settings.webhook?.method || 'POST'}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            webhook: { ...settings.webhook, method: e.target.value as 'GET' | 'POST' }
                                                        })}
                                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    >
                                                        <option value="POST">POST</option>
                                                        <option value="GET">GET</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-green-900 mb-2">
                                                        自定义请求头 (JSON 格式)
                                                        <span className="text-xs text-green-600 ml-2">可选</span>
                                                    </label>
                                                    <textarea
                                                        value={settings.webhook?.headers || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            webhook: { ...settings.webhook, headers: e.target.value }
                                                        })}
                                                        placeholder='{"Authorization": "Bearer YOUR_TOKEN", "Custom-Header": "value"}'
                                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                                        rows={3}
                                                    />
                                                    <p className="mt-1 text-xs text-green-600">例：{'{'}&quot;Authorization&quot;: &quot;Bearer token&quot;{'}'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-green-900 mb-2">
                                                        消息模板 (JSON 格式)
                                                        <span className="text-xs text-green-600 ml-2">可选</span>
                                                    </label>
                                                    <textarea
                                                        value={settings.webhook?.template || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            webhook: { ...settings.webhook, template: e.target.value }
                                                        })}
                                                        placeholder='{"text": "{{content}}", "title": "{{title}}"}'
                                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                                        rows={4}
                                                    />
                                                    <p className="mt-1 text-xs text-green-600">
                                                        支持变量：{'{{'}title{'}}'} {'{{'}content{'}}'} {'{{'}subscriptions{'}}'} {'{{'}timestamp{'}}'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleTestNotification('webhook')}
                                                    disabled={testingNotification === 'webhook' || !settings.webhook?.url}
                                                    className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <Icon icon="fa-solid fa-paper-plane" />
                                                    {testingNotification === 'webhook' ? '发送中...' : '发送测试通知'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bark 通知 */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                                    <Icon icon="fa-brands fa-apple" className="text-orange-600" />
                                                    Bark 通知
                                                </h4>
                                                <p className="text-sm text-orange-700">通过 Bark 发送 iOS 推送通知</p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.bark?.enabled || false}
                                                    onChange={(e) => onUpdateSettings({
                                                        ...settings,
                                                        bark: { ...settings.bark, enabled: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                                />
                                                <span className="text-sm font-medium text-orange-900">启用</span>
                                            </label>
                                        </div>
                                        {settings.bark?.enabled && (
                                            <div className="space-y-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-orange-900 mb-2">Device Key</label>
                                                    <input
                                                        type="text"
                                                        value={settings.bark?.deviceKey || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            bark: { ...settings.bark, deviceKey: e.target.value }
                                                        })}
                                                        placeholder="your-device-key"
                                                        className="w-full px-4 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                    <p className="mt-1 text-xs text-orange-600">从 Bark App 中获取</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-orange-900 mb-2">服务器地址</label>
                                                    <input
                                                        type="url"
                                                        value={settings.bark?.server || ''}
                                                        onChange={(e) => onUpdateSettings({
                                                            ...settings,
                                                            bark: { ...settings.bark, server: e.target.value }
                                                        })}
                                                        placeholder="https://api.day.app"
                                                        className="w-full px-4 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                    <p className="mt-1 text-xs text-orange-600">默认使用官方服务器</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTestNotification('bark')}
                                                    disabled={testingNotification === 'bark' || !settings.bark?.deviceKey}
                                                    className="w-full mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <Icon icon="fa-solid fa-paper-plane" />
                                                    {testingNotification === 'bark' ? '发送中...' : '发送测试通知'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Data Management Section */}
                            {activeSection === 'data' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-database" className="text-blue-500" />
                                            数据管理
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-6">导出、导入和备份订阅数据</p>
                                    </div>

                                    {/* 导出订阅数据 */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                                    <Icon icon="fa-solid fa-download" />
                                                    导出订阅数据
                                                </h3>
                                                <p className="text-sm text-blue-600 mt-1">保存所有订阅数据到本地，用于备份或迁移</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const token = localStorage.getItem('auth_token');
                                                            const response = await fetch('/api/subscriptions/export', {
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`
                                                                }
                                                            });
                                                            if (!response.ok) {
                                                                throw new Error('服务器返回错误');
                                                            }
                                                            const blob = await response.blob();
                                                            const url = URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `subscriptions-backup-${new Date().toISOString().split('T')[0]}.json`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                            URL.revokeObjectURL(url);
                                                        } catch (error) {
                                                            showAlert('下载失败', '无法下载数据，请重试', 'error');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                                                    type="button"
                                                >
                                                    <Icon icon="fa-solid fa-file-arrow-down" />
                                                    下载文件
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={subscriptionsData}
                                            className="w-full h-48 font-mono text-xs bg-white/80 text-gray-700 border border-blue-200 rounded-lg p-4 resize-none"
                                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                        />
                                    </div>

                                    {/* 导入订阅数据 */}
                                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border border-green-200 shadow-sm">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2 mb-2">
                                                <Icon icon="fa-solid fa-upload" />
                                                导入订阅数据
                                            </h3>
                                            <p className="text-sm text-green-600">从本地文件恢复订阅数据</p>
                                        </div>
                                        <div className="bg-white/80 p-4 rounded-lg border-2 border-dashed border-green-300">
                                            <button
                                                onClick={handleImportData}
                                                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                            >
                                                <Icon icon="fa-solid fa-file-import" />
                                                选择文件导入
                                            </button>
                                            <p className="text-xs text-green-600 mt-3 text-center">
                                                ⚠️ 导入将覆盖现有数据，请先备份
                                            </p>
                                        </div>
                                    </div>

                                    {/* 清空数据 */}
                                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200 shadow-sm">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-2">
                                                <Icon icon="fa-solid fa-trash-can" />
                                                清空所有数据
                                            </h3>
                                            <p className="text-sm text-red-600">删除所有订阅记录，此操作不可恢复</p>
                                        </div>
                                        <button
                                            onClick={handleClearData}
                                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            <Icon icon="fa-solid fa-exclamation-triangle" />
                                            清空所有数据
                                        </button>
                                    </div>

                                    {/* 数据统计 */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <Icon icon="fa-solid fa-chart-pie" />
                                            数据统计
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                                <p className="text-sm text-purple-600 mb-1 font-medium">订阅总数</p>
                                                <p className="text-3xl font-bold text-purple-800">
                                                    {JSON.parse(subscriptionsData).length}
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                                                <p className="text-sm text-indigo-600 mb-1 font-medium">数据大小</p>
                                                <p className="text-3xl font-bold text-indigo-800">
                                                    {(new Blob([subscriptionsData]).size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 立即检查通知（测试功能） */}
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-xl border border-orange-200 shadow-sm">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-2">
                                                <Icon icon="fa-solid fa-bell-concierge" />
                                                立即检查通知
                                            </h3>
                                            <p className="text-sm text-orange-600">手动触发订阅到期检查并发送通知（用于测试）</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                console.log('[前端] 点击了检查按钮');
                                                if (!isAuthenticated) {
                                                    showAlert('需要登录', '请先登录后再执行此操作！', 'error');
                                                    return;
                                                }

                                                console.log('[前端] 准备发送请求...');
                                                try {
                                                    const token = localStorage.getItem('auth_token');
                                                    console.log('[前端] Token:', token ? '存在' : '不存在');

                                                    const requestBody = { force: true };
                                                    console.log('[前端] 请求Body:', requestBody);

                                                    const response = await fetch('/api/subscriptions/check-expiry', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify(requestBody)
                                                    });

                                                    console.log('[前端] 收到响应:', response.status);
                                                    const result = await response.json();
                                                    console.log('[前端] 响应结果:', result);

                                                    if (result.success) {
                                                        showAlert('检查完成', result.message, 'success');
                                                    } else {
                                                        showAlert('检查失败', result.message, 'error');
                                                    }
                                                } catch (error) {
                                                    console.error('[前端] 请求失败:', error);
                                                    showAlert('检查失败', error instanceof Error ? error.message : '未知错误', 'error');
                                                }
                                            }}
                                            disabled={!isAuthenticated}
                                            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                                        >
                                            <Icon icon="fa-solid fa-rocket" />
                                            立即检查并发送通知
                                        </button>
                                        <p className="text-xs text-orange-600 mt-3 text-center">
                                            🔔 将立即检查所有需要提醒的订阅并发送通知
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {confirmDialog && (
                    <ConfirmDialog
                        isOpen={confirmDialog.isOpen}
                        title={confirmDialog.title}
                        message={confirmDialog.message}
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={hideConfirm}
                    />
                )}

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
        </div>
    );
};
