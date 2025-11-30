import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { CustomReminder } from '../types/reminder';

interface ReminderCardProps {
    reminder: CustomReminder;
    onEdit: () => void;
    onDelete: () => void;
    viewMode: 'grid' | 'list';
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onEdit, onDelete, viewMode }) => {
    // 计算是否已过期
    const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
    const now = new Date();
    const isPast = reminderDateTime < now;
    
    // 格式化日期时间
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    if (viewMode === 'list') {
        // 列表视图
        return (
            <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all group ${
                reminder.notified ? 'border-gray-200 opacity-60' : 'border-purple-200'
            }`}>
                <div className="flex items-center justify-between gap-4">
                    {/* 状态指示器 */}
                    <div className={`w-1 h-12 rounded-full ${
                        reminder.notified ? 'bg-gray-300' : isPast ? 'bg-orange-500' : 'bg-purple-500'
                    }`}></div>

                    {/* 主要信息 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                {reminder.title}
                            </h3>
                            {reminder.notified && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">已通知</span>
                            )}
                            {!reminder.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">已禁用</span>
                            )}
                        </div>
                        {reminder.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">{reminder.description}</p>
                        )}
                    </div>

                    {/* 时间信息 */}
                    <div className="text-right shrink-0">
                        <div className="text-sm font-medium text-gray-900">{formatDate(reminder.reminderDate)}</div>
                        <div className="text-xs text-purple-600">{reminder.reminderTime}</div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                            onClick={onEdit}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                        >
                            <Icon icon="fa-solid fa-edit" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                        >
                            <Icon icon="fa-solid fa-trash" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 卡片视图
    // 根据状态获取颜色
    const getCardColor = () => {
        if (reminder.notified) return '#9ca3af'; // gray-400
        if (isPast) return '#f97316'; // orange-500
        return '#a855f7'; // purple-500
    };
    
    const cardColor = getCardColor();
    
    return (
        <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {/* 状态色背景 */}
            <div 
                className="absolute inset-0 opacity-90"
                style={{ 
                    background: `linear-gradient(to bottom right, ${cardColor}, ${cardColor})` 
                }}
            ></div>

            {/* 装饰性图案 */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white rounded-full"></div>
            </div>

            {/* 内容区域 */}
            <div className="relative p-5 text-white flex flex-col h-full min-h-[200px]">
                {/* 顶部操作按钮 */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={onEdit}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all"
                        title="编辑"
                    >
                        <Icon icon="fa-solid fa-pen" className="text-xs" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-600 backdrop-blur-md flex items-center justify-center transition-all"
                        title="删除"
                    >
                        <Icon icon="fa-solid fa-trash" className="text-xs" />
                    </button>
                </div>

                {/* 标题和状态标签 */}
                <div className="mb-3">
                    <h3 className="font-bold text-xl mb-2 line-clamp-1 pr-16" title={reminder.title}>
                        {reminder.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {reminder.notified && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">已通知</span>
                        )}
                        {!reminder.isActive && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">已禁用</span>
                        )}
                        {isPast && !reminder.notified && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">已过期</span>
                        )}
                    </div>
                </div>

                {/* 描述 */}
                {reminder.description && (
                    <p className="text-xs text-white/80 mb-3 line-clamp-2" title={reminder.description}>
                        {reminder.description}
                    </p>
                )}

                {/* 时间信息 */}
                <div className="mt-auto">
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-90">提醒日期</span>
                            <span className="text-xs font-medium">{formatDate(reminder.reminderDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs opacity-90">提醒时间</span>
                            <span className="text-sm font-bold">
                                {reminder.reminderTime}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
