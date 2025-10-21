-- Sample data for testing the personal dashboard
-- Run this after creating the schema

-- Insert a test user (password is 'password123' hashed with SHA-256)
-- SHA-256 hash of 'password123' = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
-- You should change this after setup or just use the registration page!
INSERT INTO users (name, email, password_hash, created_at, last_login) 
VALUES (
    'Test User',
    'test@example.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    datetime('now'),
    datetime('now')
);

-- Insert some sample personal data
INSERT INTO personal_data (user_id, title, description, category, content, status, created_at, updated_at)
VALUES
    (1, 'Sample Record 1', 'This is a sample record', 'General', 'Sample content here', 'active', datetime('now'), datetime('now')),
    (1, 'Important Note', 'Remember to check this later', 'Notes', 'Detailed information...', 'active', datetime('now'), datetime('now')),
    (1, 'Project Idea', 'New web app concept', 'Projects', 'Build a dashboard for...', 'active', datetime('now'), datetime('now')),
    (1, 'Meeting Notes', 'Discussion points from meeting', 'Work', 'Discussed the following...', 'active', datetime('now'), datetime('now')),
    (1, 'Archived Item', 'Old record for reference', 'Archive', 'Historical data...', 'inactive', datetime('now', '-30 days'), datetime('now', '-30 days'));

-- Verify the data was inserted
SELECT 'Users created:' as info, COUNT(*) as count FROM users;
SELECT 'Personal data records created:' as info, COUNT(*) as count FROM personal_data;
