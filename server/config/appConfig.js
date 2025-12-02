import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from './config.js';
import { ensureDataDir } from '../utils/fileHelper.js';

const APP_CONFIG_FILE = path.join(DATA_DIR, 'app_config.json');

/**
 * 默认应用配置
 */
const DEFAULT_APP_CONFIG = {
    enabledApps: {
        sub: true,
        docker: true,
        vps: true,
        blog: false,
        todo: false
    }
};

/**
 * 读取应用配置
 */
export async function getAppConfig() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(APP_CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // 文件不存在，返回默认配置
        return DEFAULT_APP_CONFIG;
    }
}

/**
 * 保存应用配置
 */
export async function saveAppConfig(config) {
    try {
        await ensureDataDir();
        await fs.writeFile(APP_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('[应用配置] 保存失败:', error);
        throw error;
    }
}

/**
 * 更新单个应用状态
 */
export async function updateAppStatus(appName, enabled) {
    const config = await getAppConfig();
    config.enabledApps[appName] = enabled;
    await saveAppConfig(config);
    return config;
}
