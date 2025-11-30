import { getDatabase, promisifyDb } from '../index.js';

export class ReminderDAO {
    constructor() {
        this.db = getDatabase();
        this.dbAsync = promisifyDb(this.db);
    }

    /**
     * 获取所有提醒
     */
    async getAll() {
        const rows = await this.dbAsync.all('SELECT * FROM custom_reminders ORDER BY reminder_date ASC, reminder_time ASC');
        return rows.map(this._rowToReminder);
    }

    /**
     * 根据ID获取提醒
     */
    async getById(id) {
        const row = await this.dbAsync.get('SELECT * FROM custom_reminders WHERE id = ?', [id]);
        return row ? this._rowToReminder(row) : null;
    }

    /**
     * 创建提醒
     */
    async create(reminder) {
        const result = await this.dbAsync.run(
            `INSERT INTO custom_reminders (
                id, title, description, reminder_date, reminder_time,
                is_recurring, recurrence_pattern, is_completed, completed_at,
                category, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reminder.id,
                reminder.title,
                reminder.description || '',
                reminder.reminderDate,
                reminder.reminderTime || null,
                reminder.isRecurring ? 1 : 0,
                reminder.recurrencePattern ? JSON.stringify(reminder.recurrencePattern) : null,
                reminder.isCompleted ? 1 : 0,
                reminder.completedAt || null,
                reminder.category || '',
                reminder.priority || 'medium'
            ]
        );

        return result.changes > 0 ? await this.getById(reminder.id) : null;
    }

    /**
     * 更新提醒
     */
    async update(id, reminder) {
        const result = await this.dbAsync.run(
            `UPDATE custom_reminders SET
                title = ?, description = ?, reminder_date = ?, reminder_time = ?,
                is_recurring = ?, recurrence_pattern = ?, is_completed = ?,
                completed_at = ?, category = ?, priority = ?
            WHERE id = ?`,
            [
                reminder.title,
                reminder.description || '',
                reminder.reminderDate,
                reminder.reminderTime || null,
                reminder.isRecurring ? 1 : 0,
                reminder.recurrencePattern ? JSON.stringify(reminder.recurrencePattern) : null,
                reminder.isCompleted ? 1 : 0,
                reminder.completedAt || null,
                reminder.category || '',
                reminder.priority || 'medium',
                id
            ]
        );

        return result.changes > 0 ? await this.getById(id) : null;
    }

    /**
     * 删除提醒
     */
    async delete(id) {
        const result = await this.dbAsync.run('DELETE FROM custom_reminders WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * 获取未完成的提醒
     */
    async getActive() {
        const rows = await this.dbAsync.all('SELECT * FROM custom_reminders WHERE is_completed = 0 ORDER BY reminder_date ASC');
        return rows.map(this._rowToReminder);
    }

    /**
     * 获取今天的提醒
     */
    async getToday() {
        const rows = await this.dbAsync.all(
            `SELECT * FROM custom_reminders 
             WHERE is_completed = 0 
             AND date(reminder_date) = date('now', 'localtime')
             ORDER BY reminder_time ASC`
        );
        return rows.map(this._rowToReminder);
    }

    /**
     * 标记为完成
     */
    async markAsCompleted(id) {
        const result = await this.dbAsync.run(
            `UPDATE custom_reminders 
             SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [id]
        );
        return result.changes > 0;
    }

    /**
     * 清理已完成的提醒（超过N天）
     */
    async cleanupCompleted(daysAgo = 30) {
        const result = await this.dbAsync.run(
            `DELETE FROM custom_reminders 
             WHERE is_completed = 1 
             AND date(completed_at) <= date('now', '-' || ? || ' days')`,
            [daysAgo]
        );
        return result.changes;
    }

    /**
     * 数据库行转换为提醒对象
     */
    _rowToReminder(row) {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            reminderDate: row.reminder_date,
            reminderTime: row.reminder_time,
            isRecurring: Boolean(row.is_recurring),
            recurrencePattern: row.recurrence_pattern ? JSON.parse(row.recurrence_pattern) : null,
            isCompleted: Boolean(row.is_completed),
            completedAt: row.completed_at,
            category: row.category,
            priority: row.priority,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    /**
     * 同步创建（用于迁移脚本）
     */
    createSync(reminder) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO custom_reminders (
                    id, title, description, reminder_date, reminder_time,
                    is_recurring, recurrence_pattern, is_completed, completed_at,
                    category, priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reminder.id,
                    reminder.title,
                    reminder.description || '',
                    reminder.reminderDate,
                    reminder.reminderTime || null,
                    reminder.isRecurring ? 1 : 0,
                    reminder.recurrencePattern ? JSON.stringify(reminder.recurrencePattern) : null,
                    reminder.isCompleted ? 1 : 0,
                    reminder.completedAt || null,
                    reminder.category || '',
                    reminder.priority || 'medium'
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}
