-- Add bills table for custom user bills
CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    balance REAL DEFAULT 0,
    due_day INTEGER NOT NULL,
    ach INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    priority INTEGER NOT NULL,
    adjustable INTEGER DEFAULT 0,
    deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_user_deleted ON bills(user_id, deleted);
