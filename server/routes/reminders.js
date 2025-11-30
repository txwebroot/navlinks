import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { ReminderDAO } from '../database/dao/ReminderDAO.js';

const router = express.Router();

// 延迟获取 DAO 实例
const getReminderDAO = () => new ReminderDAO();

// API: 获取所有自定义提醒 (公开)
router.get('/', async (req, res) => {
    try {
        const reminders = await getReminderDAO().getAll();
        res.json(reminders);
    } catch (error) {
        console.error('Get custom reminders error:', error);
        res.status(500).json({ error: 'Failed to get custom reminders' });
    }
});

// API: 创建自定义提醒 (需要认证)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newReminder = {
            ...req.body,
            id: uuidv4(),
            isActive: req.body.isActive ?? true,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const created = await getReminderDAO().create(newReminder);
        res.status(201).json(created);
    } catch (error) {
        console.error('Create custom reminder error:', error);
        res.status(500).json({ error: 'Failed to create custom reminder' });
    }
});

// API: 更新自定义提醒 (需要认证)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await getReminderDAO().update(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update custom reminder error:', error);
        res.status(500).json({ error: 'Failed to update custom reminder' });
    }
});

// API: 删除自定义提醒 (需要认证)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await getReminderDAO().delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.json({ success: true, message: 'Reminder deleted' });
    } catch (error) {
        console.error('Delete custom reminder error:', error);
        res.status(500).json({ error: 'Failed to delete custom reminder' });
    }
});

export default router;
