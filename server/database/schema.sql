-- ==========================================
-- NavLink Database Schema (SQLite)
-- ==========================================

-- ==========================================
-- 1. Site Configuration (站点配置)
-- ==========================================
CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- 只允许一条记录
    config_data TEXT NOT NULL,              -- JSON 格式存储完整配置
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Subscriptions (订阅管理)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,
    custom_type TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,            -- SQLite 使用 INTEGER 表示 BOOLEAN
    auto_renew INTEGER DEFAULT 0,
    start_date TEXT NOT NULL,               -- ISO 8601 格式: YYYY-MM-DD
    expiry_date TEXT NOT NULL,
    period_value INTEGER NOT NULL,
    period_unit TEXT NOT NULL CHECK(period_unit IN ('day', 'month', 'year')),
    reminder_value INTEGER NOT NULL,
    reminder_unit TEXT NOT NULL CHECK(reminder_unit IN ('day', 'hour')),
    use_lunar INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    currency TEXT DEFAULT 'CNY',
    currency_symbol TEXT DEFAULT '¥',
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active);

-- ==========================================
-- 3. Custom Reminders (自定义提醒)
-- ==========================================
CREATE TABLE IF NOT EXISTS custom_reminders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    reminder_date TEXT NOT NULL,            -- ISO 8601: YYYY-MM-DD
    reminder_time TEXT,                     -- HH:MM
    is_recurring INTEGER DEFAULT 0,
    recurrence_pattern TEXT,                -- JSON: {type: 'daily/weekly/monthly', interval: 1}
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    category TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_reminders_date ON custom_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON custom_reminders(is_completed);

-- ==========================================
-- 4. Notification Settings (通知设置)
-- ==========================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- 只允许一条记录
    settings_data TEXT NOT NULL,            -- JSON 格式
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. App Management (应用管理)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_management (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- 只允许一条记录
    config_data TEXT NOT NULL,              -- JSON 格式
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 触发器：自动更新 updated_at
-- ==========================================
CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
AFTER UPDATE ON subscriptions
BEGIN
    UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_reminders_timestamp 
AFTER UPDATE ON custom_reminders
BEGIN
    UPDATE custom_reminders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_site_config_timestamp 
AFTER UPDATE ON site_config
BEGIN
    UPDATE site_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_notification_settings_timestamp 
AFTER UPDATE ON notification_settings
BEGIN
    UPDATE notification_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_app_management_timestamp 
AFTER UPDATE ON app_management
BEGIN
    UPDATE app_management SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
