-- Phase 5: Performance & Indexing (Idempotent)

-- 1. Single-Column Indexes
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_voucher_code' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_orders_voucher_code ON orders (voucher_code)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_payment_method' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_orders_payment_method ON orders (payment_method)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Gift Cards: idx_gift_cards_status
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'gift_cards' AND INDEX_NAME = 'idx_gift_cards_status' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_gift_cards_status ON gift_cards (status)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- News: idx_news_published
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'news' AND INDEX_NAME = 'idx_news_published' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_news_published ON news (is_published)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'news' AND INDEX_NAME = 'idx_news_published_at' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_news_published_at ON news (published_at)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- User Addresses: (user_id, is_default)
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'user_addresses' AND INDEX_NAME = 'idx_user_addr_default' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_user_addr_default ON user_addresses (user_id, is_default)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Product Images: (product_id, is_main)
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'product_images' AND INDEX_NAME = 'idx_product_images_main' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_product_images_main ON product_images (product_id, is_main)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Composite Indexes
SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'point_transactions' AND INDEX_NAME = 'idx_pt_user_time' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_pt_user_time ON point_transactions (user_id, created_at DESC)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'coupon_usage' AND INDEX_NAME = 'idx_coupon_usage_check' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_coupon_usage_check ON coupon_usage (user_id, coupon_id)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_transactions_order_status' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_transactions_order_status ON transactions (order_id, status)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'security_logs' AND INDEX_NAME = 'idx_security_event_time' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_security_event_time ON security_logs (event_type, created_at DESC)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'coupons' AND INDEX_NAME = 'idx_coupons_active' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_coupons_active ON coupons (deleted_at, ends_at)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'inventory_logs' AND INDEX_NAME = 'idx_inventory_logs_time' AND TABLE_SCHEMA = DATABASE()) = 0, 'CREATE INDEX idx_inventory_logs_time ON inventory_logs (inventory_id, created_at DESC)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
