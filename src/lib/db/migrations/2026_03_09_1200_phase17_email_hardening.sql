-- =============================================================================
-- Migration: Phase 17 — Email Hardening (Blind Index & Full Masking)
-- Generated: 2026-03-09
-- Objectives:
--   [1] Add email_hash for secure searchable masking.
--   [2] Shift UNIQUE constraint from email to email_hash.
--   [3] Prepare for full *** masking of the email column.
-- =============================================================================

USE toan_store;

-- 1. Add email_hash column if not exists
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE users ADD COLUMN email_hash VARCHAR(64) DEFAULT NULL AFTER email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Create index on email_hash
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='users' AND INDEX_NAME='idx_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE UNIQUE INDEX idx_email_hash ON users (email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Drop the old unique constraint on email
-- Note: In MySQL, the unique constraint usually has the same name as the column or was created as 'email'
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='users' AND CONSTRAINT_NAME='email' AND CONSTRAINT_TYPE='UNIQUE' AND TABLE_SCHEMA=DATABASE()) > 0,
    'ALTER TABLE users DROP INDEX email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Create a non-unique index on email for legacy/display purposes (optional but helpful)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='users' AND INDEX_NAME='idx_email_masked' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE INDEX idx_email_masked ON users (email)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Repeat for admin_users (consistency)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='admin_users' AND COLUMN_NAME='email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE admin_users ADD COLUMN email_hash VARCHAR(64) DEFAULT NULL AFTER email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop the old unique constraint on admin email
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='admin_users' AND CONSTRAINT_NAME='email' AND CONSTRAINT_TYPE='UNIQUE' AND TABLE_SCHEMA=DATABASE()) > 0,
    'ALTER TABLE admin_users DROP INDEX email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='admin_users' AND INDEX_NAME='idx_admin_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE UNIQUE INDEX idx_admin_email_hash ON admin_users (email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Add encryption columns to admin_users
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='admin_users' AND COLUMN_NAME='email_encrypted' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE admin_users ADD COLUMN email_encrypted TEXT AFTER email_hash',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='admin_users' AND COLUMN_NAME='is_encrypted' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE admin_users ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0 AFTER email_encrypted',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. Add guest_email_hash to support_chats
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='support_chats' AND COLUMN_NAME='guest_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE support_chats ADD COLUMN guest_email_hash VARCHAR(64) DEFAULT NULL AFTER guest_email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='support_chats' AND INDEX_NAME='idx_guest_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE INDEX idx_guest_email_hash ON support_chats (guest_email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8. Add phone, email, and email_hash to orders
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='phone' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE orders ADD COLUMN phone VARCHAR(20) DEFAULT "***" AFTER is_encrypted',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='email' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE orders ADD COLUMN email VARCHAR(255) DEFAULT "***" AFTER phone',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE orders ADD COLUMN email_hash VARCHAR(64) DEFAULT NULL AFTER email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='orders' AND INDEX_NAME='idx_order_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE INDEX idx_order_email_hash ON orders (email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9. Add email_hash to newsletter_subscriptions
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='newsletter_subscriptions' AND COLUMN_NAME='email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE newsletter_subscriptions ADD COLUMN email_hash VARCHAR(64) DEFAULT NULL AFTER email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop unique index on email for newsletter
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='newsletter_subscriptions' AND INDEX_NAME='email' AND TABLE_SCHEMA=DATABASE()) > 0,
    'ALTER TABLE newsletter_subscriptions DROP INDEX email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='newsletter_subscriptions' AND INDEX_NAME='idx_news_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE UNIQUE INDEX idx_news_email_hash ON newsletter_subscriptions (email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 10. Add email_hash to password_resets
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='password_resets' AND COLUMN_NAME='email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'ALTER TABLE password_resets ADD COLUMN email_hash VARCHAR(64) DEFAULT NULL AFTER email',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='password_resets' AND INDEX_NAME='idx_reset_email_hash' AND TABLE_SCHEMA=DATABASE()) = 0,
    'CREATE INDEX idx_reset_email_hash ON password_resets (email_hash)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
