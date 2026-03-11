-- =============================================================================
-- Migration: 2026_03_08_2300_step17_final_hardening.sql (FIXED)
-- Phase 12: Final Deep Audit & Refinement
-- =============================================================================

SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Schema Hardening & Cleanup
-- ────────────────────────────────────────────────────────────────────────────

-- Fix Users Phone type and Point Guard
ALTER TABLE users 
    MODIFY phone VARCHAR(50);

ALTER TABLE users
    ADD CONSTRAINT chk_available_points_non_negative CHECK (available_points >= 0);

-- Add missing membership_discount and priority for warehouses
-- Note: Using standard ADD if it doesn't exist, wrapped in try/catch in script or just plain SQL.
ALTER TABLE orders ADD COLUMN membership_discount decimal(12,2) DEFAULT '0.00' AFTER giftcard_discount;
ALTER TABLE warehouses ADD COLUMN priority INT DEFAULT 0;

-- Drop redundant PII/Contact columns in orders
ALTER TABLE orders 
  DROP COLUMN shipping_phone_enc,
  DROP COLUMN shipping_address_enc,
  DROP COLUMN contact_phone_enc,
  DROP COLUMN contact_email_enc;

-- Drop incorrect Voucher FK
ALTER TABLE orders DROP FOREIGN KEY fk_orders_voucher;

-- Add missing index for cancelled orders tracking
ALTER TABLE orders ADD INDEX idx_orders_cancelled_at (cancelled_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Data Integrity Fixes & Reconciliation
-- ────────────────────────────────────────────────────────────────────────────

-- Fix Product 7 (Nike Mercurial) - missing colors and attributes
INSERT IGNORE INTO product_colors (id, product_id, color_name, color_code, position)
VALUES (9, 7, 'Volt/Black', '#CEFF00', 0);

UPDATE product_variants 
SET color_id = 9, 
    attributes = '{"sole": "FG", "material": "Flyknit", "speed_type": "Vapor"}' 
WHERE product_id = 7 AND (color_id IS NULL OR color_id = 0);

-- Backfill gift_cards.purchased_by
UPDATE gift_cards SET purchased_by = 1 WHERE purchased_by IS NULL;

-- Reconcile Gift Card 13 Usage
UPDATE gift_cards 
SET status = 'used', current_balance = 0.00 
WHERE id = 13 AND EXISTS (SELECT 1 FROM orders WHERE giftcard_id = 13);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Advanced Automation (Triggers)
-- ────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_update_price_cache_insert;
CREATE TRIGGER trg_update_price_cache_insert AFTER INSERT ON product_variants
FOR EACH ROW
UPDATE products SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id) WHERE id = NEW.product_id;

DROP TRIGGER IF EXISTS trg_update_price_cache_update;
CREATE TRIGGER trg_update_price_cache_update AFTER UPDATE ON product_variants
FOR EACH ROW
UPDATE products SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id) WHERE id = NEW.product_id;

DROP TRIGGER IF EXISTS trg_update_price_cache_delete;
CREATE TRIGGER trg_update_price_cache_delete AFTER DELETE ON product_variants
FOR EACH ROW
UPDATE products SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = OLD.product_id) WHERE id = OLD.product_id;

DROP TRIGGER IF EXISTS trg_orders_sale_count_sync;
CREATE TRIGGER trg_orders_sale_count_sync AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE products p
        JOIN (SELECT product_id, SUM(quantity) as qty FROM order_items WHERE order_id = NEW.id GROUP BY product_id) oi 
        ON p.id = oi.product_id
        SET p.sale_count = p.sale_count + oi.qty;
    END IF;
END;

DROP TRIGGER IF EXISTS trg_daily_metrics_sync;
CREATE TRIGGER trg_daily_metrics_sync AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    DECLARE today DATE;
    DECLARE order_cost DECIMAL(12,2);
    SET today = DATE(NEW.placed_at);
    
    SELECT SUM(cost_price * quantity) INTO order_cost FROM order_items WHERE order_id = NEW.id;

    IF (NEW.status IN ('delivered', 'paid') AND OLD.status NOT IN ('delivered', 'paid')) THEN
        INSERT INTO daily_metrics (date, revenue, orders_count, total_cost, net_profit, updated_at)
        VALUES (today, NEW.total, 1, IFNULL(order_cost, 0), (NEW.total - IFNULL(order_cost, 0)), NOW())
        ON DUPLICATE KEY UPDATE 
            revenue = revenue + NEW.total,
            orders_count = orders_count + 1,
            total_cost = total_cost + IFNULL(order_cost, 0),
            net_profit = net_profit + (NEW.total - IFNULL(order_cost, 0)),
            updated_at = NOW();
            
        IF (SELECT COUNT(*) FROM orders WHERE user_id = NEW.user_id AND DATE(placed_at) = today AND status IN ('delivered', 'paid')) = 1 THEN
            UPDATE daily_metrics SET customers_count = customers_count + 1 WHERE date = today;
        END IF;

    ELSEIF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        INSERT INTO daily_metrics (date, cancelled_count, updated_at)
        VALUES (today, 1, NOW())
        ON DUPLICATE KEY UPDATE 
            cancelled_count = cancelled_count + 1,
            updated_at = NOW();
    END IF;
END;

DROP TRIGGER IF EXISTS trg_orders_discount_integrity;
CREATE TRIGGER trg_orders_discount_integrity BEFORE UPDATE ON orders
FOR EACH ROW
SET NEW.discount = NEW.voucher_discount + NEW.giftcard_discount + NEW.membership_discount;

DROP TRIGGER IF EXISTS trg_security_logs_cleanup;
CREATE TRIGGER trg_security_logs_cleanup AFTER INSERT ON security_logs
FOR EACH ROW
BEGIN
    INSERT INTO archive_security_logs SELECT * FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END;
