import { SubscriptionDAO } from '../database/dao/SubscriptionDAO.js';
import { NotificationDAO } from '../database/dao/NotificationDAO.js';

// 延迟获取 DAO 实例
const getSubscriptionDAO = () => new SubscriptionDAO();
const getNotificationDAO = () => new NotificationDAO();

/**
 * 读取订阅数据
 */
export async function readSubscriptions() {
    try {
        return await getSubscriptionDAO().getAll();
    } catch (error) {
        console.error('[订阅数据] 读取失败:', error);
        return [];
    }
}

/**
 * 保存订阅数据
 */
export async function saveSubscriptions(subscriptions) {
    // 注意：这个函数现在不适用于批量保存
    // 应该使用 DAO 的 create/update 方法单独操作每个订阅
    console.warn('[订阅数据] saveSubscriptions 已废弃，请使用 DAO 方法');
}

/**
 * 读取通知设置
 */
export async function getNotificationSettings() {
    try {
        const settings = await getNotificationDAO().get();
        if (settings) {
            return settings;
        }

        // 返回默认设置
        return {
            timezone: 'Asia/Shanghai',
            enableNotifications: false,
            notification: {
                timeRange: { start: '09:00', end: '22:00' },
                interval: 6,
                maxCount: 3
            },
            telegram: { enabled: false },
            notifyx: { enabled: false },
            bark: { enabled: false },
            email: { enabled: false },
            webhook: { enabled: false }
        };
    } catch (error) {
        console.error('[通知设置] 读取失败:', error);
        return {
            timezone: 'Asia/Shanghai',
            enableNotifications: false,
            notification: {
                timeRange: { start: '09:00', end: '22:00' },
                interval: 6,
                maxCount: 3
            },
            telegram: { enabled: false },
            notifyx: { enabled: false },
            bark: { enabled: false },
            email: { enabled: false },
            webhook: { enabled: false }
        };
    }
}

/**
 * 保存通知设置
 */
export async function saveNotificationSettings(settings) {
    try {
        await getNotificationDAO().save(settings);
    } catch (error) {
        console.error('[设置] 保存失败:', error);
        throw error;
    }
}

/**
 * 读取通知历史
 * 注意：通知历史暂时仍使用内存对象，未存储到数据库
 */
let notificationHistoryCache = {};

export async function readNotificationHistory() {
    return notificationHistoryCache;
}

/**
 * 保存通知历史
 * 注意：通知历史暂时仍使用内存对象，未存储到数据库
 */
export async function saveNotificationHistory(history) {
    notificationHistoryCache = history;
}

/**
 * 计算剩余天数
 */
export function calculateDaysRemaining(expiryDate, timezone = 'Asia/Shanghai') {
    const now = new Date();
    const expiry = new Date(expiryDate);

    // 转换到指定时区的午夜时间进行比较
    const nowMidnight = new Date(now.toLocaleDateString('en-US', { timeZone: timezone }));
    const expiryMidnight = new Date(expiry.toLocaleDateString('en-US', { timeZone: timezone }));

    const diffTime = expiryMidnight - nowMidnight;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * 检查是否在通知时段内
 */
export function isInNotificationTimeRange(settings) {
    const timezone = settings.timezone || 'Asia/Shanghai';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const currentTime = formatter.format(now);

    const startTime = settings.notification?.timeRange?.start || '00:00';
    const endTime = settings.notification?.timeRange?.end || '23:59';

    return currentTime >= startTime && currentTime <= endTime;
}

/**
 * 检查订阅是否需要发送通知（考虑间隔和次数）
 */
export function shouldSendNotification(subscription, history, settings) {
    const subId = subscription.id;
    const today = new Date().toISOString().split('T')[0];
    const notificationInterval = (settings.notification?.interval || 6) * 60 * 60 * 1000;
    const maxCount = settings.notification?.maxCount || 3;

    // 检查该订阅的通知历史
    let subHistory = history[subId];

    // 如果是新的一天，重置计数
    if (!subHistory || subHistory.resetDate !== today) {
        subHistory = {
            lastSent: 0,
            count: 0,
            resetDate: today
        };
        history[subId] = subHistory;
    }

    // 检查是否超过最大通知次数
    if (subHistory.count >= maxCount) {
        console.log(`[订阅检查] 订阅 "${subscription.name}" 今天已发送 ${subHistory.count} 次通知，达到上限`);
        return false;
    }

    // 检查距离上次发送是否超过间隔
    const now = Date.now();
    if (subHistory.lastSent && (now - subHistory.lastSent) < notificationInterval) {
        const remainingMinutes = Math.ceil((notificationInterval - (now - subHistory.lastSent)) / 60000);
        console.log(`[订阅检查] 订阅 "${subscription.name}" 距离上次通知还未超过间隔，还需等待 ${remainingMinutes} 分钟`);
        return false;
    }

    return true;
}

/**
 * 记录通知已发送
 */
export function markNotificationSent(subscription, history) {
    const subId = subscription.id;
    const today = new Date().toISOString().split('T')[0];

    if (!history[subId]) {
        history[subId] = {
            lastSent: 0,
            count: 0,
            resetDate: today
        };
    }

    history[subId].lastSent = Date.now();
    history[subId].count += 1;
    history[subId].resetDate = today;
}

/**
 * 自动续订订阅（如果已过期且autoRenew=true）
 */
export async function autoRenewSubscription(subscription, timezone) {
    if (!subscription.autoRenew || !subscription.periodValue || !subscription.periodUnit) {
        return null;
    }

    const daysRemaining = calculateDaysRemaining(subscription.expiryDate, timezone);

    // 只有已过期才续订
    if (daysRemaining >= 0) {
        return null;
    }

    const expiryDate = new Date(subscription.expiryDate);
    let newExpiryDate = new Date(expiryDate);

    // 根据周期计算新的到期日期
    do {
        if (subscription.periodUnit === 'day') {
            newExpiryDate.setDate(newExpiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
            newExpiryDate.setMonth(newExpiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + subscription.periodValue);
        }
    } while (calculateDaysRemaining(newExpiryDate.toISOString().split('T')[0], timezone) < 0);

    console.log(`[订阅检查] 订阅 "${subscription.name}" 已过期，自动续订至: ${newExpiryDate.toISOString().split('T')[0]}`);

    // 更新数据库
    const updated = await getSubscriptionDAO().update(subscription.id, {
        ...subscription,
        expiryDate: newExpiryDate.toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
    });

    return updated;
}
