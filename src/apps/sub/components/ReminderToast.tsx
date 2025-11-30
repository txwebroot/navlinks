/**
 * 提醒Toast通知组件
 * 显示在右上角的通知消息
 */

import React, { useEffect, useState } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { ReminderResult } from '../utils/reminderUtils';

interface ReminderToastProps {
    reminders: ReminderResult[];
}

export const ReminderToast: React.FC<ReminderToastProps> = ({ reminders }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (reminders.length > 0 && !isDismissed) {
            // 延迟显示，产生滑入动画效果
            setTimeout(() => setIsVisible(true), 500);
        }
    }, [reminders, isDismissed]);

    if (reminders.length === 0 || isDismissed) return null;

    const urgentCount = reminders.filter(r => r.urgency === 'urgent').length;
    const warningCount = reminders.filter(r => r.urgency === 'warning').length;

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => setIsDismissed(true), 300);
    };

    return (
        <div 
            className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-orange-200 overflow-hidden max-w-md">
                {/* 顶部彩条 */}
                <div className="h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400"></div>
                
                {/* 主要内容 */}
                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                                <Icon icon="fa-solid fa-bell" className="text-orange-600 text-lg animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">订阅到期提醒</h3>
                                <p className="text-xs text-gray-500">您有 {reminders.length} 条订阅需要关注</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <Icon icon="fa-solid fa-times" className="text-sm" />
                        </button>
                    </div>

                    {/* 统计信息 */}
                    <div className="flex gap-2 mb-3">
                        {urgentCount > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg border border-red-200">
                                <Icon icon="fa-solid fa-exclamation-circle" className="text-red-600 text-xs" />
                                <span className="text-xs font-medium text-red-700">{urgentCount} 紧急</span>
                            </div>
                        )}
                        {warningCount > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg border border-yellow-200">
                                <Icon icon="fa-solid fa-exclamation-triangle" className="text-yellow-600 text-xs" />
                                <span className="text-xs font-medium text-yellow-700">{warningCount} 警告</span>
                            </div>
                        )}
                    </div>

                    {/* 前3条提醒预览 */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {reminders.slice(0, 3).map((reminder, index) => (
                            <div
                                key={reminder.subscription.id}
                                className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg"
                            >
                                <Icon 
                                    icon={reminder.urgency === 'urgent' ? 'fa-solid fa-circle' : 'fa-regular fa-circle'} 
                                    className={`text-xs ${
                                        reminder.urgency === 'urgent' ? 'text-red-500' : 'text-yellow-500'
                                    }`}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {reminder.subscription.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {reminder.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 更多提示 */}
                    {reminders.length > 3 && (
                        <div className="mt-2 text-center">
                            <p className="text-xs text-gray-400">还有 {reminders.length - 3} 条提醒...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
