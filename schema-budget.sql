-- Budget App Database Schema for Cloudflare D1

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- Bill adjustments table
CREATE TABLE IF NOT EXISTS bill_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    bill_name TEXT NOT NULL,
    amount REAL NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bill_name)
);

-- Payment statuses table
CREATE TABLE IF NOT EXISTS payment_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    bill_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('NP', 'PNC', 'PCL')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year, month, bill_name)
);

-- Misc expenses table
CREATE TABLE IF NOT EXISTS misc_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    paycheck_index INTEGER NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year, month, paycheck_index)
);

-- Surplus savings table
CREATE TABLE IF NOT EXISTS surplus_savings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings ON user_settings(user_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_bill_adjustments ON bill_adjustments(user_id, bill_name);
CREATE INDEX IF NOT EXISTS idx_payment_statuses ON payment_statuses(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_misc_expenses ON misc_expenses(user_id, year, month);
