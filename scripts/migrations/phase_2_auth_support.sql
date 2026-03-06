-- Phase 2: Auth & Support fixes

-- 1. Support Chat Assignment (Point 5)
-- Correct the FK to point to admin_users instead of users
ALTER TABLE `support_chats` DROP FOREIGN KEY `support_chats_ibfk_2`;
ALTER TABLE `support_chats` ADD CONSTRAINT `support_chats_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL;

-- 2. Unified Admin Authorization (Point 1)
-- Remove the legacy role ENUM
ALTER TABLE `admin_users` DROP COLUMN `role`;
