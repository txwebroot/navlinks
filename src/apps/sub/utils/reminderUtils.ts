/**
 * 提醒检查工具
 * 检查哪些订阅需要提醒
 */

import { Subscription } from '../types/subscription';
import { calculateDaysRemaining } from './dateUtils';

export interface ReminderResult {
    subscription: Subscription;
    daysRemaining: number;
    urgency: 'urgent' | 'warning' | 'normal';
    message: string;
}

/**
 * 检查所有需要提醒的订阅
 */
export function checkReminders(subscriptions: Subscription[]): ReminderResult[] {
    const results: ReminderResult[] = [];
    
    subscriptions.forEach(sub => {
        if (!sub.isActive) return; // 跳过未启用的订阅
        
        const daysRemaining = calculateDaysRemaining(sub.expiryDate);
        let shouldRemind = false;
        let urgency: 'urgent' | 'warning' | 'normal' = 'normal';
        let message = '';
        
        // 根据提醒设置判断
        if (sub.reminderUnit === 'day') {
            if (daysRemaining <= sub.reminderValue && daysRemaining > 0) {
                shouldRemind = true;
                if (daysRemaining <= 3) {
                    urgency = 'urgent';
                    message = `${sub.name} 将在 ${daysRemaining} 天后到期！`;
                } else if (daysRemaining <= 7) {
                    urgency = 'warning';
                    message = `${sub.name} 将在 ${daysRemaining} 天后到期`;
                } else {
                    urgency = 'normal';
                    message = `${sub.name} 即将到期`;
                }
            }
        } else if (sub.reminderUnit === 'hour') {
            // 小时提醒转换为天（向上取整）
            const reminderDays = Math.ceil(sub.reminderValue / 24);
            if (daysRemaining <= reminderDays && daysRemaining > 0) {
                shouldRemind = true;
                urgency = daysRemaining <= 1 ? 'urgent' : 'warning';
                message = `${sub.name} 即将到期`;
            }
        }
        
        // 已过期的也提醒
        if (daysRemaining < 0) {
            shouldRemind = true;
            urgency = 'urgent';
            message = `${sub.name} 已过期 ${Math.abs(daysRemaining)} 天`;
        }
        
        if (shouldRemind) {
            results.push({
                subscription: sub,
                daysRemaining,
                urgency,
                message
            });
        }
    });
    
    // 按紧急程度和剩余天数排序
    return results.sort((a, b) => {
        const urgencyOrder = { 'urgent': 0, 'warning': 1, 'normal': 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return a.daysRemaining - b.daysRemaining;
    });
}

/**
 * 获取提醒摘要统计
 */
export function getReminderSummary(reminders: ReminderResult[]) {
    return {
        total: reminders.length,
        urgent: reminders.filter(r => r.urgency === 'urgent').length,
        warning: reminders.filter(r => r.urgency === 'warning').length,
        normal: reminders.filter(r => r.urgency === 'normal').length
    };
}
