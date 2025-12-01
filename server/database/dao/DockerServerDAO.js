import { getDatabase } from '../index.js';

/**
 * Docker Server DAO - 数据访问层
 */
export class DockerServerDAO {
    /**
     * 获取所有服务器
     */
    static getAll() {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM docker_servers ORDER BY is_default DESC, created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * 根据ID获取服务器
     */
    static getById(id) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM docker_servers WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    /**
     * 获取默认服务器
     */
    static getDefault() {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM docker_servers WHERE is_default = 1', (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    /**
     * 创建服务器
     */
    static create(server) {
        const db = getDatabase();
        const { id, name, description, connection_type, host, port, ca_cert, client_cert, client_key, ssh_user, ssh_password, ssh_private_key, ssh_port, is_default, tags } = server;

        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO docker_servers (id, name, description, connection_type, host, port, ca_cert, client_cert, client_key, ssh_user, ssh_password, ssh_private_key, ssh_port, is_default, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, name, description || '', connection_type, host, port, ca_cert, client_cert, client_key, ssh_user, ssh_password, ssh_private_key, ssh_port || 22, is_default || 0, tags || ''], function (err) {
                if (err) reject(err);
                else resolve({ id, ...server });
            });
        });
    }

    /**
     * 更新服务器
     */
    static update(id, updates) {
        const db = getDatabase();
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (key !== 'id' && updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            return Promise.resolve();
        }

        values.push(id);

        return new Promise((resolve, reject) => {
            db.run(`UPDATE docker_servers SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 删除服务器
     */
    static delete(id) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM docker_servers WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 更新服务器状态
     */
    static updateStatus(id, status, latency = 0, error = null) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run(`
                UPDATE docker_servers 
                SET status = ?, latency = ?, last_error = ?, last_check_time = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, latency, error, id], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 设置默认服务器
     */
    static setDefault(id) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            // 先清除所有默认标记
            db.run('UPDATE docker_servers SET is_default = 0', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                // 设置新的默认服务器
                db.run('UPDATE docker_servers SET is_default = 1 WHERE id = ?', [id], function (err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }
}
