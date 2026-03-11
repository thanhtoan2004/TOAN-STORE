-- =============================================================================
-- Migration: Phase 17 — Deep Logic & Design Hardening
-- Generated: 2026-03-09
-- Target DB: toan_store (MySQL 8.0+)
-- 
-- Objectives:
--   [1] Schema Parity: Add usage limits to vouchers (match coupons).
--   [2] Audit Protection: Prevent loss of audit trail when deleting coupons.
--   [3] Performance: Add composite indexes for reviews.
--   [4] Data Quality: Add value_type to settings.
-- =============================================================================

USE toan_store;

-- [1] Vouchers Parity
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='vouchers' AND COLUMN_NAME='usage_limit' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE vouchers ADD COLUMN usage_limit INT DEFAULT 1 COMMENT ''0 = unlimited''', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='vouchers' AND COLUMN_NAME='usage_limit_per_user' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE vouchers ADD COLUMN usage_limit_per_user INT DEFAULT 1', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='vouchers' AND COLUMN_NAME='min_order_value' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE vouchers ADD COLUMN min_order_value DECIMAL(12,2) DEFAULT 0', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- [2] Audit Protection for Coupons
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='coupon_usage_ibfk_1' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE coupon_usage DROP FOREIGN KEY coupon_usage_ibfk_1', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_coupon_usage_coupon' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE coupon_usage ADD CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE RESTRICT', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- [3] Performance Optimization
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='product_reviews' AND INDEX_NAME='idx_reviews_product_deleted' AND TABLE_SCHEMA=DATABASE()) = 0, 'CREATE INDEX idx_reviews_product_deleted ON product_reviews (product_id, deleted_at)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- [4] Settings Data Quality
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='settings' AND COLUMN_NAME='value_type' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE settings ADD COLUMN value_type ENUM(''string'', ''number'', ''boolean'', ''json'') DEFAULT ''string'' AFTER `value`', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill value_type for key settings (idempotent UPDATE)
UPDATE settings SET value_type = 'number' WHERE `key` IN ('tax_rate', 'shipping_cost_domestic', 'shipping_cost_international', 'free_shipping_threshold');
UPDATE settings SET value_type = 'boolean' WHERE `key` IN ('is_maintenance_mode', 'enable_guest_checkout');

-- [5] Verification Query (Comment out in production)
-- SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'usage_limit';
