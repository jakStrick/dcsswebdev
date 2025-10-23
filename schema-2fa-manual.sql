-- Schema updates for SMS-based Two-Factor Authentication
-- Run this to add 2FA support to your existing database
-- Execute these commands ONE AT A TIME in Cloudflare Dashboard Console

-- Add 2FA fields to users table
ALTER TABLE users ADD COLUMN phone_number TEXT;

ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;

ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;

ALTER TABLE users ADD COLUMN backup_codes TEXT;

-- Create verification codes table for SMS codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Create trusted devices table (for "Remember this device")
CREATE TABLE IF NOT EXISTS trusted_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    trusted_until TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for trusted devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
