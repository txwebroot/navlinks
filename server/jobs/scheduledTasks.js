import cron from 'node-cron';
import { runSubscriptionCheck, setupSubscriptionCheckSchedule } from '../services/subscriptionCheck.js';
import { runCustomReminderCheck, setupCustomReminderCheckSchedule } from '../services/reminderCheck.js';
import { cleanupOldReminders, setupReminderCleanupSchedule } from '../services/reminderCleanup.js';
import { runScheduledHealthCheck } from '../services/healthCheck.js';

let healthCheckJob = null;

/**
 * 设置健康检查定时任务
 */
async function setupHealthCheckSchedule() {
    try {
        // 停止现有任务
        if (healthCheckJob) {
            healthCheckJob.stop();
            healthCheckJob = null;
        }

        // 使用默认配置：每天凌晨3:00执行健康检查
        // TODO: 将配置迁移到数据库的 site_config 表
        const schedule = {
            enabled: true,
            time: '03:00'
        };

        if (schedule && schedule.enabled && schedule.time) {
            const [hour, minute] = schedule.time.split(':');
            const cronExpression = `${minute} ${hour} * * *`;

            if (cron.validate(cronExpression)) {
                healthCheckJob = cron.schedule(cronExpression, runScheduledHealthCheck);
                console.log(`Health check scheduled for ${schedule.time} daily.`);
            } else {
                console.error('Invalid cron expression derived from time:', schedule.time);
            }
        } else {
            console.log('Automated health check is disabled.');
        }
    } catch (error) {
        console.error('Error setting up health check schedule:', error);
    }
}

/**
 * 初始化所有定时任务
 */
export async function initializeScheduledTasks() {
    console.log('[定时任务] 开始初始化所有定时任务...');

    // 初始化健康检查
    await setupHealthCheckSchedule();

    // 初始化订阅检查
    await setupSubscriptionCheckSchedule();

    // 初始化自定义提醒检查
    await setupCustomReminderCheckSchedule();

    // 初始化提醒清理
    await setupReminderCleanupSchedule();

    console.log('[定时任务] 所有定时任务初始化完成');
}

// 导出设置函数供API调用
export { setupHealthCheckSchedule };
