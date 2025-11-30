import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
export const ROOT_DIR = path.resolve(__dirname, '../..');

// 服务器配置
export const PORT = process.env.PORT || 3001;

// 数据目录配置
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
export const CUSTOM_REMINDERS_FILE = path.join(DATA_DIR, 'custom_reminders.json');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

// 安全配置
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
