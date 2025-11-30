import fs from 'fs/promises';
import { DATA_DIR, UPLOAD_DIR } from '../config/config.js';

// 确保数据目录存在
export const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

// 确保上传目录存在
export const ensureUploadDir = async () => {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
};
