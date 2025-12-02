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

-- ==========================================
-- 6. Docker Servers (Docker服务器配置)
-- ==========================================
CREATE TABLE IF NOT EXISTS docker_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    
    -- 连接配置
    connection_type TEXT NOT NULL DEFAULT 'local' CHECK(connection_type IN ('local', 'tcp', 'tls', 'ssh')),
    host TEXT,
    port INTEGER DEFAULT 2375,
    
    -- TLS证书（预留，Base64编码存储）
    ca_cert TEXT,
    client_cert TEXT,
    client_key TEXT,
    
    -- SSH配置
    ssh_user TEXT,
    ssh_password TEXT,
    ssh_private_key TEXT,
    ssh_port INTEGER DEFAULT 22,
    
    -- 状态信息
    status TEXT DEFAULT 'unknown' CHECK(status IN ('online', 'offline', 'unknown', 'error')),
    last_check_time DATETIME,
    last_error TEXT,
    latency INTEGER DEFAULT 0,  -- 延迟（毫秒）
    
    -- 元数据
    is_default INTEGER DEFAULT 0,
    tags TEXT DEFAULT '',  -- 逗号分隔的标签
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_docker_servers_status ON docker_servers(status);
CREATE INDEX IF NOT EXISTS idx_docker_servers_default ON docker_servers(is_default);

-- ==========================================
-- 7. Docker Audit Logs (操作审计日志)
-- ==========================================
CREATE TABLE IF NOT EXISTS docker_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    action TEXT NOT NULL,  -- 'connect', 'start_container', 'stop_container', 'delete_image' 等
    resource_type TEXT,    -- 'container', 'image', 'volume', 'network'
    resource_id TEXT,
    resource_name TEXT,
    status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failed')),
    error_message TEXT,
    user_info TEXT,  -- 可选：记录操作用户
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(server_id) REFERENCES docker_servers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_docker_audit_server ON docker_audit_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_docker_audit_action ON docker_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_docker_audit_created ON docker_audit_logs(created_at);

-- ==========================================
-- 触发器：自动更新 docker_servers updated_at
-- ==========================================
CREATE TRIGGER IF NOT EXISTS update_docker_servers_timestamp 
AFTER UPDATE ON docker_servers
BEGIN
    UPDATE docker_servers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- 8. VPS Groups (VPS分组)
-- ==========================================
CREATE TABLE IF NOT EXISTS vps_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. VPS Servers (VPS服务器)
-- ==========================================
CREATE TABLE IF NOT EXISTS vps_servers (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    
    -- 连接信息
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT NOT NULL,
    password TEXT,          -- 加密存储
    private_key TEXT,       -- 加密存储
    auth_type TEXT DEFAULT 'password' CHECK(auth_type IN ('password', 'key')),
    
    -- 状态信息
    status TEXT DEFAULT 'unknown' CHECK(status IN ('online', 'offline', 'unknown', 'error')),
    last_check_time DATETIME,
    latency INTEGER DEFAULT 0,
    
    -- 系统信息 (缓存)
    os_info TEXT,
    cpu_info TEXT,
    mem_info TEXT,
    disk_info TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(group_id) REFERENCES vps_groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vps_servers_group ON vps_servers(group_id);
CREATE INDEX IF NOT EXISTS idx_vps_servers_status ON vps_servers(status);

-- ==========================================
-- 触发器：自动更新 VPS 相关表 updated_at
-- ==========================================
CREATE TRIGGER IF NOT EXISTS update_vps_groups_timestamp 
AFTER UPDATE ON vps_groups
BEGIN
    UPDATE vps_groups SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_vps_servers_timestamp 
AFTER UPDATE ON vps_servers
BEGIN
    UPDATE vps_servers SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- VPS Snippets Table
CREATE TABLE IF NOT EXISTS vps_snippets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_vps_snippets_timestamp 
AFTER UPDATE ON vps_snippets
BEGIN
    UPDATE vps_snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- VPS Snippet Categories Table
CREATE TABLE IF NOT EXISTS vps_snippet_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_vps_snippet_categories_timestamp 
AFTER UPDATE ON vps_snippet_categories
BEGIN
    UPDATE vps_snippet_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
