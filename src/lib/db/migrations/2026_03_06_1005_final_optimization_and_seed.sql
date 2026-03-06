-- Final Phases: Optimization, Seeding & Points Logic Cleanup (REFINED)

-- 1. Helper Procedure for Safe Index Creation
DROP PROCEDURE IF EXISTS CreateIndexSafe;
DELIMITER //
CREATE PROCEDURE CreateIndexSafe(
    IN tbl_name VARCHAR(64),
    IN idx_name VARCHAR(64),
    IN idx_cols VARCHAR(255)
)
BEGIN
    DECLARE idx_check INT;
    
    -- Check if index already exists
    SELECT COUNT(*) INTO idx_check 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = tbl_name 
    AND INDEX_NAME = idx_name;

    IF idx_check = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl_name, ' (', idx_cols, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 2. Performance Indexes
CALL CreateIndexSafe('orders', 'idx_orders_voucher_code', 'voucher_code');
CALL CreateIndexSafe('orders', 'idx_orders_payment_method', 'payment_method');
CALL CreateIndexSafe('shipments', 'idx_shipments_status', 'status');
CALL CreateIndexSafe('gift_cards', 'idx_gift_cards_status', 'status');
CALL CreateIndexSafe('news', 'idx_news_published', 'is_published');
CALL CreateIndexSafe('news', 'idx_news_published_at', 'published_at');
CALL CreateIndexSafe('user_addresses', 'idx_user_addr_default', 'user_id, is_default');
CALL CreateIndexSafe('product_images', 'idx_product_images_main', 'product_id, is_main');
CALL CreateIndexSafe('point_transactions', 'idx_pt_user_time', 'user_id, created_at DESC');
CALL CreateIndexSafe('coupon_usage', 'idx_coupon_usage_check', 'user_id, coupon_id');
CALL CreateIndexSafe('transactions', 'idx_transactions_order_status', 'order_id, status');
CALL CreateIndexSafe('security_logs', 'idx_security_event_time', 'event_type, created_at DESC');
CALL CreateIndexSafe('coupons', 'idx_coupons_active', 'deleted_at, ends_at');
CALL CreateIndexSafe('inventory_logs', 'idx_inventory_logs_time', 'inventory_id, created_at DESC');

-- Cleanup helper procedure
DROP PROCEDURE IF EXISTS CreateIndexSafe;

-- 3. Points Logic Cleanup (Merge spend -> redeem)
-- Use a safer update
UPDATE point_transactions SET type = 'redeem' WHERE type = 'spend';
ALTER TABLE point_transactions 
    MODIFY COLUMN type ENUM('earn','redeem','expire','refund','adjust') NOT NULL;

-- 4. Data Seeding: Product Colors (Refined with color_name, color_code and existing product_ids)
-- Seeding for Product 1 (Nike Air Max 270)
INSERT IGNORE INTO `product_colors` (product_id, color_name, color_code) VALUES 
(1, 'Black', '#000000'),
(1, 'White', '#FFFFFF');

-- Seeding for Product 2 (Nike Air Force 1)
INSERT IGNORE INTO `product_colors` (product_id, color_name, color_code) VALUES 
(2, 'White', '#FFFFFF'),
(2, 'Triple White', '#FFFFFF');

-- 5. Data Logic: Map existing variants to "Black" if SKU contains BLK (example pattern for Product 1)
UPDATE product_variants 
SET color_id = (SELECT id FROM product_colors WHERE product_id = 1 AND color_name = 'Black' LIMIT 1)
WHERE product_id = 1 AND (sku LIKE '%BLK%' OR sku LIKE '%BLACK%') AND color_id IS NULL;

UPDATE product_variants 
SET color_id = (SELECT id FROM product_colors WHERE product_id = 1 AND color_name = 'White' LIMIT 1)
WHERE product_id = 1 AND (sku LIKE '%WHT%' OR sku LIKE '%WHITE%') AND color_id IS NULL;
