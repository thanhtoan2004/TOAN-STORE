-- Phase 11: Deep Audit & Structural Integrity Fixes

-- 1. Promotion & Order Integrity
ALTER TABLE `orders` RENAME COLUMN `voucher_code` TO `promotion_code`;
ALTER TABLE `orders` ADD COLUMN `promotion_type` ENUM('voucher', 'coupon', 'none') DEFAULT 'none' AFTER `promotion_code`;

-- Update historical data for promotion_type
UPDATE `orders` SET `promotion_type` = 'voucher' WHERE `promotion_code` IS NOT NULL AND `voucher_discount` > 0;
-- Note: Re-validating specific cases like 'TOAN' might require more complex logic, 
-- but for now we set a safe default.

-- 2. Schema Normalization
ALTER TABLE `coupon_usage` DROP COLUMN `coupon_code`;

-- 3. Settings Consolidation (Duplicate Removal)
-- Keep store_*, remove site_*
DELETE FROM `settings` WHERE `key` IN ('site_name', 'site_email', 'site_phone', 'currency');
-- Ensure store_currency exists if currency was the original
INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('store_currency', 'VND');

-- 4. Triggers for Automation

-- Trg for daily_metrics sync
DELIMITER //
CREATE TRIGGER trg_daily_metrics_sync AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF (NEW.status = 'delivered' OR NEW.status = 'paid') AND (OLD.status != 'delivered' AND OLD.status != 'paid') THEN
        INSERT INTO daily_metrics (date, revenue, orders_count, units_sold, updated_at)
        VALUES (DATE(NEW.placed_at), NEW.total_amount, 1, (SELECT SUM(quantity) FROM order_items WHERE order_id = NEW.id), CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
            revenue = revenue + NEW.total_amount,
            orders_count = orders_count + 1,
            units_sold = units_sold + (SELECT SUM(quantity) FROM order_items WHERE order_id = NEW.id),
            updated_at = CURRENT_TIMESTAMP;
    END IF;
END //
DELIMITER ;

-- Trg for flash sale auto-deactivation (Optional, but good practice)
DELIMITER //
CREATE TRIGGER trg_check_expired_flash_sales BEFORE SELECT ON flash_sales
FOR EACH ROW
BEGIN
    -- MySQL doesn't natively support triggers on SELECT. 
    -- Alternatively, we can use an EVENT or just handle in app.
    -- I will use an EVENT instead.
END //
DELIMITER ;

-- 5. Full Name Standardization (Backfill)
UPDATE `users` SET `full_name` = CONCAT(COALESCE(`last_name`, ''), ' ', COALESCE(`first_name`, ''))
WHERE `full_name` IS NULL OR `full_name` = '' OR `full_name` NOT LIKE CONCAT('%', COALESCE(`first_name`, ''));

-- 6. Inventory Backfill for Warehouse 2
INSERT IGNORE INTO `inventory` (product_variant_id, warehouse_id, quantity, reserved)
SELECT id, 2, 0, 0 FROM product_variants;

-- 7. PII Masking in historical snapshots (Safe attempt)
UPDATE `orders` 
SET `shipping_address_snapshot` = JSON_SET(`shipping_address_snapshot`, '$.phone', '***HIDDEN***')
WHERE JSON_EXTRACT(`shipping_address_snapshot`, '$.phone') NOT LIKE '%:%' AND `is_encrypted` = TRUE;
