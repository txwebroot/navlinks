/**
 * 日期计算工具函数
 */

import { Subscription, SubscriptionStatus } from '../types/subscription';

/**
 * 计算剩余天数
 */
export function calculateDaysRemaining(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 获取订阅状态
 */
export function getSubscriptionStatus(subscription: Subscription): SubscriptionStatus {
  if (!subscription.isActive) return 'expired';
  
  const daysRemaining = calculateDaysRemaining(subscription.expiryDate);
  
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 3) return 'urgent';
  if (daysRemaining <= 7) return 'warning';
  return 'active';
}

/**
 * 格式化日期显示
 */
export function formatDate(dateString: string, format: 'full' | 'short' = 'full'): string {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 计算下一个周期的到期日期
 */
export function calculateNextPeriod(subscription: Subscription): string {
  const { expiryDate, periodValue, periodUnit } = subscription;
  const date = new Date(expiryDate);
  
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
  
  return date.toISOString().split('T')[0];
}

/**
 * 获取今天的日期（YYYY-MM-DD格式）
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 验证日期格式
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
