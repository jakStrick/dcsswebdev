-- Migration: Add data column to misc_expenses table for storing detailed expense entries

-- Add data column to store JSON with entries and comments
ALTER TABLE misc_expenses ADD COLUMN data TEXT;
