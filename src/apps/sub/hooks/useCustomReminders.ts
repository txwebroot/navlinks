/**
 * 自定义提醒数据管理 Hook
 */

import { useState, useEffect } from 'react';
import { CustomReminder, CreateReminderData } from '../types/reminder';

const API_BASE = '/api';

export const useCustomReminders = () => {
    const [reminders, setReminders] = useState<CustomReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载所有自定义提醒
    const loadReminders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/custom-reminders`);
            if (!response.ok) throw new Error('Failed to load reminders');
            const data = await response.json();
            setReminders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Load reminders error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 创建自定义提醒
    const createReminder = async (reminder: CreateReminderData) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/custom-reminders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reminder)
            });

            if (!response.ok) throw new Error('Failed to create reminder');
            const newReminder = await response.json();
            setReminders(prev => [...prev, newReminder]);
            return newReminder;
        } catch (err) {
            console.error('Create reminder error:', err);
            throw err;
        }
    };

    // 更新自定义提醒
    const updateReminder = async (id: string, updates: Partial<CustomReminder>) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/custom-reminders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update reminder');
            const updated = await response.json();
            setReminders(prev => prev.map(r => r.id === id ? updated : r));
            return updated;
        } catch (err) {
            console.error('Update reminder error:', err);
            throw err;
        }
    };

    // 删除自定义提醒
    const deleteReminder = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/custom-reminders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete reminder');
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Delete reminder error:', err);
            throw err;
        }
    };

    // 初始加载
    useEffect(() => {
        loadReminders();
    }, []);

    return {
        reminders,
        loading,
        error,
        loadReminders,
        createReminder,
        updateReminder,
        deleteReminder
    };
};
