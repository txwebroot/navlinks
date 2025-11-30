import React, { useState, useEffect, useMemo } from 'react';
import { Subscription } from '../../types/subscription';
import { Icon } from '@/src/shared/components/common/Icon';
import { NotificationSettings } from '../../types/settings';
import { calculateDaysRemaining } from '../../utils/dateUtils';
import { CustomReminder } from '../../types/reminder';
import { useCustomReminders } from '../../hooks/useCustomReminders';
import { ReminderForm } from '../ReminderForm';
import { Modal } from '../Modal';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';

interface CalendarViewProps {
    subscriptions: Subscription[];
    settings: NotificationSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ subscriptions, settings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { reminders, createReminder, updateReminder, deleteReminder } = useCustomReminders();
    const { confirmDialog, showConfirm, hideConfirm } = useDialogs();

    // 自定义提醒状态
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [editingReminder, setEditingReminder] = useState<CustomReminder | undefined>(undefined);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Map subscriptions to dates in the current month
    const subsByDate = useMemo(() => {
        const map: Record<number, Subscription[]> = {};
        subscriptions.forEach(sub => {
            const expiry = new Date(sub.expiryDate);
            // Check if expiry is in current displayed month/year
            if (expiry.getMonth() === currentDate.getMonth() && expiry.getFullYear() === currentDate.getFullYear()) {
                const day = expiry.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(sub);
            }
            // Handle recurring subscriptions logic could be complex here, 
            // for now we stick to the explicit expiryDate as per current simple logic
        });
        return map;
    }, [subscriptions, currentDate]);

    // Map custom reminders to dates in the current month
    const remindersByDate = useMemo(() => {
        const map: Record<number, CustomReminder[]> = {};
        reminders.forEach(reminder => {
            const reminderDateObj = new Date(reminder.reminderDate);
            if (reminderDateObj.getMonth() === currentDate.getMonth() &&
                reminderDateObj.getFullYear() === currentDate.getFullYear()) {
                const day = reminderDateObj.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(reminder);
            }
        });
        return map;
    }, [reminders, currentDate]);

    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [selectedReminder, setSelectedReminder] = useState<CustomReminder | null>(null);

    // 处理添加提醒
    const handleAddReminder = (dateStr: string) => {
        setSelectedDate(dateStr);
        setEditingReminder(undefined);
        setShowReminderModal(true);
    };

    // 保存提醒
    const handleSaveReminder = async (data: any) => {
        if (editingReminder) {
            await updateReminder(editingReminder.id, data);
        } else {
            await createReminder(data);
        }
        setShowReminderModal(false);
        setSelectedDate('');
        setEditingReminder(undefined);
    };

    // 删除提醒
    const handleDeleteReminder = async (id: string) => {
        showConfirm('确认删除', '确定要删除这个提醒吗？', async () => {
            hideConfirm();
            await deleteReminder(id);
            setSelectedReminder(null);
        });
    };

    const renderCalendarDays = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100/50"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const subs = subsByDate[day] || [];
            const dayReminders = remindersByDate[day] || [];
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isFuture = dateObj >= new Date(new Date().setHours(0, 0, 0, 0));
            const dateStr = dateObj.toISOString().split('T')[0];

            days.push(
                <div key={day} className={`h-32 border border-gray-100 p-2 relative group transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                            {day}
                            {isToday && <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">今天</span>}
                        </div>
                        {isFuture && (
                            <button
                                onClick={() => handleAddReminder(dateStr)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 text-xs"
                                title="添加提醒"
                            >
                                <Icon icon="fa-solid fa-plus-circle" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                        {/* 订阅到期 */}
                        {subs.map(sub => (
                            <div
                                key={sub.id}
                                onClick={() => setSelectedSub(sub)}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="w-1 h-6 rounded-full bg-[var(--theme-primary)]"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{sub.name}</p>
                                    <p className="text-[10px] text-gray-500">¥{sub.price}</p>
                                </div>
                            </div>
                        ))}
                        {/* 自定义提醒 */}
                        {dayReminders.map(reminder => (
                            <div
                                key={reminder.id}
                                onClick={() => setSelectedReminder(reminder)}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-50 border border-purple-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="w-1 h-6 rounded-full bg-purple-500"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{reminder.title}</p>
                                    <p className="text-[10px] text-purple-600">{reminder.reminderTime}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Icon icon="fa-solid fa-calendar-alt" className="text-[var(--theme-primary)]" />
                    {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                </h2>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                        <Icon icon="fa-solid fa-chevron-left" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                        今天
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                        <Icon icon="fa-solid fa-chevron-right" />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>

            {/* Detail Modal */}
            {selectedSub && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setSelectedSub(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                                    {selectedSub.icon ? <img src={selectedSub.icon} className="w-8 h-8 object-contain" /> : <Icon icon="fa-solid fa-cube" className="text-gray-400" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedSub.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedSub.category}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSub(null)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="fa-solid fa-times" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">价格</span>
                                <span className="font-medium text-gray-900">¥{selectedSub.price}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">到期日</span>
                                <span className="font-medium text-gray-900">{selectedSub.expiryDate}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">剩余天数</span>
                                <span className="font-medium text-[var(--theme-primary)]">{calculateDaysRemaining(selectedSub.expiryDate)} 天</span>
                            </div>
                            {selectedSub.notes && (
                                <div className="py-2">
                                    <span className="text-gray-500 text-sm block mb-1">备注</span>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{selectedSub.notes}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedSub(null)}
                            className="w-full py-2.5 bg-[var(--theme-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Reminder Detail Modal */}
            {selectedReminder && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setSelectedReminder(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Icon icon="fa-solid fa-bell" className="text-purple-600 text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedReminder.title}</h3>
                                    <p className="text-sm text-gray-500">自定义提醒</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReminder(null)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="fa-solid fa-times" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">提醒日期</span>
                                <span className="font-medium text-gray-900">{selectedReminder.reminderDate}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">提醒时间</span>
                                <span className="font-medium text-gray-900">{selectedReminder.reminderTime}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 text-sm">状态</span>
                                <span className={`text-sm font-medium ${selectedReminder.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {selectedReminder.isActive ? '已启用' : '已禁用'}
                                </span>
                            </div>
                            {selectedReminder.description && (
                                <div className="py-2">
                                    <span className="text-gray-500 text-sm block mb-1">描述</span>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{selectedReminder.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setEditingReminder(selectedReminder);
                                    setSelectedDate(selectedReminder.reminderDate);
                                    setSelectedReminder(null);
                                    setShowReminderModal(true);
                                }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                编辑
                            </button>
                            <button
                                onClick={() => handleDeleteReminder(selectedReminder.id)}
                                className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminder Form Modal */}
            <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} maxWidth="md">
                <ReminderForm
                    initialDate={selectedDate}
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
};
