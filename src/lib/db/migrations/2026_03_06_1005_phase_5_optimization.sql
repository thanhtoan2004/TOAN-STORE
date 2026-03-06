-- Phase 5: Performance & Indexing (Idempotent)

-- Helper Procedure for Index Check and Creation
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateIndexIfNotExists(
    IN tbl_name VARCHAR(64),
    IN idx_name VARCHAR(64),
    IN idx_cols VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tbl_name
        AND INDEX_NAME = idx_name
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl_name, ' (', idx_cols, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 1. Single-Column Indexes
CALL CreateIndexIfNotExists('orders', 'idx_orders_voucher_code', 'voucher_code');
CALL CreateIndexIfNotExists('orders', 'idx_orders_payment_method', 'payment_method');
CALL CreateIndexIfNotExists('shipments', 'idx_shipments_status', 'status');
CALL CreateIndexIfNotExists('gift_cards', 'idx_gift_cards_status', 'status');
CALL CreateIndexIfNotExists('news', 'idx_news_active', 'is_active');
CALL CreateIndexIfNotExists('news', 'idx_news_published_at', 'published_at');

-- User Addresses: (user_id, is_default)
CALL CreateIndexIfNotExists('user_addresses', 'idx_user_addr_default', 'user_id, is_default');

-- Product Images: (product_id, is_main)
CALL CreateIndexIfNotExists('product_images', 'idx_product_images_main', 'product_id, is_main');

-- 2. Composite Indexes
-- Loyalty History: (user_id, created_at DESC)
CALL CreateIndexIfNotExists('point_transactions', 'idx_pt_user_time', 'user_id, created_at DESC');

-- Coupon usage check: (user_id, coupon_id)
CALL CreateIndexIfNotExists('coupon_usage', 'idx_coupon_usage_check', 'user_id, coupon_id');

-- IPN callback lookup: (order_id, status)
CALL CreateIndexIfNotExists('transactions', 'idx_transactions_order_status', 'order_id, status');

-- Security logs: (event_type, created_at DESC)
CALL CreateIndexIfNotExists('security_logs', 'idx_security_event_time', 'event_type, created_at DESC');

-- Coupons active query: (deleted_at, ends_at)
CALL CreateIndexIfNotExists('coupons', 'idx_coupons_active', 'deleted_at, ends_at');

-- Inventory logs by item: (inventory_id, created_at DESC)
CALL CreateIndexIfNotExists('inventory_logs', 'idx_inventory_logs_time', 'inventory_id, created_at DESC');

-- Cleanup: Drop the helper procedure
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
