import cron from 'node-cron';
import { ReminderDAO } from '../database/dao/ReminderDAO.js';
import { getNotificationSettings } from './subscriptionData.js';
import { sendAllNotifications } from './notification.js';

let customReminderCheckJob = null;

// 延迟获取 DAO 实例
const getReminderDAO = () => new ReminderDAO();

/**
 * 读取自定义提醒数据（兼容性函数）
 */
export async function readCustomReminders() {
    try {
        return await getReminderDAO().getAll();
    } catch (error) {
        console.error('[自定义提醒] 读取失败:', error);
        return [];
    }
}

/**
 * 保存自定义提醒数据（已废弃）
 */
export async function saveCustomReminders(reminders) {
    console.warn('[自定义提醒] saveCustomReminders 已废弃，请使用 DAO 方法');
}

/**
 * 执行自定义提醒检查
 */
export async function runCustomReminderCheck() {
    console.log('[自定义提醒] 开始检查...');

    try {
        const settings = await getNotificationSettings();

        if (!settings.enableNotifications) {
            console.log('[自定义提醒] 通知功能未启用');
            return;
        }

        const dao = getReminderDAO();
        const reminders = await dao.getActive(); // 只获取未完成的提醒

        if (!reminders || reminders.length === 0) {
            console.log('[自定义提醒] 没有活跃的提醒数据');
            return;
        }

        const timezone = settings.timezone || 'Asia/Shanghai';
        const now = new Date();

        const needReminder = [];

        for (const reminder of reminders) {
            // 构建提醒时间
            const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime || '00:00'}:00`);

            // 检查是否到达提醒时间（允许5分钟的误差）
            const timeDiff = reminderDateTime - now;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            if (minutesDiff >= -5 && minutesDiff <= 0) {
                console.log(`[自定义提醒] 提醒 "${reminder.title}" 到达提醒时间`);
                needReminder.push(reminder);
                // 标记为已完成
                await dao.markAsCompleted(reminder.id);
            }
        }

        // 发送通知
        if (needReminder.length === 0) {
            console.log('[自定义提醒] 没有需要发送的提醒');
            return;
        }

        console.log(`[自定义提醒] 准备发送 ${needReminder.length} 个提醒通知`);

        // 为每个提醒单独发送通知
        const results = [];

        for (const reminder of needReminder) {
            const title = reminder.title;
            const content = reminder.description || reminder.title;
            const timeInfo = `⏰ 提醒时间: ${reminder.reminderDate} ${reminder.reminderTime}`;
            const fullContent = content ? `${content}\n\n${timeInfo}` : timeInfo;

            const notificationResults = await sendAllNotifications(
                settings,
                title,
                fullContent,
                {
                    reminderDate: reminder.reminderDate,
                    reminderTime: reminder.reminderTime,
                    type: 'custom_reminder'
                }
            );

            results.push(...notificationResults.map(r => ({ ...r, reminder: title })));
        }

        console.log('[自定义提醒] 通知发送结果:', results);

    } catch (error) {
        console.error('[自定义提醒] 检查失败:', error);
    }
}

/**
 * 设置自定义提醒检查定时任务
 */
export async function setupCustomReminderCheckSchedule() {
    try {
        // 停止现有任务
        if (customReminderCheckJob) {
            customReminderCheckJob.stop();
            customReminderCheckJob = null;
        }

        const settings = await getNotificationSettings();

        if (!settings.enableNotifications) {
            console.log('[自定义提醒] 自动检查功能未启用');
            return;
        }

        // 每5分钟检查一次
        const cronExpression = '*/5 * * * *';

        if (cron.validate(cronExpression)) {
            customReminderCheckJob = cron.schedule(cronExpression, runCustomReminderCheck);
            console.log('[自定义提醒] 定时任务已设置: 每5分钟检查一次');
        } else {
            console.error('[自定义提醒] 无效的cron表达式:', cronExpression);
        }
    } catch (error) {
        console.error('[自定义提醒] 设置定时任务失败:', error);
    }
}

/**
 * 定期清理已完成的提醒（在定时任务中调用）
 */
export async function cleanupCompletedReminders() {
    console.log('[提醒清理] 开始清理已完成的提醒...');
    try {
        const dao = getReminderDAO();
        const deletedCount = await dao.cleanupCompleted(30); // 清理30天前完成的提醒
        console.log(`[提醒清理] 已清理 ${deletedCount} 条已完成的提醒`);
    } catch (error) {
        console.error('[提醒清理] 清理失败:', error);
    }
}
