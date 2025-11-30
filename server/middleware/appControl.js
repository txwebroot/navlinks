import { getAppConfig } from '../config/appConfig.js';

/**
 * 检查应用是否启用的中间件
 * @param {string} appName - 应用名称（如 'sub', 'blog'）
 */
export function checkAppEnabled(appName) {
    return async (req, res, next) => {
        try {
            const config = await getAppConfig();
            
            // 检查应用是否启用
            if (!config.enabledApps || !config.enabledApps[appName]) {
                return res.status(403).json({ 
                    error: '应用未启用',
                    message: `${appName} 应用当前处于禁用状态`,
                    appName: appName
                });
            }
            
            next();
        } catch (error) {
            console.error(`[应用控制] 检查 ${appName} 状态失败:`, error);
            // 出错时允许访问，避免因配置问题导致服务不可用
            next();
        }
    };
}
