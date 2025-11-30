import React, { useState, useMemo } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { Subscription } from '../../types/subscription';
import { SubscriptionCard } from '../SubscriptionCard';
import { NotificationSettings } from '../../types/settings';

interface SubscriptionListProps {
    subscriptions: Subscription[];
    onEdit: (subscription: Subscription) => void;
    onDelete: (id: string, name: string) => Promise<void>;
    onAdd: () => void;
    settings: NotificationSettings;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onEdit, onDelete, onAdd, settings }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'expiry'>('expiry');

    // 获取所有分类（使用设置中的分类）
    const categories = useMemo(() => {
        // 优先使用设置中的分类，如果没有则从订阅中提取
        if (settings?.categories && settings.categories.length > 0) {
            return ['all', ...settings.categories];
        }
        
        // fallback到从订阅中提取
        const cats = new Set<string>();
        subscriptions.forEach(sub => {
            if (sub.category) cats.add(sub.category);
        });
        return ['all', ...Array.from(cats)];
    }, [subscriptions, settings]);

    // 过滤和排序
    const filteredSubscriptions = useMemo(() => {
        return subscriptions
            .filter(sub => {
                const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.notes?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = filterCategory === 'all' || sub.category === filterCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'price') return b.price - a.price;
                if (sortBy === 'expiry') return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                return 0;
            });
    }, [subscriptions, searchTerm, filterCategory, sortBy]);

    return (
        <div className="space-y-6 animate-fade-in pt-2 px-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">我的订阅</h1>
                    <p className="text-gray-500 mt-1">管理所有订阅服务 ({subscriptions.length})</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Icon icon="fa-solid fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索订阅..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow text-[var(--theme-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Icon icon="fa-solid fa-grid-2" />
                            <span className="text-sm font-medium">卡片</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-[var(--theme-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Icon icon="fa-solid fa-list" />
                            <span className="text-sm font-medium">列表</span>
                        </button>
                    </div>

                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-medium shadow-lg shadow-red-100"
                    >
                        <Icon icon="fa-solid fa-plus" />
                        添加订阅
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat
                                ? 'bg-[var(--theme-primary)] text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {cat === 'all' ? '全部' : cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-gray-500">排序:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-sm border-none bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer"
                    >
                        <option value="expiry">到期时间</option>
                        <option value="price">价格</option>
                        <option value="name">名称</option>
                    </select>
                </div>
            </div>

            {/* List Content */}
            {filteredSubscriptions.length > 0 ? (
                <div className={`
                    ${viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                        : 'flex flex-col gap-2'
                    }
                `}>
                    {filteredSubscriptions.map(sub => (
                        <SubscriptionCard
                            key={sub.id}
                            subscription={sub}
                            onEdit={() => onEdit(sub)}
                            onDelete={() => onDelete(sub.id, sub.name)}
                            settings={settings}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Icon icon="fa-solid fa-search" className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">未找到相关订阅</h3>
                    <p className="text-gray-500 mt-1">尝试调整搜索词或筛选条件</p>
                </div>
            )}
        </div>
    );
};
