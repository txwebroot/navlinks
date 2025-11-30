import React from 'react';
import { Subscription } from '../types/subscription';
import { Icon } from '@/src/shared/components/common/Icon';
import { getSubscriptionStatus, calculateDaysRemaining, formatDate } from '../utils/dateUtils';
import { NotificationSettings } from '../types/settings';

interface SubscriptionCardProps {
    subscription: Subscription;
    onEdit?: (subscription: Subscription) => void;
    onDelete?: (id: string, name: string) => void;
    settings?: NotificationSettings;
    viewMode?: 'grid' | 'list';
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    subscription,
    onEdit,
    onDelete,
    settings,
    viewMode = 'grid'
}) => {
    const status = getSubscriptionStatus(subscription);
    const daysRemaining = calculateDaysRemaining(subscription.expiryDate);
    // 使用订阅自己的币种符号，如果没有则使用全局默认
    const currencySymbol = subscription.currencySymbol || settings?.display?.currencySymbol || '¥';
    const cardColorMode = settings?.display?.cardColorMode || 'status';
    const customCardColor = settings?.display?.cardColor || '#3b82f6';
    const statusColors = settings?.display?.statusColors || {
        normal: '#10b981',
        attention: '#fbbf24',
        warning: '#fb923c',
        urgent: '#ef4444',
        expired: '#6b7280',
    };

    // 根据状态获取卡片的背景色
    const getCardColor = () => {
        // 如果是固定颜色模式，使用自定义颜色
        if (cardColorMode === 'fixed') {
            return customCardColor;
        }

        // 状态颜色模式 - 使用自定义状态颜色
        if (!subscription.isActive || daysRemaining < 0) {
            return statusColors.expired;
        }
        if (daysRemaining <= 3) {
            return statusColors.urgent;
        }
        if (daysRemaining <= 7) {
            return statusColors.warning;
        }
        if (daysRemaining <= 15) {
            return statusColors.attention;
        }
        return statusColors.normal;
    };

    // 获取状态文本
    const getStatusText = () => {
        if (!subscription.isActive) return '已停用';
        if (daysRemaining < 0) return '已过期';
        if (daysRemaining === 0) return '今天到期';
        if (daysRemaining <= 3) return `${daysRemaining}天后到期`;
        if (daysRemaining <= 7) return `${daysRemaining}天后到期`;
        return `${daysRemaining}天后到期`;
    };

    // 获取固定颜色（用于list模式的简单背景）
    const getFixedColor = () => {
        if (cardColorMode === 'fixed') {
            return customCardColor;
        }
        // 状态颜色
        if (!subscription.isActive || daysRemaining < 0) return '#6b7280'; // gray-500
        if (daysRemaining <= 3) return '#ef4444'; // red-500
        if (daysRemaining <= 7) return '#fb923c'; // orange-400
        if (daysRemaining <= 15) return '#fbbf24'; // yellow-400
        return '#10b981'; // green-500
    };

    const getPeriodText = () => {
        if (subscription.periodUnit === 'month' && subscription.periodValue === 1) return '月';
        if (subscription.periodUnit === 'year' && subscription.periodValue === 1) return '年';
        if (subscription.periodUnit === 'day') return `${subscription.periodValue}天`;
        return `${subscription.periodValue}${subscription.periodUnit === 'month' ? '月' : '年'}`;
    };

    // List View Layout
    if (viewMode === 'list') {
        return (
            <div
                className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-l-4"
                style={{ borderLeftColor: getFixedColor() }}
            >
                <div className="p-3 flex items-center gap-3">
                    {/* 状态指示器 */}
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getFixedColor() }}></div>

                    {/* 8列网格布局 */}
                    <div className="flex-1 grid grid-cols-8 gap-3 items-center">
                        {/* 第1列：名称 */}
                        <div className="font-semibold text-gray-900 text-[15px] truncate" title={subscription.name}>
                            {subscription.name}
                        </div>

                        {/* 第2列：分类 */}
                        <div className="flex justify-center">
                            <span className="text-[13px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded whitespace-nowrap">
                                {subscription.category || '未分类'}
                            </span>
                        </div>

                        {/* 第3列：类型 */}
                        <div className="flex justify-center">
                            {subscription.customType ? (
                                <span className="text-[13px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded whitespace-nowrap">
                                    {subscription.customType}
                                </span>
                            ) : (
                                <span className="text-[13px] text-gray-400">-</span>
                            )}
                        </div>

                        {/* 第4列：提醒 */}
                        <div className="flex justify-center">
                            {subscription.reminderValue && subscription.reminderValue > 0 ? (
                                <span className="text-[13px] text-yellow-600 whitespace-nowrap flex items-center gap-1">
                                    <Icon icon="fa-solid fa-bell" className="text-[11px]" />
                                    {subscription.reminderValue}{subscription.reminderUnit === 'day' ? '天' : 'h'}
                                </span>
                            ) : (
                                <span className="text-[13px] text-gray-400">-</span>
                            )}
                        </div>

                        {/* 第5列：备注 */}
                        <div className="flex justify-center">
                            {subscription.notes ? (
                                <span className="text-[13px] text-gray-500 truncate max-w-full" title={subscription.notes}>
                                    {subscription.notes}
                                </span>
                            ) : subscription.autoRenew ? (
                                <span className="text-green-600 text-[13px]" title="自动续费">
                                    <Icon icon="fa-solid fa-rotate" className="text-[11px]" />
                                </span>
                            ) : !subscription.isActive ? (
                                <span className="text-[13px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                                    停用
                                </span>
                            ) : (
                                <span className="text-[13px] text-gray-400">-</span>
                            )}
                        </div>

                        {/* 第6列：价格 */}
                        <div className="text-right">
                            <span className="font-bold text-gray-900 text-[15px]">
                                {currencySymbol}{subscription.price || 0}
                            </span>
                            <span className="text-[13px] text-gray-500">/{getPeriodText()}</span>
                        </div>

                        {/* 第7列：开始时间 */}
                        <div className="flex justify-center">
                            {subscription.startDate ? (
                                <span className="text-[13px] text-gray-500 whitespace-nowrap flex items-center gap-1">
                                    <Icon icon="fa-solid fa-calendar-plus" className="text-[11px]" />
                                    {formatDate(subscription.startDate, 'short')}
                                </span>
                            ) : (
                                <span className="text-[13px] text-gray-400">-</span>
                            )}
                        </div>

                        {/* 第8列：到期信息 */}
                        <div className="text-right">
                            <div className="text-[14px] text-gray-600">{formatDate(subscription.expiryDate, 'short')}</div>
                            <div className={`text-[13px] font-medium ${
                                daysRemaining < 0 ? 'text-gray-500' :
                                daysRemaining <= 3 ? 'text-red-500' :
                                daysRemaining <= 7 ? 'text-orange-500' :
                                'text-gray-500'
                            }`}>
                                {daysRemaining < 0 ? '已过期' : daysRemaining === 0 ? '今天到期' : `${daysRemaining}天后`}
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮（不计入列） */}
                    {(onEdit || onDelete) && (
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(subscription); }}
                                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                                    title="编辑"
                                >
                                    <Icon icon="fa-solid fa-pen" className="text-xs" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(subscription.id, subscription.name); }}
                                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-gray-600 transition-all"
                                    title="删除"
                                >
                                    <Icon icon="fa-solid fa-trash" className="text-xs" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Grid View Layout (Card)
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
                {(onEdit || onDelete) && (
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(subscription); }}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all"
                                title="编辑"
                            >
                                <Icon icon="fa-solid fa-pen" className="text-xs" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(subscription.id, subscription.name); }}
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-600 backdrop-blur-md flex items-center justify-center transition-all"
                                title="删除"
                            >
                                <Icon icon="fa-solid fa-trash" className="text-xs" />
                            </button>
                        )}
                    </div>
                )}

                {/* 标题和分类 */}
                <div className="mb-3">
                    <h3 className="font-bold text-xl mb-2 line-clamp-1 pr-16" title={subscription.name}>
                        {subscription.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            {subscription.category || '未分类'}
                        </span>
                        {subscription.customType && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {subscription.customType}
                            </span>
                        )}
                        {subscription.autoRenew && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Icon icon="fa-solid fa-rotate" className="text-[10px]" />
                                自动续费
                            </span>
                        )}
                    </div>
                </div>

                {/* 备注 */}
                {subscription.notes && (
                    <p className="text-xs text-white/80 mb-3 line-clamp-2" title={subscription.notes}>
                        {subscription.notes}
                    </p>
                )}

                {/* 价格和周期 */}
                <div className="mt-auto">
                    <div className="flex items-baseline justify-between mb-3">
                        <div>
                            <span className="text-3xl font-bold">{currencySymbol}{subscription.price || 0}</span>
                            <span className="text-sm ml-1 opacity-80">/{getPeriodText()}</span>
                        </div>
                    </div>

                    {/* 到期信息 */}
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs opacity-90">下次续费</span>
                            <span className="text-xs font-medium">{formatDate(subscription.expiryDate, 'short')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs opacity-90">距离到期</span>
                            <span className="text-sm font-bold">
                                {daysRemaining < 0 ? '已过期' : daysRemaining === 0 ? '今天' : `${daysRemaining}天`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
