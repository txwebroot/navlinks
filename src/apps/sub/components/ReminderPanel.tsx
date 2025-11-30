/**
 * 提醒面板组件
 * 显示需要提醒的订阅列表
 */

import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { ReminderResult } from '../utils/reminderUtils';
import { formatDate } from '../utils/dateUtils';

interface ReminderPanelProps {
    reminders: ReminderResult[];
    onClose: () => void;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({ reminders, onClose }) => {
    if (reminders.length === 0) return null;

    return (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl shadow-lg">
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <Icon icon="fa-solid fa-bell" className="text-orange-600 text-xl mr-2 animate-pulse" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            订阅到期提醒 ({reminders.length})
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon icon="fa-solid fa-times" />
                    </button>
                </div>

                <div className="space-y-2">
                    {reminders.map((reminder) => {
                        const iconClass = reminder.urgency === 'urgent'
                            ? 'fa-solid fa-exclamation-circle text-red-600'
                            : reminder.urgency === 'warning'
                            ? 'fa-solid fa-exclamation-triangle text-yellow-600'
                            : 'fa-solid fa-info-circle text-blue-600';

                        const bgClass = reminder.urgency === 'urgent'
                            ? 'bg-red-50 border-red-200'
                            : reminder.urgency === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200';

                        return (
                            <div
                                key={reminder.subscription.id}
                                className={`p-3 rounded-lg border ${bgClass} flex items-start gap-3`}
                            >
                                <Icon icon={iconClass} className="mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {reminder.message}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        到期日期: {formatDate(reminder.subscription.expiryDate, 'short')}
                                        {reminder.subscription.autoRenew && (
                                            <span className="ml-2 text-green-600">
                                                <Icon icon="fa-solid fa-sync" className="mr-1" />
                                                自动续订
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
