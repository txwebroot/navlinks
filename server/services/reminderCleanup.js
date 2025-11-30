import cron from 'node-cron';
import { readCustomReminders, saveCustomReminders } from './reminderCheck.js';

let reminderCleanupJob = null;

/**
 * 清理过期和已通知超过72小时的提醒
 */
export async function cleanupOldReminders() {
    console.log('[提醒清理] 开始清理旧提醒...');
    
    try {
        const reminders = await readCustomReminders();
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72小时前
        
        const filteredReminders = reminders.filter(reminder => {
            // 检查是否已过期
            const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
            const isPast = reminderDateTime < now;
            
            // 检查是否已通知超过72小时
            let notifiedTooLong = false;
            if (reminder.notified && reminder.updatedAt) {
                const updatedTime = new Date(reminder.updatedAt);
                notifiedTooLong = updatedTime < threeDaysAgo;
            }
            
            // 删除条件：1) 已过期且已通知  或  2) 已通知超过72小时
            const shouldDelete = (isPast && reminder.notified) || notifiedTooLong;
            
            if (shouldDelete) {
                console.log(`[提醒清理] 删除提醒: "${reminder.title}" (原因: ${isPast && reminder.notified ? '已过期且已通知' : '已通知超过72小时'})`);
            }
            
            return !shouldDelete;
        });
        
        const deletedCount = reminders.length - filteredReminders.length;
        
        if (deletedCount > 0) {
            await saveCustomReminders(filteredReminders);
            console.log(`[提醒清理] 已清理 ${deletedCount} 个提醒`);
        } else {
            console.log('[提醒清理] 没有需要清理的提醒');
        }
        
    } catch (error) {
        console.error('[提醒清理] 清理失败:', error);
    }
}

/**
 * 设置提醒清理定时任务
 */
export async function setupReminderCleanupSchedule() {
    try {
        // 停止现有任务
        if (reminderCleanupJob) {
            reminderCleanupJob.stop();
            reminderCleanupJob = null;
        }
        
        // 每天凌晨3点清理一次
        const cronExpression = '0 3 * * *';
        
        if (cron.validate(cronExpression)) {
            reminderCleanupJob = cron.schedule(cronExpression, cleanupOldReminders);
            console.log('[提醒清理] 定时任务已设置: 每天凌晨3:00清理一次');
        } else {
            console.error('[提醒清理] 无效的cron表达式:', cronExpression);
        }
    } catch (error) {
        console.error('[提醒清理] 设置定时任务失败:', error);
    }
}
