/**
 * 订阅表单组件
 * 用于添加和编辑订阅
 */

import React, { useState, useEffect } from 'react';
import { Subscription } from '../types/subscription';
import { Icon } from '@/src/shared/components/common/Icon';
import { getTodayDate } from '../utils/dateUtils';
import { NotificationSettings } from '../types/settings';

interface SubscriptionFormProps {
    subscription?: Subscription | null;
    onSave: (data: Partial<Subscription>) => void;
    onCancel: () => void;
    settings?: NotificationSettings;
    onUpdateSettings?: (settings: NotificationSettings) => void;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
    subscription,
    onSave,
    onCancel,
    settings,
    onUpdateSettings
}) => {
    const [formData, setFormData] = useState<Partial<Subscription>>({
        name: subscription?.name || '',
        customType: subscription?.customType || '',
        category: subscription?.category || '',
        notes: subscription?.notes || '',
        isActive: subscription?.isActive ?? true,
        autoRenew: subscription?.autoRenew ?? false,
        startDate: subscription?.startDate || getTodayDate(),
        expiryDate: subscription?.expiryDate || '',
        periodValue: subscription?.periodValue || settings?.defaults?.periodValue || 1,
        periodUnit: subscription?.periodUnit || settings?.defaults?.periodUnit || 'month',
        reminderValue: subscription?.reminderValue || settings?.defaults?.reminderValue || 3,
        reminderUnit: subscription?.reminderUnit || settings?.defaults?.reminderUnit || 'day',
        useLunar: subscription?.useLunar || false,
        price: subscription?.price || 0,
        currency: subscription?.currency || settings?.display?.currency || 'CNY',
        currencySymbol: subscription?.currencySymbol || settings?.display?.currencySymbol || '¥',
        icon: subscription?.icon || ''
    });

    // 编辑模式：填充现有数据
    useEffect(() => {
        if (subscription) {
            setFormData({
                ...subscription,
                // 确保币种字段有默认值（仅在初始化时使用settings的值）
                currency: subscription.currency || settings?.display?.currency || 'CNY',
                currencySymbol: subscription.currencySymbol || settings?.display?.currencySymbol || '¥'
            });
        }
    }, [subscription]); // 不依赖settings，避免全局settings变化时重置表单

    // 自动计算到期时间
    useEffect(() => {
        // 仅在非编辑模式或用户手动修改了相关字段时触发
        // 这里简化为：只要相关字段变化且有开始时间，就尝试计算
        if (formData.startDate && formData.periodValue && formData.periodUnit) {
            const date = new Date(formData.startDate);
            const { periodValue, periodUnit } = formData;

            switch (periodUnit) {
                case 'day':
                    date.setDate(date.getDate() + periodValue);
                    break;
                case 'month':
                    date.setMonth(date.getMonth() + periodValue);
                    break;
                case 'year':
                    date.setFullYear(date.getFullYear() + periodValue);
                    break;
            }

            // 格式化为 YYYY-MM-DD
            const newExpiry = date.toISOString().split('T')[0];

            // 只有当计算出的日期不同时才更新，避免死循环（虽然这里依赖项明确，不太会）
            // 另外，如果是编辑模式，可能用户不想覆盖原有的到期时间？
            // 用户需求是“新建或修改时...自动计算”。我们假设用户修改周期就是为了更新到期时间。
            if (newExpiry !== formData.expiryDate) {
                setFormData(prev => ({ ...prev, expiryDate: newExpiry }));
            }
        }
    }, [formData.startDate, formData.periodValue, formData.periodUnit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 验证必填字段
        if (!formData.name || !formData.expiryDate) {
            alert('请填写订阅名称和到期日期');
            return;
        }
        
        onSave(formData);
    };

    const handleChange = (field: keyof Subscription, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isEditMode = !!subscription;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* 标题 */}
            <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    <Icon icon={isEditMode ? 'fa-solid fa-edit' : 'fa-solid fa-plus'} className="mr-2" />
                    {isEditMode ? '编辑订阅' : '添加订阅'}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* 订阅名称 */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        订阅名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="例如：Netflix、iCloud 等"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

                {/* 类型 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        类型
                    </label>
                    <input
                        type="text"
                        value={formData.customType}
                        onChange={(e) => handleChange('customType', e.target.value)}
                        placeholder="流媒体、云服务、软件订阅等"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* 分类 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        分类
                    </label>
                    <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="个人、工作、家庭等"
                        list="category-options"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <datalist id="category-options">
                        {(settings?.categories || ['个人', '家庭', '工作']).map((cat: string) => (
                            <option key={cat} value={cat} />
                        ))}
                    </datalist>
                </div>

                {/* 价格和币种 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        价格
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price || 0}
                            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <select
                            value={formData.currency || 'CNY'}
                            onChange={(e) => {
                                const currency = e.target.value;
                                const symbolMap: Record<string, string> = {
                                    'CNY': '¥',
                                    'USD': '$',
                                    'EUR': '€',
                                    'GBP': '£'
                                };
                                // 更新当前订阅的币种
                                handleChange('currency', currency);
                                handleChange('currencySymbol', symbolMap[currency] || '¥');
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="CNY">¥ CNY</option>
                            <option value="USD">$ USD</option>
                            <option value="EUR">€ EUR</option>
                            <option value="GBP">£ GBP</option>
                        </select>
                    </div>
                </div>

                {/* 开始日期 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        开始日期
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* 到期日期 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        到期日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => handleChange('expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>

                {/* 周期数值 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        续订周期
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="1"
                            value={formData.periodValue}
                            onChange={(e) => handleChange('periodValue', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <select
                            value={formData.periodUnit}
                            onChange={(e) => handleChange('periodUnit', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="day">天</option>
                            <option value="month">月</option>
                            <option value="year">年</option>
                        </select>
                    </div>
                </div>

                {/* 提醒时间 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        提前提醒
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="1"
                            value={formData.reminderValue}
                            onChange={(e) => handleChange('reminderValue', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <select
                            value={formData.reminderUnit}
                            onChange={(e) => handleChange('reminderUnit', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="hour">小时</option>
                            <option value="day">天</option>
                        </select>
                    </div>
                </div>

                {/* 备注 */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        备注
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="添加备注信息..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                </div>

                {/* 选项开关 */}
                <div className="md:col-span-2 space-y-3">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">启用此订阅</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.autoRenew}
                            onChange={(e) => handleChange('autoRenew', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">自动续订</span>
                    </label>
                </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-white rounded-lg font-medium transition-opacity shadow-md hover:shadow-lg"
                >
                    <Icon icon="fa-solid fa-save" className="mr-2" />
                    {isEditMode ? '保存修改' : '添加订阅'}
                </button>
            </div>
        </form>
    );
};
