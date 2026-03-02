-- ============================================================================
-- PERFORMANCE OPTIMIZATION: MISSING INDEXES (FINAL RECONCILED V2)
-- ============================================================================

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS AddIndexIfNotExist(
    IN p_table_name VARCHAR(255),
    IN p_index_name VARCHAR(255),
    IN p_column_list VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = p_table_name 
        AND index_name = p_index_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD INDEX ', p_index_name, ' (', p_column_list, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Orders Table (Corrected placed_at)
CALL AddIndexIfNotExist('orders', 'idx_user_status_placed', 'user_id, status, placed_at DESC');
CALL AddIndexIfNotExist('orders', 'idx_status_placed', 'status, placed_at DESC');
CALL AddIndexIfNotExist('orders', 'idx_payment_status_placed', 'payment_status, placed_at DESC');
CALL AddIndexIfNotExist('orders', 'idx_tracking_carrier', 'tracking_number, carrier');

-- Order Items (Removed created_at)
CALL AddIndexIfNotExist('order_items', 'idx_product_variant', 'product_id, product_variant_id');
CALL AddIndexIfNotExist('order_items', 'idx_inventory_order', 'inventory_id, order_id');

-- Inventory
CALL AddIndexIfNotExist('inventory', 'idx_warehouse_quantity', 'warehouse_id, quantity');
CALL AddIndexIfNotExist('inventory', 'idx_quantity_reserved', 'quantity, reserved');
CALL AddIndexIfNotExist('inventory', 'idx_variant_warehouse', 'product_variant_id, warehouse_id');

-- Products
CALL AddIndexIfNotExist('products', 'idx_category_active_created', 'category_id, is_active, created_at DESC');
CALL AddIndexIfNotExist('products', 'idx_featured_active', 'is_featured, is_active');
CALL AddIndexIfNotExist('products', 'idx_brand_active', 'brand_id, is_active');
CALL AddIndexIfNotExist('products', 'idx_new_arrival_created', 'is_new_arrival, created_at DESC');

-- Product Variants
CALL AddIndexIfNotExist('product_variants', 'idx_product_size', 'product_id, size');
CALL AddIndexIfNotExist('product_variants', 'idx_product_color', 'product_id, color');
CALL AddIndexIfNotExist('product_variants', 'idx_price', 'price');

-- Reviews
CALL AddIndexIfNotExist('product_reviews', 'idx_product_approved_created', 'product_id, status, created_at DESC');
CALL AddIndexIfNotExist('product_reviews', 'idx_product_rating', 'product_id, rating DESC');
CALL AddIndexIfNotExist('product_reviews', 'idx_user_created', 'user_id, created_at DESC');

-- Search (Using created_at)
CALL AddIndexIfNotExist('search_analytics', 'idx_query_created', 'query, created_at DESC');
CALL AddIndexIfNotExist('search_analytics', 'idx_category_created', 'category_filter, created_at DESC');
CALL AddIndexIfNotExist('search_analytics', 'idx_user_created', 'user_id, created_at DESC');

-- Notifications
CALL AddIndexIfNotExist('notifications', 'idx_user_type_read', 'user_id, type, is_read');
CALL AddIndexIfNotExist('notifications', 'idx_user_unread_created', 'user_id, is_read, created_at DESC');

-- Coupons & Vouchers
CALL AddIndexIfNotExist('coupons', 'idx_code_dates', 'code, starts_at, ends_at');
CALL AddIndexIfNotExist('vouchers', 'idx_status_valid', 'status, valid_until');

-- Users
CALL AddIndexIfNotExist('users', 'idx_email_verified', 'email, is_verified');
CALL AddIndexIfNotExist('users', 'idx_tier_points', 'membership_tier, accumulated_points DESC');
CALL AddIndexIfNotExist('users', 'idx_active_created', 'is_active, created_at DESC');

-- Admin Logs
CALL AddIndexIfNotExist('admin_activity_logs', 'idx_entity_created', 'entity_type, entity_id, created_at DESC');
CALL AddIndexIfNotExist('admin_activity_logs', 'idx_action_created', 'action, created_at DESC');

-- Flash Sales (Using is_active)
CALL AddIndexIfNotExist('flash_sales', 'idx_active_dates', 'is_active, start_time, end_time');
CALL AddIndexIfNotExist('flash_sale_items', 'idx_sale_product', 'flash_sale_id, product_id');

-- Support Chats
CALL AddIndexIfNotExist('support_chats', 'idx_status_last_message', 'status, last_message_at DESC');
CALL AddIndexIfNotExist('support_chats', 'idx_assigned_status', 'assigned_admin_id, status');

-- Cleanup
DROP PROCEDURE IF EXISTS AddIndexIfNotExist;
