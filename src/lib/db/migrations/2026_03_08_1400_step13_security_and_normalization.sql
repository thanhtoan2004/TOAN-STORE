-- =============================================================================
-- Migration: 2026_03_08_1400_step13_security_and_normalization.sql
-- Phase 9: Security Hardening, Constraints, and Normalization
-- =============================================================================

SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- 1. SECURITY: Disable manager placeholder account (Re-enforce)
--    Đảm bảo account manager dùng password giả lập không thể truy cập.
UPDATE `admin_users` 
SET `is_active` = 0, 
    `password` = '$DISABLED$' 
WHERE `username` = 'manager' OR `email` = 'manager@toanstore.com';

-- 2. SECURITY: Email PII Encryption (Double Column Strategy)
--    Thêm cột email_encrypted để lưu AES-256-GCM
ALTER TABLE `users` 
ADD COLUMN `email_encrypted` VARCHAR(512) DEFAULT NULL AFTER `email`,
ADD COLUMN `is_encrypted` TINYINT(1) DEFAULT 0 AFTER `email_encrypted`;

-- 3. INTEGRITY: Missing Foreign Keys
--    admin_users -> roles
ALTER TABLE `admin_users` 
ADD CONSTRAINT `fk_admin_users_role` 
FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL;

--    inventory_transfers -> warehouses & variants
--    Lưu ý: Cần kiểm tra hộ dọn dẹp dữ liệu rác nếu có trước khi add FK (thường truncate bảng transfer nếu là dev/staging)
ALTER TABLE `inventory_transfers`
ADD CONSTRAINT `fk_transfers_from_warehouse` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`),
ADD CONSTRAINT `fk_transfers_to_warehouse` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`),
ADD CONSTRAINT `fk_transfers_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`);

-- 4. NORMALIZATION: stock_reservations
--    Chuyển đổi từ JSON items sang bảng quan hệ 1-N.
CREATE TABLE IF NOT EXISTS `stock_reservation_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reservation_id` BIGINT UNSIGNED NOT NULL,
  `product_variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservation_id` (`reservation_id`),
  KEY `idx_variant_id` (`product_variant_id`),
  CONSTRAINT `fk_res_items_parent` FOREIGN KEY (`reservation_id`) REFERENCES `stock_reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. SCHEMA REFINEMENT: Updated_at & Gender
--    coupons updated_at
ALTER TABLE `coupons` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

--    products gender (match documentation)
ALTER TABLE `products` ADD COLUMN `gender` ENUM('men', 'women', 'kids', 'unisex') DEFAULT 'unisex' AFTER `name`;

-- 6. OPTIMIZATION: Drop Redundant Indexes
--    UNIQUE KEY already indexes the column.
ALTER TABLE `admin_users` DROP INDEX `idx_username`, DROP INDEX `idx_email`;

-- =============================================================================
-- End of Migration
-- =============================================================================
