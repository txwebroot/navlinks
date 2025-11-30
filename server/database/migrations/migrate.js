import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../index.js';
import { SiteConfigDAO } from '../dao/SiteConfigDAO.js';
import { SubscriptionDAO } from '../dao/SubscriptionDAO.js';
import { ReminderDAO } from '../dao/ReminderDAO.js';
import { NotificationDAO } from '../dao/NotificationDAO.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backup_' + Date.now());

/**
 * JSON 到 SQLite 迁移主函数
 */
export async function migrateFromJSON() {
    console.log('\n===========================================');
    console.log('开始数据迁移：JSON → SQLite');
    console.log('===========================================\n');

    try {
        // 1. 备份 JSON 文件
        await backupJSONFiles();

        // 2. 初始化数据库
        console.log('[准备] 初始化数据库...');
        initDatabase();
        console.log('  ✓ 数据库初始化完成\n');

        // 3. 迁移各类数据
        await migrateSiteConfig();
        await migrateSubscriptions();
        await migrateReminders();
        await migrateNotificationSettings();
        await migrateAppManagement();

        console.log('\n===========================================');
        console.log('✅ 数据迁移完成！');
        console.log('===========================================\n');
        console.log('备份位置:', BACKUP_DIR);
        console.log('\n下一步: 修改路由文件以使用数据库');

    } catch (error) {
        console.error('\n❌ 迁移失败:', error);
        console.error('\n可以从备份恢复:', BACKUP_DIR);
        throw error;
    }
}

/**
 * 备份 JSON 文件
 */
async function backupJSONFiles() {
    console.log('[1/6] 备份 JSON 文件...');

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const files = [
        'config.json',
        'subscriptions.json',
        'custom-reminders.json',
        'notification-settings.json',
        'app-management.json'
    ];

    for (const file of files) {
        const srcPath = path.join(DATA_DIR, file);
        const destPath = path.join(BACKUP_DIR, file);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✓ 备份: ${file}`);
        } else {
            console.log(`  - 跳过: ${file} (不存在)`);
        }
    }
    console.log('');
}

/**
 * 迁移站点配置
 */
async function migrateSiteConfig() {
    console.log('[2/6] 迁移站点配置...');

    const configPath = path.join(DATA_DIR, 'config.json');
    if (!fs.existsSync(configPath)) {
        console.log('  - 跳过: config.json 不存在\n');
        return;
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const dao = new SiteConfigDAO();

    await dao.saveSync(configData);
    console.log('  ✓ 站点配置迁移完成\n');
}

/**
 * 迁移订阅数据
 */
async function migrateSubscriptions() {
    console.log('[3/6] 迁移订阅数据...');

    const subsPath = path.join(DATA_DIR, 'subscriptions.json');
    if (!fs.existsSync(subsPath)) {
        console.log('  - 跳过: subscriptions.json 不存在\n');
        return;
    }

    const subscriptions = JSON.parse(fs.readFileSync(subsPath, 'utf-8'));
    if (!Array.isArray(subscriptions)) {
        console.log('  - 警告: subscriptions.json 格式不正确\n');
        return;
    }

    const dao = new SubscriptionDAO();

    let count = 0;
    for (const sub of subscriptions) {
        try {
            await dao.createSync(sub);
            count++;
        } catch (error) {
            console.error(`  ✗ 迁移订阅失败 (${sub.name}):`, error.message);
        }
    }

    console.log(`  ✓ 迁移了 ${count} 条订阅记录\n`);
}

/**
 * 迁移提醒数据
 */
async function migrateReminders() {
    console.log('[4/6] 迁移提醒数据...');

    const remindersPath = path.join(DATA_DIR, 'custom-reminders.json');
    if (!fs.existsSync(remindersPath)) {
        console.log('  - 跳过: custom-reminders.json 不存在\n');
        return;
    }

    const reminders = JSON.parse(fs.readFileSync(remindersPath, 'utf-8'));
    if (!Array.isArray(reminders)) {
        console.log('  - 警告: custom-reminders.json 格式不正确\n');
        return;
    }

    const dao = new ReminderDAO();

    let count = 0;
    for (const reminder of reminders) {
        try {
            await dao.createSync(reminder);
            count++;
        } catch (error) {
            console.error(`  ✗ 迁移提醒失败 (${reminder.title}):`, error.message);
        }
    }

    console.log(`  ✓ 迁移了 ${count} 条提醒记录\n`);
}

/**
 * 迁移通知设置
 */
async function migrateNotificationSettings() {
    console.log('[5/6] 迁移通知设置...');

    const settingsPath = path.join(DATA_DIR, 'notification-settings.json');
    if (!fs.existsSync(settingsPath)) {
        console.log('  - 跳过: notification-settings.json 不存在\n');
        return;
    }

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const dao = new NotificationDAO();

    await dao.saveSync(settings);
    console.log('  ✓ 通知设置迁移完成\n');
}

/**
 * 迁移应用管理配置
 */
async function migrateAppManagement() {
    console.log('[6/6] 迁移应用管理配置...');

    const appMgmtPath = path.join(DATA_DIR, 'app-management.json');
    if (!fs.existsSync(appMgmtPath)) {
        console.log('  - 跳过: app-management.json 不存在\n');
        return;
    }

    const appConfig = JSON.parse(fs.readFileSync(appMgmtPath, 'utf-8'));

    // App Management 也使用 config_data 存储，类似 site_config
    const { getDatabase } = await import('../index.js');
    const db = getDatabase();

    await new Promise((resolve, reject) => {
        const configJson = JSON.stringify(appConfig);
        db.run(
            `INSERT INTO app_management (id, config_data) VALUES (1, ?)
             ON CONFLICT(id) DO UPDATE SET config_data = excluded.config_data`,
            [configJson],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });

    console.log('  ✓ 应用管理配置迁移完成\n');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateFromJSON()
        .then(() => {
            console.log('\n🎉 迁移成功！请继续修改路由文件。');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 迁移失败！');
            console.error(error);
            process.exit(1);
        });
}
