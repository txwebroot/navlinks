import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAppConfig, saveAppConfig, updateAppStatus } from '../config/appConfig.js';

const router = express.Router();

// API: 获取应用配置（公开，无需认证）
router.get('/', async (req, res) => {
    try {
        const config = await getAppConfig();
        res.json(config);
    } catch (error) {
        console.error('Get app config error:', error);
        res.status(500).json({ error: 'Failed to get app config' });
    }
});

// API: 更新应用配置（需要认证）
router.post('/', authenticateToken, async (req, res) => {
    try {
        const config = req.body;
        await saveAppConfig(config);
        res.json({ success: true, message: 'App config saved', config });
    } catch (error) {
        console.error('Save app config error:', error);
        res.status(500).json({ error: 'Failed to save app config' });
    }
});

// API: 更新单个应用状态（需要认证）
router.patch('/:appName', authenticateToken, async (req, res) => {
    try {
        const { appName } = req.params;
        const { enabled } = req.body;
        
        const config = await updateAppStatus(appName, enabled);
        res.json({ 
            success: true, 
            message: `${appName} 应用已${enabled ? '启用' : '禁用'}`,
            config 
        });
    } catch (error) {
        console.error('Update app status error:', error);
        res.status(500).json({ error: 'Failed to update app status' });
    }
});

export default router;
