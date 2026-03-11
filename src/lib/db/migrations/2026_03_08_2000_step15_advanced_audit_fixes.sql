-- =============================================================================
-- Migration: 2026_03_08_2000_step15_advanced_audit_fixes.sql (CORRECTED)
-- Phase 10: Advanced Audit & Data Integrity Fixes
-- =============================================================================

SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Financial Data & Order Integrity
-- ────────────────────────────────────────────────────────────────────────────

-- Fix order_items.cost_price (0 -> 70% of price)
UPDATE order_items 
SET cost_price = ROUND(price * 0.70, 2) 
WHERE cost_price = 0.00;

-- Backfill shipping_address_snapshot for historical orders (3-13)
UPDATE orders 
SET shipping_address_snapshot = JSON_OBJECT(
    'city', 'TP. Hồ Chí Minh',
    'name', 'DANG THANH TOAN (Historical)',
    'ward', '700000',
    'phone', '0900000000',
    'address', 'Hẻm 123, Đường ABC',
    'district', 'Quận 1',
    'address_line', '123 ABC Street, District 1'
)
WHERE id BETWEEN 3 AND 13 AND (shipping_address_snapshot IS NULL OR shipping_address_snapshot = '{}' OR JSON_LENGTH(shipping_address_snapshot) = 0);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Gift Card Reconciliation
-- ────────────────────────────────────────────────────────────────────────────

-- Fix expires_at for seed gift cards (ensure +1 year from created_at)
UPDATE gift_cards 
SET expires_at = DATE_ADD(created_at, INTERVAL 1 YEAR)
WHERE id IN (2,3,4,9,10,11);

-- Reconcile Card ID 13: Its balance was over-spent across 4 orders (9,11,12,13)
UPDATE gift_cards 
SET current_balance = 0.00, status = 'used' 
WHERE id = 13;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Database Automation (Triggers)
-- ────────────────────────────────────────────────────────────────────────────

-- Trigger to sync products.price_cache (min variant price)
DROP TRIGGER IF EXISTS trg_update_price_cache_insert;
CREATE TRIGGER trg_update_price_cache_insert AFTER INSERT ON product_variants
FOR EACH ROW
BEGIN
    UPDATE products 
    SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
END;

DROP TRIGGER IF EXISTS trg_update_price_cache_update;
CREATE TRIGGER trg_update_price_cache_update AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
    UPDATE products 
    SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
END;

-- Trigger to sync user points from transactions
DROP TRIGGER IF EXISTS trg_sync_user_points;
CREATE TRIGGER trg_sync_user_points AFTER INSERT ON point_transactions
FOR EACH ROW
BEGIN
    UPDATE users 
    SET available_points = (
        SELECT COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END), 0)
        FROM point_transactions 
        WHERE user_id = NEW.user_id AND status = 'completed'
    ),
    lifetime_points = (
        SELECT COALESCE(SUM(amount), 0)
        FROM point_transactions 
        WHERE user_id = NEW.user_id AND type = 'earn' AND status = 'completed'
    )
    WHERE id = NEW.user_id;
END;

-- Trigger to enforce flash sale limits
DROP TRIGGER IF EXISTS trg_enforce_flash_sale_limit;
CREATE TRIGGER trg_enforce_flash_sale_limit BEFORE UPDATE ON flash_sale_items
FOR EACH ROW
BEGIN
    IF NEW.quantity_sold > NEW.quantity_limit THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flash sale item quantity_sold exceeds quantity_limit';
    END IF;
END;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Schema & Performance
-- ────────────────────────────────────────────────────────────────────────────

-- Optimize coupon_usage index (Using DROP INDEX/ADD INDEX for compatibility)
ALTER TABLE coupon_usage DROP INDEX IF EXISTS idx_coupon_usage_check;
ALTER TABLE coupon_usage ADD INDEX idx_coupon_usage_per_user (user_id, coupon_id, order_id);

-- Consolidate system_config into settings (Corrected field names: key, value, description)
INSERT INTO settings (`key`, `value`, `description`)
SELECT `key`, `value`, 'System configuration migrated from system_config'
FROM system_config
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

DROP TABLE IF EXISTS system_config;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Data Cleanup
-- ────────────────────────────────────────────────────────────────────────────

-- Fix daily_metrics padding vs real data (Remove rows with 0 meaningful stats)
DELETE FROM daily_metrics 
WHERE revenue = 0.00 AND orders_count = 0 AND date < CURDATE();

-- Realign 2026-03-08 updated_at
UPDATE daily_metrics 
SET updated_at = CURRENT_TIMESTAMP 
WHERE date = '2026-03-08';
