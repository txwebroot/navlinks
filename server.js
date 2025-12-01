import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { PORT, ROOT_DIR, UPLOAD_DIR } from './server/config/config.js';
import { ensureDataDir, ensureUploadDir } from './server/utils/fileHelper.js';
import { authenticateToken } from './server/middleware/auth.js';
import { getNotificationSettings, saveNotificationSettings } from './server/services/subscriptionData.js';
import { sendAllNotifications, sendBarkNotification, sendTelegramNotification, sendEmailNotification, sendWebhookNotification } from './server/services/notification.js';
import { setupSubscriptionCheckSchedule } from './server/services/subscriptionCheck.js';
import { initDatabase } from './server/database/index.js';

// Import routes
import navlinkRoutes from './server/routes/navlink.js';
import subscriptionRoutes from './server/routes/subscriptions.js';
import reminderRoutes from './server/routes/reminders.js';
import uploadRoutes from './server/routes/upload.js';
import authRoutes from './server/routes/auth.js';
import appManagementRoutes from './server/routes/appManagement.js';
import dockerRoutes from './server/routes/docker.js';

// Import middleware
import { checkAppEnabled } from './server/middleware/appControl.js';

// Import scheduled tasks
import { initializeScheduledTasks } from './server/jobs/scheduledTasks.js';

const app = express();

// 增加请求体大小限制以支持 Base64 图片上传
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// 别名路由 - Sub应用的兼容性路由（必须在挂载subscriptionRoutes之前）
app.post('/api/sub-settings', authenticateToken, async (req, res) => {
    try {
        await saveNotificationSettings(req.body);
        await setupSubscriptionCheckSchedule();
        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error('Save sub-settings error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

app.post('/api/test-notification', authenticateToken, async (req, res) => {
    try {
        const { platform, settings: customSettings } = req.body;
        const settings = customSettings || await getNotificationSettings();

        const title = '订阅通知测试';
        const content = '这是一条测试通知，用于验证通知配置是否正确。\n\n发送时间: ' + new Date().toLocaleString('zh-CN');

        let result;

        // 根据平台发送对应的通知
        if (platform === 'bark') {
            result = await sendBarkNotification(settings, title, content);
        } else if (platform === 'telegram') {
            result = await sendTelegramNotification(settings, title, content);
        } else if (platform === 'webhook') {
            result = await sendWebhookNotification(settings, title, content);
        } else if (platform === 'email') {
            result = await sendEmailNotification(settings, title, content);
        } else {
            // 如果没有指定平台，发送所有通知
            const results = await sendAllNotifications(settings, title, content);
            return res.json({ success: true, results });
        }

        // 返回单个平台的结果
        if (result.skipped) {
            return res.json({ success: false, message: `${platform} 通知未启用或配置不完整` });
        }

        if (result.success) {
            return res.json({ success: true, message: `${platform} 通知发送成功` });
        } else {
            return res.json({ success: false, message: result.error || '发送失败' });
        }
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification: ' + error.message });
    }
});

// 挂载路由
app.use('/api', authRoutes);
app.use('/api', navlinkRoutes);
app.use('/api/app-management', appManagementRoutes);
app.use('/api/subscriptions', checkAppEnabled('sub'), subscriptionRoutes);
app.use('/api/custom-reminders', checkAppEnabled('sub'), reminderRoutes);
app.use('/api/docker', checkAppEnabled('docker'), dockerRoutes);
app.use('/api', uploadRoutes);

// 托管上传文件目录
app.use('/uploads', express.static(UPLOAD_DIR));

// 托管静态文件 (React Build) - 但排除API路径
app.use(express.static(path.join(ROOT_DIR, 'dist'), {
    index: false  // 不自动提供index.html
}));

// 所有其他非API请求返回 index.html (SPA 支持)
app.get('*', (req, res, next) => {
    // 如果是API请求，跳过
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
    }

    const indexFile = path.join(ROOT_DIR, 'dist', 'index.html');
    import('fs/promises').then(fs => {
        fs.access(indexFile)
            .then(() => res.sendFile(indexFile))
            .catch(() => res.status(404).send('Build not found. Please run npm run build.'));
    });
});

// 初始化目录并启动服务器
(async () => {
    await ensureDataDir();
    await ensureUploadDir();

    // 初始化 SQLite 数据库
    console.log('[Startup] Initializing database...');
    initDatabase();

    // 初始化所有定时任务
    await initializeScheduledTasks();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();

export default app;
