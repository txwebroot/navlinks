import React, { useState, useMemo } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { CustomReminder } from '../../types/reminder';
import { ReminderCard } from '../ReminderCard';

interface ReminderListProps {
    reminders: CustomReminder[];
    onEdit: (reminder: CustomReminder) => void;
    onDelete: (id: string, title: string) => Promise<void>;
    onAdd: () => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({ reminders, onEdit, onDelete, onAdd }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'notified' | 'past'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

    // 过滤和排序
    const filteredReminders = useMemo(() => {
        const now = new Date();
        
        return reminders
            .filter(reminder => {
                // 搜索过滤
                const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
                
                // 状态过滤
                let matchesStatus = true;
                if (filterStatus === 'active') {
                    matchesStatus = reminder.isActive && !reminder.notified;
                } else if (filterStatus === 'notified') {
                    matchesStatus = reminder.notified;
                } else if (filterStatus === 'past') {
                    const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
                    matchesStatus = reminderDateTime < now && !reminder.notified;
                }
                
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'title') {
                    return a.title.localeCompare(b.title);
                }
                // 按日期时间排序
                const dateA = new Date(`${a.reminderDate}T${a.reminderTime}`);
                const dateB = new Date(`${b.reminderDate}T${b.reminderTime}`);
                return dateA.getTime() - dateB.getTime();
            });
    }, [reminders, searchTerm, filterStatus, sortBy]);

    // 统计数据
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: reminders.length,
            active: reminders.filter(r => r.isActive && !r.notified).length,
            notified: reminders.filter(r => r.notified).length,
            past: reminders.filter(r => {
                const reminderDateTime = new Date(`${r.reminderDate}T${r.reminderTime}`);
                return reminderDateTime < now && !r.notified;
            }).length,
        };
    }, [reminders]);

    return (
        <div className="space-y-6 animate-fade-in pt-2 px-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">我的提醒</h1>
                    <p className="text-gray-500 mt-1">管理所有自定义提醒 ({reminders.length})</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Icon icon="fa-solid fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索提醒..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Icon icon="fa-solid fa-grid-2" />
                            <span className="text-sm font-medium">卡片</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Icon icon="fa-solid fa-list" />
                            <span className="text-sm font-medium">列表</span>
                        </button>
                    </div>

                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-purple-100"
                    >
                        <Icon icon="fa-solid fa-plus" />
                        添加提醒
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                    <div className="text-sm text-blue-600">全部提醒</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">{stats.active}</div>
                    <div className="text-sm text-purple-600">待提醒</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{stats.past}</div>
                    <div className="text-sm text-orange-600">已过期</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">{stats.notified}</div>
                    <div className="text-sm text-gray-600">已通知</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            filterStatus === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            filterStatus === 'active' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        待提醒
                    </button>
                    <button
                        onClick={() => setFilterStatus('past')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            filterStatus === 'past' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        已过期
                    </button>
                    <button
                        onClick={() => setFilterStatus('notified')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            filterStatus === 'notified' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        已通知
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-gray-500">排序:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-sm border-none bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer"
                    >
                        <option value="date">提醒时间</option>
                        <option value="title">标题</option>
                    </select>
                </div>
            </div>

            {/* List Content */}
            {filteredReminders.length > 0 ? (
                <div className={`
                    ${viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                        : 'flex flex-col gap-2'
                    }
                `}>
                    {filteredReminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onEdit={() => onEdit(reminder)}
                            onDelete={() => onDelete(reminder.id, reminder.title)}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-300">
                        <Icon icon="fa-solid fa-bell-slash" className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">未找到相关提醒</h3>
                    <p className="text-gray-500 mt-1">尝试调整搜索词或筛选条件</p>
                </div>
            )}
        </div>
    );
};
