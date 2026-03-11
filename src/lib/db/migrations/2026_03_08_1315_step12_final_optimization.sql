-- =============================================================================
-- Migration: 2026_03_08_1315_step12_final_optimization.sql
-- Phase 8: Final Database Optimization & Security Fixes
-- =============================================================================
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

START TRANSACTION;

-- 1. INDEX OPTIMIZATION — Xóa index trùng lặp trên bảng `inventory`
ALTER TABLE `inventory` DROP INDEX `idx_variant_warehouse`;

-- 2. SCHEMA REFINEMENT — Thêm `cancelled_at` vào bảng `orders`
ALTER TABLE `orders`
  ADD COLUMN `cancelled_at` TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Timestamp khi đơn hàng bị hủy (status → cancelled)'
  AFTER `payment_confirmed_at`;

UPDATE `orders` SET `cancelled_at` = `updated_at` WHERE `status` = 'cancelled' AND `cancelled_at` IS NULL;

-- 3. SCHEMA REFINEMENT — Thêm `deleted_at` vào bảng `admin_users`
ALTER TABLE `admin_users`
  ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Soft delete timestamp — NULL = active, NOT NULL = deleted'
  AFTER `updated_at`;

CREATE INDEX `idx_admin_deleted_at` ON `admin_users` (`deleted_at`);

-- 4. DROP OBSOLETE TABLE — Xóa `rate_limit_attempts`
DROP TABLE IF EXISTS `rate_limit_attempts`;

-- 5. SECURITY FIX — Vô hiệu hóa tài khoản `manager` (ID 2)
UPDATE `admin_users`
SET `is_active` = 0, `updated_at` = NOW()
WHERE `id` = 2 AND `email` = 'manager@toanstore.com';

COMMIT;
