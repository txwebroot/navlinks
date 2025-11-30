import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { SubscriptionDAO } from '../database/dao/SubscriptionDAO.js';
import { NotificationDAO } from '../database/dao/NotificationDAO.js';
import { runSubscriptionCheck, setupSubscriptionCheckSchedule } from '../services/subscriptionCheck.js';
import {
    sendAllNotifications,
    sendBarkNotification,
    sendTelegramNotification,
    sendEmailNotification,
    sendWebhookNotification
} from '../services/notification.js';

const router = express.Router();

// 延迟获取 DAO 实例（确保数据库已初始化）
const getSubscriptionDAO = () => new SubscriptionDAO();
const getNotificationDAO = () => new NotificationDAO();

// 配置 Multer 存储 (JSON)
const jsonStorage = multer.memoryStorage();
const jsonUpload = multer({
    storage: jsonStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'));
        }
    }
});

// API: 获取所有订阅 (公开)
router.get('/', async (req, res) => {
    try {
        const subscriptions = await getSubscriptionDAO().getAll();
        res.json(subscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Failed to get subscriptions' });
    }
});

// API: 创建订阅 (需要认证)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newSubscription = {
            ...req.body,
            id: uuidv4(),
            isActive: req.body.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const created = await getSubscriptionDAO().create(newSubscription);
        res.status(201).json(created);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// API: 更新订阅 (需要认证)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await getSubscriptionDAO().update(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

// API: 删除订阅 (需要认证)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await getSubscriptionDAO().delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({ success: true, message: 'Subscription deleted' });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
});

// API: 获取通知设置 (公开)
router.get('/settings/notifications', async (req, res) => {
    try {
        const settings = await getNotificationDAO().get();
        res.json(settings || {});
    } catch (error) {
        console.error('Get notification settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// API: 保存通知设置 (需要认证)
router.post('/settings/notifications', authenticateToken, async (req, res) => {
    try {
        await getNotificationDAO().save(req.body);

        // 更新定时任务
        await setupSubscriptionCheckSchedule();

        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error('Save notification settings error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// API: 手动触发订阅检查 (需要认证)
router.post('/check', authenticateToken, async (req, res) => {
    try {
        const { force } = req.body;
        console.log('[API] 手动触发订阅检查, force:', force);

        // 异步执行检查，不阻塞响应
        runSubscriptionCheck(force === true).catch(err => {
            console.error('[API] 订阅检查执行失败:', err);
        });

        res.json({ success: true, message: '订阅检查已触发' });
    } catch (error) {
        console.error('Manual subscription check error:', error);
        res.status(500).json({ error: 'Failed to trigger check' });
    }
});

// API: 手动触发订阅检查 (别名路由，需要认证)
router.post('/check-expiry', authenticateToken, async (req, res) => {
    try {
        const { force } = req.body;
        console.log('[API] 手动触发订阅检查 (check-expiry), force:', force);

        // 异步执行检查，不阻塞响应
        runSubscriptionCheck(force === true).catch(err => {
            console.error('[API] 订阅检查执行失败:', err);
        });

        res.json({ success: true, message: '订阅检查已触发，将在后台执行并发送通知' });
    } catch (error) {
        console.error('Manual subscription check error:', error);
        res.status(500).json({ error: 'Failed to trigger check' });
    }
});

// API: 测试通知发送 (需要认证)
router.post('/test-notification', authenticateToken, async (req, res) => {
    try {
        const { platform } = req.body;
        const settings = await getNotificationDAO().get() || {};

        const timezone = settings.timezone || 'Asia/Shanghai';
        const currentTime = new Date().toLocaleString('zh-CN', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const title = '订阅通知测试';
        const content = `这是一条测试通知，用于验证通知配置是否正确。\n\n发送时间: ${currentTime}\n时区: ${timezone}`;

        let results = [];

        // 根据指定的平台发送测试通知
        if (platform === 'bark') {
            const result = await sendBarkNotification(settings, title, content);
            if (!result.skipped) results.push(result);
        } else if (platform === 'telegram') {
            const result = await sendTelegramNotification(settings, title, content);
            if (!result.skipped) results.push(result);
        } else if (platform === 'email') {
            const result = await sendEmailNotification(settings, title, content);
            if (!result.skipped) results.push(result);
        } else if (platform === 'webhook') {
            const result = await sendWebhookNotification(settings, title, content);
            if (!result.skipped) results.push(result);
        } else {
            // 如果没有指定平台，发送所有启用的通知
            results = await sendAllNotifications(settings, title, content);
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Failed to send test notification: ' + error.message });
    }
});

// API: 导出订阅数据 (需要认证)
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const subscriptions = await getSubscriptionDAO().getAll();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=subscriptions-backup-${new Date().toISOString().split('T')[0]}.json`);
        res.json(subscriptions);
    } catch (error) {
        console.error('Export subscriptions error:', error);
        res.status(500).json({ error: 'Failed to export subscriptions' });
    }
});

// API: 导入订阅数据 (需要认证)
router.post('/import', authenticateToken, jsonUpload.single('file'), async (req, res) => {
    try {
        let data;

        // 支持文件上传
        if (req.file) {
            try {
                const jsonContent = req.file.buffer.toString('utf8');
                data = JSON.parse(jsonContent);
                // 如果是 { data: [...] } 格式，提取 data 字段
                if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                }
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON format' });
            }
        }
        // 兼容旧的 JSON Body 方式 (如果有)
        else if (req.body.data) {
            data = req.body.data;
        } else {
            return res.status(400).json({ error: 'No file uploaded or data provided' });
        }

        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data format: expected an array' });
        }

        // 验证数据格式
        for (const sub of data) {
            if (!sub.name || !sub.expiryDate) {
                return res.status(400).json({ error: 'Invalid subscription data: missing name or expiryDate' });
            }
        }

        // 导入数据
        let count = 0;
        for (const sub of data) {
            try {
                // 如果没有ID，生成新ID
                if (!sub.id) {
                    sub.id = uuidv4();
                }
                // 检查是否存在，如果存在则更新，否则创建
                const existing = await getSubscriptionDAO().getById(sub.id);
                if (existing) {
                    await getSubscriptionDAO().update(sub.id, sub);
                } else {
                    await getSubscriptionDAO().create(sub);
                }
                count++;
            } catch (error) {
                console.error(`Failed to import subscription: ${sub.name}`, error);
            }
        }

        res.json({ success: true, message: `成功导入 ${count} 条订阅数据` });
    } catch (error) {
        console.error('Import subscriptions error:', error);
        res.status(500).json({ error: 'Failed to import subscriptions: ' + error.message });
    }
});

// API: 清空所有订阅数据 (需要认证)
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const subscriptions = await getSubscriptionDAO().getAll();
        for (const sub of subscriptions) {
            await getSubscriptionDAO().delete(sub.id);
        }
        res.json({ success: true, message: '所有订阅数据已清空' });
    } catch (error) {
        console.error('Clear subscriptions error:', error);
        res.status(500).json({ error: 'Failed to clear subscriptions' });
    }
});

export default router;
