-- Step 6: Deep Cleanup & Data Integrity Fixes (Phase 5)
-- Objective: Remove remaining test data, fix zero-priced variants, and ownerless carts.

START TRANSACTION;

-- 1. Remove Test Products and their Orders
-- First, find all orders that contain "Test Product"
CREATE TEMPORARY TABLE tmp_test_orders AS
SELECT DISTINCT order_id FROM order_items WHERE product_name LIKE '%Test %';

-- Delete from child tables first
DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM tmp_test_orders);
DELETE FROM orders WHERE id IN (SELECT order_id FROM tmp_test_orders);

DROP TEMPORARY TABLE tmp_test_orders;

-- 2. Cleanup Ownerless Carts
-- Carts with no user_id AND no session_id (orphaned)
DELETE FROM carts WHERE user_id IS NULL AND session_id IS NULL;

-- 3. Fix Zero-Priced Variants
-- Some variants have price 0.00 while the product has a valid price_cache.
-- We sync the variant price from the product's price_cache if it's currently 0.
UPDATE product_variants pv
JOIN products p ON pv.product_id = p.id
SET pv.price = p.price_cache
WHERE pv.price = 0 AND p.price_cache > 0;

-- 4. Performance: Add Missing Voucher Index
-- Optimize query: SELECT * FROM vouchers WHERE recipient_user_id = ? AND status = 'active'
SET @dbname = DATABASE();
SET @tablename = 'vouchers';
SET @columnname = 'recipient_user_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'CREATE INDEX idx_voucher_recipient ON vouchers(recipient_user_id, status)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification Queries
SELECT 'Test Items Remaining' as label, COUNT(*) as count FROM order_items WHERE product_name LIKE '%Test %'
UNION ALL
SELECT 'Ownerless Carts Remaining' as label, COUNT(*) as count FROM carts WHERE user_id IS NULL AND session_id IS NULL
UNION ALL
SELECT 'Zero-Price Variants Remaining' as label, COUNT(*) as count FROM product_variants WHERE price = 0;

COMMIT;
