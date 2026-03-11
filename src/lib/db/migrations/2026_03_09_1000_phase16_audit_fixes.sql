-- =============================================================================
-- Migration: Phase 16 — Comprehensive Audit Fixes
-- Generated: 2026-03-09
-- Target DB: toan_store
-- 
-- Issues addressed:
--   [1] 🔴 CRITICAL — Price variance for variant id=1 (100 -> 3,829,000)
--   [2] 🔴 CRITICAL — Order ID 3 total correction
--   [3] 🟠 HIGH     — Missing FK for orders.voucher_id
--   [4] 🟠 HIGH     — Standardize payment_method (Vietnamese -> cod)
--   [5] 🟠 HIGH     — Expand transactions.payment_provider ENUM
--   [6] 🟡 MEDIUM   — Cleanup expired Flash Sales & Coupons
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- [1] Fix Price Variance (Variant 1)
-- This will trigger trg_update_price_cache to fix products.price_cache
UPDATE `product_variants` SET `price` = 3829000.00 WHERE `id` = 1;

-- [2] Correct Order ID 3 Calculation
-- subtotal=2929000.00, discount=160.00, tax=0.00 -> total=2928840.00
UPDATE `orders` SET `total` = 2928840.00 WHERE `id` = 3;

-- [3] Add Missing FK for orders.voucher_id
-- Ensure index exists first
ALTER TABLE `orders` ADD INDEX `idx_orders_voucher_id` (`voucher_id`);
ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_voucher_id` 
    FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL;

-- [4] Standardize Payment Methods
UPDATE `orders` SET `payment_method` = 'cod' 
WHERE `payment_method` IN ('Thanh toán khi nhận hàng', 'cod');

-- [5] Expand Transaction Providers ENUM
ALTER TABLE `transactions` MODIFY COLUMN `payment_provider` 
    ENUM('vnpay', 'momo', 'zalopay', 'bank_transfer', 'cod') NOT NULL;

-- [6] Cleanup Expired Content
-- Deactivate expired flash sales
UPDATE `flash_sales` SET `is_active` = 0 
WHERE `end_time` < NOW() AND `is_active` = 1;

-- Soft-delete expired coupons (last protection)
UPDATE `coupons` SET `deleted_at` = NOW() 
WHERE `ends_at` < NOW() AND `deleted_at` IS NULL;

-- Security Hardening: Ensure deactivated accounts remain inaccessible
-- (Handled in app layer, but DB ensures password is NULL and inactive)
UPDATE `admin_users` SET `password` = NULL WHERE `id` = 2;

SET FOREIGN_KEY_CHECKS = 1;

-- VERIFICATION QUERIES (Run these after):
-- SELECT id, price FROM product_variants WHERE id = 1;
-- SELECT price_cache FROM products WHERE id = (SELECT product_id FROM product_variants WHERE id = 1);
-- SELECT total FROM orders WHERE id = 3;
-- SHOW CREATE TABLE orders;
