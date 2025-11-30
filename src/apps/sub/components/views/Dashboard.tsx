import React, { useMemo } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { Subscription } from '../../types/subscription';
import { SubscriptionCard } from '../SubscriptionCard';
import { NotificationSettings } from '../../types/settings';
import { CustomReminder } from '../../types/reminder';
import { ReminderCard } from '../ReminderCard';
import { convertToCNY } from '../../utils/currencyUtils';

interface DashboardProps {
    subscriptions: Subscription[];
    reminders: CustomReminder[];
    onNavigate: (view: 'list' | 'reminders' | 'settings') => void;
    onAdd: () => void;
    onEditReminder: (reminder: CustomReminder) => void;
    onDeleteReminder: (id: string, title: string) => Promise<void>;
    settings: NotificationSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ subscriptions, reminders, onNavigate, onAdd, onEditReminder, onDeleteReminder, settings }) => {
    // 统计数据计算
    const stats = useMemo(() => {
        const activeSubs = subscriptions.filter(s => s.isActive);
        const totalMonthly = activeSubs.reduce((acc, sub) => {
            let monthlyPrice = 0;
            if (sub.periodUnit === 'month') monthlyPrice = sub.price / sub.periodValue;
            else if (sub.periodUnit === 'year') monthlyPrice = sub.price / (sub.periodValue * 12);
            else if (sub.periodUnit === 'day') monthlyPrice = sub.price / (sub.periodValue / 30);
            
            // 将每月支出转换为人民币
            const monthlyPriceInCNY = convertToCNY(monthlyPrice, sub.currency);
            return acc + monthlyPriceInCNY;
        }, 0);

        const totalYearly = totalMonthly * 12;

        // 计算即将到期 (未来30天内)
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const upcoming = activeSubs.filter(sub => {
            const expiry = new Date(sub.expiryDate);
            return expiry >= today && expiry <= next30Days;
        }).length;

        return {
            monthly: totalMonthly,
            yearly: totalYearly,
            count: activeSubs.length,
            upcoming
        };
    }, [subscriptions]);

    // 获取最近添加/更新的订阅 (Top 4)
    const recentSubs = useMemo(() => {
        return [...subscriptions]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 4);
    }, [subscriptions]);

    // 获取未过期、未通知的提醒 (Top 4)
    const activeReminders = useMemo(() => {
        const now = new Date();
        return reminders
            .filter(reminder => {
                if (!reminder.isActive || reminder.notified) return false;
                const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
                return reminderDateTime >= now;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.reminderDate}T${a.reminderTime}`);
                const dateB = new Date(`${b.reminderDate}T${b.reminderTime}`);
                return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 4);
    }, [reminders]);

    const currencySymbol = settings.display?.currencySymbol || '¥';
    const showWidgets = settings.display?.showWidgets ?? true;

    return (
        <div className="space-y-8 animate-fade-in pt-2 px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
                    <p className="text-gray-500 mt-1">欢迎回来,查看您的订阅概览</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => onNavigate('list')}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Icon icon="fa-solid fa-list" />
                        管理订阅
                    </button>
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-medium shadow-lg shadow-red-100"
                    >
                        <Icon icon="fa-solid fa-plus" />
                        新建订阅
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {showWidgets && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 opacity-90">
                                <Icon icon="fa-solid fa-calendar-check" />
                                <span className="text-sm font-medium">月度支出</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">¥{stats.monthly.toFixed(0)}</div>
                            <div className="text-xs opacity-70">预估每月固定支出（已折算CNY）</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon icon="fa-solid fa-wallet" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">年度总支出</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">¥{stats.yearly.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">基于当前订阅计算（已折算CNY）</div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon icon="fa-solid fa-layer-group" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">活跃订阅</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stats.count}</div>
                        <div className="text-xs text-gray-400">正在生效的服务</div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon icon="fa-solid fa-clock" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">即将到期</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stats.upcoming}</div>
                        <div className="text-xs text-gray-400">未来30天内需续费</div>
                    </div>
                </div>
            )}

            {/* Recent Subscriptions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">订阅列表</h2>
                    <button
                        onClick={() => onNavigate('list')}
                        className="text-sm text-[var(--theme-primary)] hover:opacity-80 font-medium flex items-center gap-1"
                    >
                        查看全部
                        <Icon icon="fa-solid fa-arrow-right" />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {recentSubs.map(sub => (
                        <SubscriptionCard key={sub.id} subscription={sub} settings={settings} />
                    ))}
                    {recentSubs.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                <Icon icon="fa-solid fa-inbox" className="text-2xl" />
                            </div>
                            <p className="text-gray-500">暂无订阅数据</p>
                            <button
                                onClick={onAdd}
                                className="mt-3 text-[var(--theme-primary)] font-medium hover:underline"
                            >
                                立即添加
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Reminders */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">提醒列表</h2>
                    <button
                        onClick={() => onNavigate('reminders')}
                        className="text-sm text-purple-600 hover:opacity-80 font-medium flex items-center gap-1"
                    >
                        查看全部
                        <Icon icon="fa-solid fa-arrow-right" />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {activeReminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onEdit={() => onEditReminder(reminder)}
                            onDelete={() => onDeleteReminder(reminder.id, reminder.title)}
                            viewMode="grid"
                        />
                    ))}
                    {activeReminders.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-purple-50 rounded-2xl border border-dashed border-purple-200">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-400">
                                <Icon icon="fa-solid fa-bell-slash" className="text-2xl" />
                            </div>
                            <p className="text-gray-500">暂无活跃提醒</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
