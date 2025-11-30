import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_PASSWORD } from '../config/config.js';

const router = express.Router();

// API: 登录获取 Token
router.post('/login', (req, res) => {
    const { password } = req.body;
    console.log('[Login] 登录尝试, JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
    
    if (password === ADMIN_PASSWORD) {
        // 生成 Token，有效期 24 小时
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        console.log('[Login] 登录成功, Token:', token.substring(0, 30) + '...');
        res.json({ token });
    } else {
        console.log('[Login] 登录失败: 密码错误');
        res.status(401).json({ error: 'Invalid password' });
    }
});

export default router;
