/**
 * 订阅数据管理 Hook
 * 提供订阅的 CRUD 操作和状态管理
 */

import { useState, useEffect } from 'react';
import { Subscription } from '../types/subscription';

const API_BASE = '/api';

export const useSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载所有订阅
    const loadSubscriptions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/subscriptions`);
            if (!response.ok) throw new Error('Failed to load subscriptions');
            const data = await response.json();
            setSubscriptions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Load subscriptions error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 创建订阅
    const createSubscription = async (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) throw new Error('Failed to create subscription');
            const newSub = await response.json();
            setSubscriptions(prev => [...prev, newSub]);
            return newSub;
        } catch (err) {
            console.error('Create subscription error:', err);
            throw err;
        }
    };

    // 更新订阅
    const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update subscription');
            const updated = await response.json();
            setSubscriptions(prev => prev.map(sub => sub.id === id ? updated : sub));
            return updated;
        } catch (err) {
            console.error('Update subscription error:', err);
            throw err;
        }
    };

    // 删除订阅
    const deleteSubscription = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete subscription');
            setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        } catch (err) {
            console.error('Delete subscription error:', err);
            throw err;
        }
    };

    // 批量更新（用于启用/禁用等操作）
    const batchUpdate = async (ids: string[], updates: Partial<Subscription>) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_BASE}/subscriptions/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids, updates })
            });

            if (!response.ok) throw new Error('Failed to batch update');
            await loadSubscriptions(); // 重新加载数据
        } catch (err) {
            console.error('Batch update error:', err);
            throw err;
        }
    };

    // 初始加载
    useEffect(() => {
        loadSubscriptions();
    }, []);

    return {
        subscriptions,
        loading,
        error,
        loadSubscriptions,
        createSubscription,
        updateSubscription,
        deleteSubscription,
        batchUpdate
    };
};
