/**
 * Sub 应用 - 订阅管理系统
 * 功能：跟踪各类订阅服务的到期时间，提供智能提醒
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { Subscription, SubscriptionFilter } from './types/subscription';
import { SubscriptionForm } from './components/SubscriptionForm';
import { Modal } from './components/Modal';
import { ReminderToast } from './components/ReminderToast';
import { SettingsPanel } from './components/SettingsPanel';
import { checkReminders } from './utils/reminderUtils';
import { useSubscriptions } from './hooks/useSubscriptions';
import TopNavbar from '@/src/apps/navlink/components/layout/TopNavbar';
import LoginDialog from '@/src/shared/components/common/LoginDialog';
import SearchModal from '@/src/apps/navlink/components/common/SearchModal';

// New Components
import { SubLayout } from './components/layout/SubLayout';
import { Dashboard } from './components/views/Dashboard';
import { SubscriptionList } from './components/views/SubscriptionList';
import { CalendarView } from './components/views/CalendarView';
import { ReminderList } from './components/views/ReminderList';

import { DEFAULT_SETTINGS, NotificationSettings } from './types/settings';
import { useCustomReminders } from './hooks/useCustomReminders';
import { ReminderForm } from './components/ReminderForm';
import { CustomReminder } from './types/reminder';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';

function SubApp() {
    const { config, isLoaded, isAuthenticated, logout } = useConfig();
    const { subscriptions, loading, loadSubscriptions, createSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
    const { reminders: customReminders, loading: remindersLoading, createReminder, updateReminder, deleteReminder } = useCustomReminders();
    const { confirmDialog, showConfirm, hideConfirm } = useDialogs();

    // View State
    const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'calendar' | 'reminders' | 'settings'>(() => {
        return (localStorage.getItem('sub_active_view') as any) || 'dashboard';
    });

    // Settings State
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

    // 从服务器加载设置（优先级高于 LocalStorage）
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/subscriptions/settings/notifications');
                if (response.ok) {
                    const serverSettings = await response.json();
                    const merged = {
                        ...DEFAULT_SETTINGS,
                        ...serverSettings,
                        display: { ...DEFAULT_SETTINGS.display, ...serverSettings.display },
                        defaults: { ...DEFAULT_SETTINGS.defaults, ...serverSettings.defaults }
                    };
                    setSettings(merged);
                    // 同步到 LocalStorage
                    localStorage.setItem('sub_notification_settings', JSON.stringify(merged));
                    console.log('[设置] 已从服务器加载设置');
                } else {
                    // 服务器没有设置，使用 LocalStorage
                    const saved = localStorage.getItem('sub_notification_settings');
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            const merged = {
                                ...DEFAULT_SETTINGS,
                                ...parsed,
                                display: { ...DEFAULT_SETTINGS.display, ...parsed.display },
                                defaults: { ...DEFAULT_SETTINGS.defaults, ...parsed.defaults }
                            };
                            setSettings(merged);
                        } catch (e) {
                            setSettings(DEFAULT_SETTINGS);
                        }
                    }
                }
            } catch (error) {
                console.error('[设置] 从服务器加载失败，使用本地设置:', error);
                // 加载失败，使用 LocalStorage
                const saved = localStorage.getItem('sub_notification_settings');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const merged = {
                            ...DEFAULT_SETTINGS,
                            ...parsed,
                            display: { ...DEFAULT_SETTINGS.display, ...parsed.display },
                            defaults: { ...DEFAULT_SETTINGS.defaults, ...parsed.defaults }
                        };
                        setSettings(merged);
                    } catch (e) {
                        setSettings(DEFAULT_SETTINGS);
                    }
                }
            }
        };
        loadSettings();
    }, []);

    // Persist view state
    useEffect(() => {
        if (activeView !== 'settings') {
            localStorage.setItem('sub_active_view', activeView);
        }
    }, [activeView]);

    // Persist settings
    const handleUpdateSettings = async (newSettings: NotificationSettings) => {
        setSettings(newSettings);
        localStorage.setItem('sub_notification_settings', JSON.stringify(newSettings));

        // 保存到服务器（如果已登录）
        if (isAuthenticated) {
            try {
                const token = localStorage.getItem('auth_token');
                await fetch('/api/subscriptions/settings/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token} `
                    },
                    body: JSON.stringify(newSettings)
                });
                console.log('[设置] 已同步到服务器，定时任务将自动更新');
            } catch (error) {
                console.error('[设置] 保存到服务器失败:', error);
            }
        }
    };

    // 登录后从服务器重新加载设置
    useEffect(() => {
        if (isAuthenticated) {
            const reloadSettings = async () => {
                try {
                    const response = await fetch('/api/subscriptions/settings/notifications');
                    if (response.ok) {
                        const serverSettings = await response.json();
                        const merged = {
                            ...DEFAULT_SETTINGS,
                            ...serverSettings,
                            display: { ...DEFAULT_SETTINGS.display, ...serverSettings.display },
                            defaults: { ...DEFAULT_SETTINGS.defaults, ...serverSettings.defaults }
                        };
                        setSettings(merged);
                        localStorage.setItem('sub_notification_settings', JSON.stringify(merged));
                        console.log('[设置] 登录后已从服务器重新加载设置');
                    }
                } catch (error) {
                    console.error('[设置] 登录后加载设置失败:', error);
                }
            };
            reloadSettings();
        }
    }, [isAuthenticated]); // 只在登录状态改变时执行

    const [showModal, setShowModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Reminder modal state
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState<CustomReminder | null>(null);

    // Calculate reminders
    const reminders = useMemo(() => {
        return checkReminders(subscriptions);
    }, [subscriptions]);

    // Handlers
    const handleAdd = () => {
        if (!isAuthenticated) {
            alert('⚠️ 请先登录后再添加订阅！');
            setShowLogin(true);
            return;
        }
        setEditingSubscription(null);
        setShowModal(true);
    };

    const handleEdit = (subscription: Subscription) => {
        if (!isAuthenticated) {
            alert('⚠️ 请先登录后再编辑订阅！');
            setShowLogin(true);
            return;
        }
        setEditingSubscription(subscription);
        setShowModal(true);
    };

    const handleSave = async (data: Partial<Subscription>) => {
        try {
            if (editingSubscription) {
                await updateSubscription(editingSubscription.id, data);
            } else {
                await createSubscription(data as Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>);
            }
            setShowModal(false);
            setEditingSubscription(null);
        } catch (error) {
            alert('操作失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleDelete = async (id: string, name: string) => {
        showConfirm('确认删除', `确定要删除订阅「${name}」吗？`, async () => {
            try {
                await deleteSubscription(id);
            } catch (error) {
                alert('删除失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
            } finally {
                hideConfirm();
            }
        });
    };

    // Reminder handlers
    const handleAddReminder = () => {
        if (!isAuthenticated) {
            alert('⚠️ 请先登录后再添加提醒！');
            setShowLogin(true);
            return;
        }
        setEditingReminder(null);
        setShowReminderModal(true);
    };

    const handleEditReminder = (reminder: CustomReminder) => {
        if (!isAuthenticated) {
            alert('⚠️ 请先登录后再编辑提醒！');
            setShowLogin(true);
            return;
        }
        setEditingReminder(reminder);
        setShowReminderModal(true);
    };

    const handleSaveReminder = async (data: any) => {
        try {
            if (editingReminder) {
                await updateReminder(editingReminder.id, data);
            } else {
                await createReminder(data);
            }
            setShowReminderModal(false);
            setEditingReminder(null);
        } catch (error) {
            alert('操作失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleDeleteReminder = async (id: string, title: string) => {
        showConfirm('确认删除', `确定要删除提醒「${title}」吗？`, async () => {
            try {
                await deleteReminder(id);
            } catch (error) {
                alert('删除失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
            } finally {
                hideConfirm();
            }
        });
    };

    // Handle settings view
    useEffect(() => {
        if (activeView === 'settings') {
            setShowSettings(true);
        }
    }, [activeView]);

    // Close settings handler
    const handleCloseSettings = () => {
        setShowSettings(false);
        setActiveView('dashboard'); // Return to dashboard
    };

    // Theme Styles
    const navBgColor = config.theme?.navbarBgColor || '#5d33f0';
    const themeStyles = `
        :root {
            --theme-primary: ${config.theme?.primaryColor || '#f1404b'};
            --theme-bg: ${config.theme?.backgroundColor || '#f8f9fa'};
            --theme-text: ${config.theme?.textColor || '#444444'};
        }
    `;

    if (!isLoaded || loading || remindersLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <style>{themeStyles}</style>

            {/* Global Overlays */}
            {showLogin && <LoginDialog onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />}
            {showSearchModal && <SearchModal config={config} isAuthenticated={isAuthenticated} onClose={() => setShowSearchModal(false)} />}
            <ReminderToast reminders={reminders} />

            {/* Top Navbar (Shared) */}
            <TopNavbar
                config={{ ...config, hero: { ...config.hero, overlayNavbar: false } }}
                toggleSidebar={() => setMobileOpen(!mobileOpen)}
                mobileOpen={mobileOpen}
                onUserClick={() => setShowLogin(true)}
                onLogout={() => {
                    logout();
                    // 退出登录后跳转到 Navlink 首页
                    window.location.href = '/';
                }}
                isAuthenticated={isAuthenticated}
                onSearchClick={() => setShowSearchModal(true)}
            />

            {/* Main Layout */}
            <SubLayout activeView={activeView} onViewChange={setActiveView} isAuthenticated={isAuthenticated} onShowLogin={() => setShowLogin(true)}>
                {activeView === 'dashboard' && (
                    <Dashboard
                        subscriptions={subscriptions}
                        reminders={customReminders}
                        onNavigate={(view) => setActiveView(view as any)}
                        onAdd={handleAdd}
                        onEditReminder={handleEditReminder}
                        onDeleteReminder={handleDeleteReminder}
                        settings={settings}
                    />
                )}
                {activeView === 'list' && (
                    <SubscriptionList
                        subscriptions={subscriptions}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAdd}
                        settings={settings}
                    />
                )}
                {activeView === 'calendar' && (
                    <CalendarView subscriptions={subscriptions} settings={settings} />
                )}
                {activeView === 'reminders' && (
                    <ReminderList
                        reminders={customReminders}
                        onEdit={handleEditReminder}
                        onDelete={handleDeleteReminder}
                        onAdd={handleAddReminder}
                    />
                )}
                {activeView === 'settings' && (
                    <SettingsPanel
                        onClose={handleCloseSettings}
                        subscriptions={subscriptions}
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        isAuthenticated={isAuthenticated}
                    />
                )}
            </SubLayout>

            {/* Modals */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <SubscriptionForm
                    subscription={editingSubscription}
                    onSave={handleSave}
                    onCancel={() => setShowModal(false)}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                />
            </Modal>

            <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} maxWidth="lg">
                <ReminderForm
                    reminder={editingReminder}
                    onSave={handleSaveReminder}
                    onCancel={() => setShowReminderModal(false)}
                />
            </Modal>

            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={hideConfirm}
                />
            )}
        </div>
    );
}

export default SubApp;
