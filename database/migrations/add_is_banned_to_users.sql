-- Add is_banned column to users table
-- This allows blocking user accounts from logging in

ALTER TABLE users 
ADD COLUMN is_banned TINYINT(1) DEFAULT 0 COMMENT 'User banned status: 0 = active, 1 = banned';

-- Add index for faster queries
CREATE INDEX idx_is_banned ON users(is_banned);

-- Optional: Update existing banned users (if you know their IDs)
-- UPDATE users SET is_banned = 1 WHERE id IN (2, 3, 4);

-- Check the result
SELECT id, email, full_name, is_admin, is_banned FROM users LIMIT 10;
