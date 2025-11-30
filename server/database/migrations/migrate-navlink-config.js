#!/usr/bin/env node

/**
 * NavLink 配置迁移脚本
 * 将 db.json 迁移到 SQLite site_config 表
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../index.js';
import { SiteConfigDAO } from '../dao/SiteConfigDAO.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_JSON_FILE = path.join(DATA_DIR, 'db.json');

console.log('');
console.log('===========================================');
console.log('NavLink 配置迁移：JSON → SQLite');
console.log('===========================================');
console.log('');

async function migrateNavLinkConfig() {
    try {
        // 1. 检查 db.json 是否存在
        console.log('[1/4] 检查 db.json 文件...');
        try {
            await fs.access(DB_JSON_FILE);
            console.log('  ✓ db.json 文件存在');
        } catch (error) {
            console.log('  - db.json 文件不存在，跳过迁移');
            return;
        }

        // 2. 读取 db.json
        console.log('\n[2/4] 读取 NavLink 配置...');
        const jsonContent = await fs.readFile(DB_JSON_FILE, 'utf-8');
        const config = JSON.parse(jsonContent);
        console.log(`  ✓ 配置已读取（${Object.keys(config).length} 个字段）`);
        console.log(`     包含: ${Object.keys(config).join(', ')}`);

        // 3. 备份 db.json
        console.log('\n[3/4] 备份 db.json...');
        const timestamp = Date.now();
        const backupDir = path.join(DATA_DIR, `backup_${timestamp}`);
        await fs.mkdir(backupDir, { recursive: true });
        const backupFile = path.join(backupDir, 'db.json');
        await fs.copyFile(DB_JSON_FILE, backupFile);
        console.log(`  ✓ 备份到: ${backupDir}/db.json`);

        // 4. 初始化数据库并迁移
        console.log('\n[4/4] 迁移到 SQLite...');
        await initDatabase();

        const siteConfigDAO = new SiteConfigDAO();
        const success = await siteConfigDAO.saveSync(config);

        if (success) {
            console.log('  ✓ NavLink 配置已成功迁移到 site_config 表');

            // 验证数据
            const savedConfig = await siteConfigDAO.getSync();
            if (savedConfig && Object.keys(savedConfig).length === Object.keys(config).length) {
                console.log('  ✓ 数据验证通过');
            } else {
                console.log('  ⚠️  数据验证警告：字段数量可能不一致');
            }
        } else {
            throw new Error('迁移失败');
        }

        console.log('');
        console.log('===========================================');
        console.log('✅ NavLink 配置迁移完成！');
        console.log('===========================================');
        console.log('');
        console.log(`备份位置: ${backupDir}`);
        console.log('');
        console.log('下一步:');
        console.log('1. 重启服务器');
        console.log('2. 验证 NavLink 主页正常显示');
        console.log('3. 如果一切正常，7天后可删除 db.json');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ 迁移失败:', error.message);
        console.error('');
        console.error('错误详情:', error);
        process.exit(1);
    }
}

// 执行迁移
migrateNavLinkConfig().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('迁移过程出错:', error);
    process.exit(1);
});
