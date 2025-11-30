import { getDatabase, promisifyDb } from '../index.js';

export class NotificationDAO {
    constructor() {
        this.db = getDatabase();
        this.dbAsync = promisifyDb(this.db);
    }

    /**
     * 获取通知设置
     */
    async get() {
        const row = await this.dbAsync.get('SELECT settings_data FROM notification_settings WHERE id = 1');
        return row ? JSON.parse(row.settings_data) : null;
    }

    /**
     * 保存通知设置
     */
    async save(settings) {
        const settingsJson = JSON.stringify(settings);
        const result = await this.dbAsync.run(
            `INSERT INTO notification_settings (id, settings_data) VALUES (1, ?)
             ON CONFLICT(id) DO UPDATE SET settings_data = excluded.settings_data`,
            [settingsJson]
        );
        return result.changes > 0;
    }

    /**
     * 更新单个通知渠道配置
     */
    async updateChannel(channel, config) {
        const settings = await this.get() || {};
        settings[channel] = { ...settings[channel], ...config };
        return await this.save(settings);
    }

    /**
     * 启用/禁用通知渠道
     */
    async toggleChannel(channel, enabled) {
        const settings = await this.get() || {};
        if (!settings[channel]) {
            settings[channel] = {};
        }
        settings[channel].enabled = enabled;
        return await this.save(settings);
    }

    /**
     * 同步保存（用于迁移脚本）
     */
    saveSync(settings) {
        return new Promise((resolve, reject) => {
            const settingsJson = JSON.stringify(settings);
            this.db.run(
                `INSERT INTO notification_settings (id, settings_data) VALUES (1, ?)
                 ON CONFLICT(id) DO UPDATE SET settings_data = excluded.settings_data`,
                [settingsJson],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}
