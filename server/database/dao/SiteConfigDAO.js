import { getDatabase, promisifyDb } from '../index.js';

export class SiteConfigDAO {
    constructor() {
        this.db = getDatabase();
        this.dbAsync = promisifyDb(this.db);
    }

    /**
     * 获取站点配置
     * @returns {Object|null} 配置对象，如果不存在返回 null
     */
    async get() {
        try {
            const row = await this.dbAsync.get('SELECT config_data FROM site_config WHERE id = 1');
            if (!row || !row.config_data) {
                return null;
            }
            return JSON.parse(row.config_data);
        } catch (error) {
            console.error('[SiteConfigDAO] 获取配置失败:', error);
            return null;
        }
    }

    /**
     * 保存站点配置（插入或更新）
     * @param {Object} config 配置对象
     * @returns {boolean} 是否成功
     */
    async save(config) {
        try {
            const configJson = JSON.stringify(config);

            // 先检查是否存在记录
            const existing = await this.dbAsync.get('SELECT id FROM site_config WHERE id = 1');

            if (existing) {
                // 更新现有记录
                await this.dbAsync.run(
                    'UPDATE site_config SET config_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                    [configJson]
                );
            } else {
                // 插入新记录
                await this.dbAsync.run(
                    'INSERT INTO site_config (id, config_data) VALUES (1, ?)',
                    [configJson]
                );
            }

            return true;
        } catch (error) {
            console.error('[SiteConfigDAO] 保存配置失败:', error);
            return false;
        }
    }

    /**
     * 更新配置（别名，方便调用）
     * @param {Object} config 配置对象
     * @returns {boolean} 是否成功
     */
    async update(config) {
        return await this.save(config);
    }

    /**
     * 导出配置为 JSON 字符串
     * @returns {string|null} JSON 字符串
     */
    async export() {
        try {
            const config = await this.get();
            if (!config) {
                return null;
            }
            return JSON.stringify(config, null, 2);
        } catch (error) {
            console.error('[SiteConfigDAO] 导出配置失败:', error);
            return null;
        }
    }

    /**
     * 同步获取配置（用于迁移脚本）
     * @returns {Promise<Object|null>}
     */
    getSync() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT config_data FROM site_config WHERE id = 1', (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row || !row.config_data) {
                    resolve(null);
                } else {
                    try {
                        resolve(JSON.parse(row.config_data));
                    } catch (parseError) {
                        reject(parseError);
                    }
                }
            });
        });
    }

    /**
     * 同步保存配置（用于迁移脚本）
     * @param {Object} config 配置对象
     * @returns {Promise<boolean>}
     */
    saveSync(config) {
        return new Promise((resolve, reject) => {
            const configJson = JSON.stringify(config);

            // 先检查是否存在
            this.db.get('SELECT id FROM site_config WHERE id = 1', (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // 更新
                    this.db.run(
                        'UPDATE site_config SET config_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                        [configJson],
                        function (updateErr) {
                            if (updateErr) reject(updateErr);
                            else resolve(this.changes > 0);
                        }
                    );
                } else {
                    // 插入
                    this.db.run(
                        'INSERT INTO site_config (id, config_data) VALUES (1, ?)',
                        [configJson],
                        function (insertErr) {
                            if (insertErr) reject(insertErr);
                            else resolve(this.changes > 0);
                        }
                    );
                }
            });
        });
    }
}
