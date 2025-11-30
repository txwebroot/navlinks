import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'navlink.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * 初始化数据库连接
 */
export function initDatabase() {
    if (db) return db;

    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接（启用 verbose 模式用于开发调试）
    const SqliteDB = process.env.NODE_ENV === 'development' ? sqlite3.verbose().Database : sqlite3.Database;
    db = new SqliteDB(DB_PATH, (err) => {
        if (err) {
            console.error('[Database] Failed to connect:', err);
            throw err;
        }
    });

    // 启用 WAL 模式（性能优化）
    db.run('PRAGMA journal_mode = WAL');

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');

    // 初始化 Schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('[Database] Failed to initialize schema:', err);
            throw err;
        }
        console.log('[Database] SQLite initialized at:', DB_PATH);
    });

    return db;
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('[Database] Error closing connection:', err);
                    reject(err);
                } else {
                    db = null;
                    console.log('[Database] Connection closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

/**
 * Promise 化的数据库方法
 */
export function promisifyDb(db) {
    return {
        run: (sql, params) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        },
        get: promisify(db.get.bind(db)),
        all: promisify(db.all.bind(db)),
        exec: promisify(db.exec.bind(db))
    };
}

// 优雅退出
process.on('exit', () => {
    if (db) {
        db.close();
    }
});

process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
});
