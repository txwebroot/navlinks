import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import https from 'https';
import { DATA_DIR, UPLOAD_DIR, ROOT_DIR } from '../config/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureDataDir, ensureUploadDir } from '../utils/fileHelper.js';
import { checkUrlHealth } from '../services/healthCheck.js';
import { setupHealthCheckSchedule } from '../jobs/scheduledTasks.js';
import { SiteConfigDAO } from '../database/dao/SiteConfigDAO.js';

// 延迟获取 DAO 实例
const getSiteConfigDAO = () => new SiteConfigDAO();

const router = express.Router();

// 配置 Multer 存储


// 配置 Multer 存储 (JSON)
const jsonStorage = multer.memoryStorage(); // JSON 文件较小，直接存内存处理
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

// API: 获取配置 (公开)
router.get('/config', async (req, res) => {
    try {
        const config = await getSiteConfigDAO().get();
        res.json(config || null);
    } catch (error) {
        console.error('Read config error:', error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

// API: 保存配置 (需要认证)
router.post('/config', authenticateToken, async (req, res) => {
    try {
        const success = await getSiteConfigDAO().save(req.body);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save config' });
        }
    } catch (error) {
        console.error('Save config error:', error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// API: 导入配置 (需要认证)
router.post('/config/import', authenticateToken, jsonUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 解析 JSON
        const jsonContent = req.file.buffer.toString('utf8');
        let config;
        try {
            config = JSON.parse(jsonContent);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }

        // 基础验证
        if (!config || typeof config !== 'object') {
            return res.status(400).json({ error: 'Invalid config data' });
        }

        // 保存到数据库
        const success = await getSiteConfigDAO().save(config);
        if (success) {
            res.json({ success: true, message: 'Config imported successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save config to database' });
        }
    } catch (error) {
        console.error('Import config error:', error);
        res.status(500).json({ error: 'Failed to import config: ' + error.message });
    }
});

// API: 导出配置文件
router.get('/config/export', authenticateToken, async (req, res) => {
    try {
        const data = await getSiteConfigDAO().export();
        if (data) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=navlink-config-${new Date().toISOString().split('T')[0]}.json`);
            res.send(data);
        } else {
            res.status(404).json({ error: 'No config found' });
        }
    } catch (error) {
        console.error('Export config error:', error);
        res.status(500).json({ error: 'Failed to export config' });
    }
});

// API: 批量检查链接健康状态
router.post('/check-links', authenticateToken, async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const { checkUrlHealth } = await import('../services/healthCheck.js');
        const results = await Promise.all(
            urls.map(async (url) => {
                const result = await checkUrlHealth(url);
                return { url, ...result };
            })
        );

        res.json({ results });
    } catch (error) {
        console.error('Check links error:', error);
        res.status(500).json({ error: 'Failed to check links' });
    }
});

// API: 保存健康检查计划配置
router.post('/health-check-schedule', authenticateToken, async (req, res) => {
    try {
        const { enabled, time } = req.body;

        // 获取当前配置
        const config = await getSiteConfigDAO().get();
        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        // 更新健康检查配置
        config.healthCheckSchedule = { enabled, time };

        // 保存配置
        await getSiteConfigDAO().save(config);

        res.json({ success: true });
    } catch (error) {
        console.error('Save health check schedule error:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// API: 检查单个 URL 的健康状态 (需要认证)
router.post('/check-url', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        const result = await checkUrlHealth(url);
        res.json(result);
    } catch (error) {
        console.error('URL check error:', error);
        res.status(500).json({ error: 'Failed to check URL' });
    }
});

// API: 批量检查 URL 健康状态 (需要认证)
router.post('/check-health', authenticateToken, async (req, res) => {
    try {
        const { urls } = req.body;
        const results = await Promise.all(urls.map(url => checkUrlHealth(url)));
        res.json(results);
    } catch (error) {
        console.error('Batch health check error:', error);
        res.status(500).json({ error: 'Failed to check health' });
    }
});

// API: 更新健康检测计划 (需要认证)
router.post('/update-health-schedule', authenticateToken, async (req, res) => {
    try {
        await setupHealthCheckSchedule();
        res.json({ success: true, message: '健康检测计划已更新' });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});





export default router;
