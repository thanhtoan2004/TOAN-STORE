-- ============================================================
-- STEP 3: ORDERS & PRICING SCHEMA REFACTOR
-- ============================================================

START TRANSACTION;

-- PART A: ORDERS TABLE — Remove redundant PII columns
-- Drop dependent FKs
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_orders_billing_address' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP FOREIGN KEY fk_orders_billing_address', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_orders_shipping_address' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP FOREIGN KEY fk_orders_shipping_address', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop columns
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='phone' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP COLUMN phone', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='email' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP COLUMN email', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='billing_phone_encrypted' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP COLUMN billing_phone_encrypted', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='billing_address_id' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP COLUMN billing_address_id', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='shipping_address_id' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP COLUMN shipping_address_id', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rename remaining encrypted columns
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='phone_encrypted' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders RENAME COLUMN phone_encrypted TO contact_phone_enc', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='email_encrypted' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders RENAME COLUMN email_encrypted TO contact_email_enc', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='shipping_phone_encrypted' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders RENAME COLUMN shipping_phone_encrypted TO shipping_phone_enc', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='orders' AND COLUMN_NAME='shipping_address_encrypted' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders RENAME COLUMN shipping_address_encrypted TO shipping_address_enc', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- PART B: PRICING
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='base_price' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE products RENAME COLUMN base_price TO price_cache', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='retail_price' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE products RENAME COLUMN retail_price TO msrp_price', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE products
    MODIFY price_cache   DECIMAL(12,2) NOT NULL DEFAULT 0.00
        COMMENT 'Denormalized: MIN(product_variants.price). Updated by app on variant change.',
    MODIFY msrp_price    DECIMAL(12,2) DEFAULT NULL
        COMMENT 'Original retail price for display purposes only. Not used in checkout logic.';

-- PART C: COUPONS vs VOUCHERS
ALTER TABLE coupons MODIFY code VARCHAR(100) NOT NULL COMMENT 'Publicly shareable discount code.';
ALTER TABLE vouchers MODIFY code VARCHAR(100) NOT NULL COMMENT 'One-time personal credit code.';

-- PART D: Clean up excess indexes
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='orders' AND INDEX_NAME='idx_order_number' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP INDEX idx_order_number', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='orders' AND INDEX_NAME='idx_tracking_number' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP INDEX idx_tracking_number', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='orders' AND INDEX_NAME='idx_payment_status_placed' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE orders DROP INDEX idx_payment_status_placed', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;
