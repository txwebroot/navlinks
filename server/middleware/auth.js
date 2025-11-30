import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

// Middleware: 验证 JWT Token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('[Auth] 收到认证请求:', {
        path: req.path,
        hasAuthHeader: !!authHeader,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });

    if (!token) {
        console.log('[Auth] 认证失败: Token不存在');
        return res.status(401).json({ error: 'Unauthorized', message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('[Auth] Token验证失败:', {
                error: err.name,
                message: err.message,
                tokenPreview: token.substring(0, 30) + '...'
            });
            return res.status(403).json({ error: 'Forbidden', message: '认证令牌无效或已过期' });
        }
        console.log('[Auth] 认证成功:', user);
        req.user = user;
        next();
    });
};
