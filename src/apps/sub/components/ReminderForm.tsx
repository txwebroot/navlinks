/**
 * 自定义提醒表单组件
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { CustomReminder, CreateReminderData } from '../types/reminder';

interface ReminderFormProps {
    initialDate?: string;
    reminder?: CustomReminder;
    onSave: (data: CreateReminderData) => Promise<void>;
    onCancel: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ 
    initialDate, 
    reminder, 
    onSave, 
    onCancel 
}) => {
    const [title, setTitle] = useState(reminder?.title || '');
    const [description, setDescription] = useState(reminder?.description || '');
    const [reminderDate, setReminderDate] = useState(reminder?.reminderDate || initialDate || '');
    const [reminderTime, setReminderTime] = useState(reminder?.reminderTime || '09:00');
    const [isActive, setIsActive] = useState(reminder?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // 设置默认时间为今天
    useEffect(() => {
        if (!reminderDate && initialDate) {
            setReminderDate(initialDate);
        }
    }, [initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 验证
        if (!title.trim()) {
            setError('请输入提醒标题');
            return;
        }
        
        if (!reminderDate) {
            setError('请选择提醒日期');
            return;
        }
        
        if (!reminderTime) {
            setError('请选择提醒时间');
            return;
        }

        // 验证日期不能是过去
        const selectedDateTime = new Date(`${reminderDate}T${reminderTime}`);
        const now = new Date();
        if (selectedDateTime < now && !reminder) {
            setError('提醒时间不能早于当前时间');
            return;
        }

        try {
            setSaving(true);
            setError('');
            await onSave({
                title: title.trim(),
                description: description.trim(),
                reminderDate,
                reminderTime,
                isActive
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                    {reminder ? '编辑提醒' : '新建提醒'}
                </h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Icon icon="fa-solid fa-times" />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Icon icon="fa-solid fa-exclamation-circle" />
                    {error}
                </div>
            )}

            {/* 标题 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    提醒标题 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：团队会议、缴纳物业费等"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={100}
                />
            </div>

            {/* 描述 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述信息（可选）
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="补充说明..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={500}
                />
            </div>

            {/* 日期和时间 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        提醒日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        提醒时间 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* 启用状态 */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                    启用此提醒
                </label>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    取消
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-[var(--theme-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            保存中...
                        </>
                    ) : (
                        <>
                            <Icon icon="fa-solid fa-check" />
                            保存
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
