import { getDatabase, promisifyDb } from '../index.js';

export class SubscriptionDAO {
    constructor() {
        this.db = getDatabase();
        this.dbAsync = promisifyDb(this.db);
    }

    /**
     * 获取所有订阅
     */
    async getAll() {
        const rows = await this.dbAsync.all('SELECT * FROM subscriptions ORDER BY expiry_date ASC');
        return rows.map(this._rowToSubscription);
    }

    /**
     * 根据ID获取订阅
     */
    async getById(id) {
        const row = await this.dbAsync.get('SELECT * FROM subscriptions WHERE id = ?', [id]);
        return row ? this._rowToSubscription(row) : null;
    }

    /**
     * 创建订阅
     */
    async create(subscription) {
        const result = await this.dbAsync.run(
            `INSERT INTO subscriptions (
                id, name, custom_type, category, notes, is_active, auto_renew,
                start_date, expiry_date, period_value, period_unit,
                reminder_value, reminder_unit, use_lunar, price, currency, currency_symbol, icon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                subscription.id,
                subscription.name,
                subscription.customType,
                subscription.category,
                subscription.notes || '',
                subscription.isActive ? 1 : 0,
                subscription.autoRenew ? 1 : 0,
                subscription.startDate,
                subscription.expiryDate,
                subscription.periodValue,
                subscription.periodUnit,
                subscription.reminderValue,
                subscription.reminderUnit,
                subscription.useLunar ? 1 : 0,
                subscription.price,
                subscription.currency || 'CNY',
                subscription.currencySymbol || '¥',
                subscription.icon || null
            ]
        );

        return result.changes > 0 ? await this.getById(subscription.id) : null;
    }

    /**
     * 更新订阅
     */
    async update(id, subscription) {
        const result = await this.dbAsync.run(
            `UPDATE subscriptions SET
                name = ?, custom_type = ?, category = ?, notes = ?,
                is_active = ?, auto_renew = ?, start_date = ?, expiry_date = ?,
                period_value = ?, period_unit = ?, reminder_value = ?, reminder_unit = ?,
                use_lunar = ?, price = ?, currency = ?, currency_symbol = ?, icon = ?
            WHERE id = ?`,
            [
                subscription.name,
                subscription.customType,
                subscription.category,
                subscription.notes || '',
                subscription.isActive ? 1 : 0,
                subscription.autoRenew ? 1 : 0,
                subscription.startDate,
                subscription.expiryDate,
                subscription.periodValue,
                subscription.periodUnit,
                subscription.reminderValue,
                subscription.reminderUnit,
                subscription.useLunar ? 1 : 0,
                subscription.price,
                subscription.currency || 'CNY',
                subscription.currencySymbol || '¥',
                subscription.icon || null,
                id
            ]
        );

        return result.changes > 0 ? await this.getById(id) : null;
    }

    /**
     * 删除订阅
     */
    async delete(id) {
        const result = await this.dbAsync.run('DELETE FROM subscriptions WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * 按分类查询
     */
    async getByCategory(category) {
        const rows = await this.dbAsync.all(
            'SELECT * FROM subscriptions WHERE category LIKE ? ORDER BY expiry_date ASC',
            [`%${category}%`]
        );
        return rows.map(this._rowToSubscription);
    }

    /**
     * 查询即将到期的订阅
     */
    async getExpiringSoon(days = 30) {
        const rows = await this.dbAsync.all(
            `SELECT * FROM subscriptions 
             WHERE is_active = 1 
             AND date(expiry_date) <= date('now', '+' || ? || ' days')
             ORDER BY expiry_date ASC`,
            [days]
        );
        return rows.map(this._rowToSubscription);
    }

    /**
     * 数据库行转换为订阅对象
     */
    _rowToSubscription(row) {
        return {
            id: row.id,
            name: row.name,
            customType: row.custom_type,
            category: row.category,
            notes: row.notes,
            isActive: Boolean(row.is_active),
            autoRenew: Boolean(row.auto_renew),
            startDate: row.start_date,
            expiryDate: row.expiry_date,
            periodValue: row.period_value,
            periodUnit: row.period_unit,
            reminderValue: row.reminder_value,
            reminderUnit: row.reminder_unit,
            useLunar: Boolean(row.use_lunar),
            price: row.price,
            currency: row.currency,
            currencySymbol: row.currency_symbol,
            icon: row.icon,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    /**
     * 同步创建（用于迁移脚本）
     */
    createSync(subscription) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO subscriptions (
                    id, name, custom_type, category, notes, is_active, auto_renew,
                    start_date, expiry_date, period_value, period_unit,
                    reminder_value, reminder_unit, use_lunar, price, currency, currency_symbol, icon
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    subscription.id,
                    subscription.name,
                    subscription.customType,
                    subscription.category,
                    subscription.notes || '',
                    subscription.isActive ? 1 : 0,
                    subscription.autoRenew ? 1 : 0,
                    subscription.startDate,
                    subscription.expiryDate,
                    subscription.periodValue,
                    subscription.periodUnit,
                    subscription.reminderValue,
                    subscription.reminderUnit,
                    subscription.useLunar ? 1 : 0,
                    subscription.price,
                    subscription.currency || 'CNY',
                    subscription.currencySymbol || '¥',
                    subscription.icon || null
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }
}
