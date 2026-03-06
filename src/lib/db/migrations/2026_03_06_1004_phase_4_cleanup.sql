-- Phase 4: Schema Correctness & Cleanup

-- 1. Fix FK ON DELETE behavior for transactions
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'transactions' AND CONSTRAINT_NAME = 'transactions_ibfk_1' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_ibfk_1`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'transactions' AND CONSTRAINT_NAME = 'transactions_ibfk_2' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_ibfk_2`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `transactions` MODIFY COLUMN `user_id` BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 2. Fix FK ON DELETE behavior for refund_requests
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'refund_requests' AND CONSTRAINT_NAME = 'refund_requests_ibfk_1' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `refund_requests` DROP FOREIGN KEY `refund_requests_ibfk_1`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'refund_requests' AND CONSTRAINT_NAME = 'refund_requests_ibfk_2' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE `refund_requests` DROP FOREIGN KEY `refund_requests_ibfk_2`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `refund_requests` MODIFY COLUMN `user_id` BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT;
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 3. Cleanup Index Duplicate and Bug on product_variants
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'product_variants' AND INDEX_NAME = 'idx_sku' AND TABLE_SCHEMA = DATABASE()) > 0,
    'DROP INDEX `idx_sku` ON `product_variants`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'product_variants' AND INDEX_NAME = 'idx_product_color' AND TABLE_SCHEMA = DATABASE()) > 0,
    'DROP INDEX `idx_product_color` ON `product_variants`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE INDEX `idx_product_color` ON `product_variants` (`product_id`, `color_id`);

-- 4. Set status columns to NOT NULL
ALTER TABLE `orders` MODIFY COLUMN `status` ENUM('pending','pending_payment_confirmation','payment_received','confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending';
ALTER TABLE `transactions` MODIFY COLUMN `status` ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending';
ALTER TABLE `shipments` MODIFY COLUMN `status` ENUM('pending','shipped','delivered','returned','cancelled') NOT NULL DEFAULT 'pending';
