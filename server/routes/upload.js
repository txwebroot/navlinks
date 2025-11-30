import express from 'express';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import https from 'https';
import fs from 'fs/promises';
import { UPLOAD_DIR } from '../config/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { ensureUploadDir } from '../utils/fileHelper.js';
import { SiteConfigDAO } from '../database/dao/SiteConfigDAO.js';

// 延迟获取 DAO 实例
const getSiteConfigDAO = () => new SiteConfigDAO();

const router = express.Router();

// 配置 Multer 存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// API: 上传图片 (需要认证)
router.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// API: 下载远程图标并保存到本地 (需要认证)
router.post('/download-icon', authenticateToken, async (req, res) => {
    const { iconUrl } = req.body;

    if (!iconUrl) {
        return res.status(400).json({ error: 'Icon URL is required' });
    }

    try {
        await ensureUploadDir();

        // 下载图片
        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(iconUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            httpsAgent: agent
        });

        // 生成文件名
        const ext = path.extname(new URL(iconUrl).pathname) || '.png';
        const filename = `icon-${Date.now()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // 保存文件
        await fs.writeFile(filepath, response.data);

        const localUrl = `/uploads/${filename}`;
        res.json({ url: localUrl });
    } catch (error) {
        console.error('Download icon error:', error);
        res.status(500).json({ error: 'Failed to download icon: ' + error.message });
    }
});

// API: 获取上传文件列表 (需要认证)
router.get('/uploads', authenticateToken, async (req, res) => {
    try {
        await ensureUploadDir();
        const fileNames = await fs.readdir(UPLOAD_DIR);

        // 获取文件详情
        const fileDetails = await Promise.all(
            fileNames.map(async (filename) => {
                try {
                    const filepath = path.join(UPLOAD_DIR, filename);
                    const stats = await fs.stat(filepath);

                    // 过滤隐藏文件
                    if (filename.startsWith('.')) {
                        return null;
                    }

                    return {
                        filename: filename,
                        size: stats.size,
                        path: `/uploads/${filename}`,
                        uploadedAt: stats.birthtime.toISOString(),
                        modifiedAt: stats.mtime.toISOString()
                    };
                } catch (error) {
                    return null;
                }
            })
        );

        // 过滤null并按时间排序
        const validFiles = fileDetails
            .filter(f => f !== null)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // 计算统计信息
        const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
        const stats = {
            totalFiles: validFiles.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };

        res.json({ files: validFiles, stats });
    } catch (error) {
        console.error('List uploads error:', error);
        res.status(500).json({ error: 'Failed to list uploads' });
    }
});

// API: 获取文件引用信息 (需要认证)
router.get('/uploads/:filename/references', authenticateToken, async (req, res) => {
    try {
        const filename = req.params.filename;
        const fileUrl = `/uploads/${filename}`;

        // 读取配置检查引用
        const references = [];
        let usageCount = 0;

        try {
            const config = await getSiteConfigDAO().get();

            // 如果配置不存在，返回空引用
            if (!config) {
                res.json({ usageCount: 0, references: [] });
                return;
            }

            // 检查各个位置的引用
            if (config.logoUrl === fileUrl) {
                references.push({ location: '网站Logo', type: 'logo' });
                usageCount++;
            }

            if (config.favicon === fileUrl) {
                references.push({ location: '网站图标(Favicon)', type: 'favicon' });
                usageCount++;
            }

            // 检查分类图标
            if (config.categories && Array.isArray(config.categories)) {
                config.categories.forEach((cat) => {
                    if (cat.icon === fileUrl) {
                        references.push({ location: `分类: ${cat.name}`, type: 'category' });
                        usageCount++;
                    }

                    // 检查分类下的链接
                    if (cat.items && Array.isArray(cat.items)) {
                        cat.items.forEach((item) => {
                            if (item.icon === fileUrl) {
                                references.push({ location: `${cat.name} / ${item.title}`, type: 'link' });
                                usageCount++;
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('[NavLink] 检查文件引用失败:', error);
            // 配置读取失败，返回空引用
        }

        res.json({ usageCount, references });
    } catch (error) {
        console.error('Get references error:', error);
        res.status(500).json({ error: 'Failed to get references' });
    }
});

// API: 批量删除文件 (需要认证)
router.post('/uploads/batch-delete', authenticateToken, async (req, res) => {
    try {
        const { filenames } = req.body;

        if (!Array.isArray(filenames) || filenames.length === 0) {
            return res.status(400).json({ error: 'Invalid filenames array' });
        }

        let deletedCount = 0;
        let failedCount = 0;

        for (const filename of filenames) {
            try {
                // 防止路径遍历攻击
                if (filename.includes('..') || filename.includes('/')) {
                    failedCount++;
                    continue;
                }

                const filepath = path.join(UPLOAD_DIR, filename);
                await fs.unlink(filepath);
                deletedCount++;
            } catch (error) {
                failedCount++;
            }
        }

        res.json({ success: true, deletedCount, failedCount });
    } catch (error) {
        console.error('Batch delete error:', error);
        res.status(500).json({ error: 'Failed to batch delete files' });
    }
});

// API: 重命名文件 (需要认证)
router.post('/uploads/rename', authenticateToken, async (req, res) => {
    try {
        const { oldFilename, newFilename } = req.body;

        if (!oldFilename || !newFilename) {
            return res.status(400).json({ error: 'Missing filename' });
        }

        // 防止路径遍历攻击
        if (oldFilename.includes('..') || oldFilename.includes('/') ||
            newFilename.includes('..') || newFilename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const oldPath = path.join(UPLOAD_DIR, oldFilename);
        const newPath = path.join(UPLOAD_DIR, newFilename);

        // 检查新文件名是否已存在
        try {
            await fs.access(newPath);
            return res.status(400).json({ error: 'File already exists' });
        } catch {
            // 文件不存在，可以重命名
        }

        await fs.rename(oldPath, newPath);

        // 更新配置中的引用
        try {
            const config = await getSiteConfigDAO().get();

            // 如果配置不存在，跳过引用更新
            if (!config) {
                res.json({ success: true, newFilename });
                return;
            }

            const oldUrl = `/uploads/${oldFilename}`;
            const newUrl = `/uploads/${newFilename}`;

            let updated = false;

            if (config.logoUrl === oldUrl) {
                config.logoUrl = newUrl;
                updated = true;
            }

            if (config.favicon === oldUrl) {
                config.favicon = newUrl;
                updated = true;
            }

            if (config.categories && Array.isArray(config.categories)) {
                config.categories.forEach(cat => {
                    if (cat.icon === oldUrl) {
                        cat.icon = newUrl;
                        updated = true;
                    }
                    if (cat.items && Array.isArray(cat.items)) {
                        cat.items.forEach(item => {
                            if (item.icon === oldUrl) {
                                item.icon = newUrl;
                                updated = true;
                            }
                        });
                    }
                });
            }

            if (updated) {
                await getSiteConfigDAO().save(config);
            }
        } catch (error) {
            // 配置文件更新失败，但文件已重命名
        }

        res.json({ success: true, newFilename });
    } catch (error) {
        console.error('Rename file error:', error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// API: 删除上传文件 (需要认证)
router.delete('/uploads/:filename', authenticateToken, async (req, res) => {
    try {
        const filename = req.params.filename;
        // 防止路径遍历攻击
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filepath = path.join(UPLOAD_DIR, filename);
        await fs.unlink(filepath);

        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('Delete upload error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
