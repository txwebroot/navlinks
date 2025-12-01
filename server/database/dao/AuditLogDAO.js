import { getDatabase } from '../index.js';

/**
 * Audit Log DAO - 审计日志数据访问层
 */
export class AuditLogDAO {
    /**
     * 创建审计日志
     */
    static create(log) {
        const db = getDatabase();
        const { server_id, action, resource_type, resource_id, resource_name, status, error_message, user_info } = log;
        
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO docker_audit_logs (server_id, action, resource_type, resource_id, resource_name, status, error_message, user_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [server_id, action, resource_type, resource_id, resource_name, status || 'success', error_message, user_info], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...log });
            });
        });
    }

    /**
     * 获取指定服务器的日志
     */
    static getByServer(serverId, limit = 100) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM docker_audit_logs WHERE server_id = ? ORDER BY created_at DESC LIMIT ?',
                [serverId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * 获取所有日志
     */
    static getAll(limit = 100) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM docker_audit_logs ORDER BY created_at DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * 获取指定操作的日志
     */
    static getByAction(action, limit = 50) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM docker_audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?',
                [action, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * 清理旧日志（保留最近N天）
     */
    static cleanup(daysToKeep = 30) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM docker_audit_logs WHERE created_at < datetime('now', '-${daysToKeep} days')`,
                function(err) {
                    if (err) reject(err);
                    else resolve({ deleted: this.changes });
                }
            );
        });
    }

    /**
     * 删除指定服务器的所有日志
     */
    static deleteByServer(serverId) {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM docker_audit_logs WHERE server_id = ?', [serverId], function(err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes });
            });
        });
    }
}
