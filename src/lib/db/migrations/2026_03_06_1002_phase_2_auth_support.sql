-- Phase 2: Auth & Support fixes

-- 1. Support Chat Assignment (Point 5)
-- We need conditional logic to drop FK only if it exists
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'support_chats' AND CONSTRAINT_NAME = 'support_chats_ibfk_2' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `support_chats` DROP FOREIGN KEY `support_chats_ibfk_2`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `support_chats` ADD CONSTRAINT `support_chats_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL;

-- 2. Unified Admin Authorization (Point 1)
-- Remove the legacy role ENUM conditionally
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'role' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `admin_users` DROP COLUMN `role`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

