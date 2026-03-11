-- Database Cleanup Script for Step 1
-- Removes test data, stale metrics, and excessive logs

-- 1. Remove Test Orders & Related Data
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%');
DELETE FROM order_payment_details WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%');
DELETE FROM order_shipping_details WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%');
DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%'); -- If exists
DELETE FROM flash_sale_items WHERE flash_sale_id IN (SELECT id FROM flash_sales WHERE name LIKE '%TEST%');
DELETE FROM flash_sales WHERE name LIKE '%TEST%';
DELETE FROM orders WHERE order_number LIKE 'TEST-%';

-- 2. Remove Test Users & Redundant Admin Entry in Users table
DELETE FROM news_comment_likes WHERE user_id IN (3); -- admin@nike.com
DELETE FROM news_comments WHERE user_id IN (3);
DELETE FROM user_addresses WHERE user_id IN (3);
DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = 3);
DELETE FROM carts WHERE user_id = 3;
DELETE FROM wishlist_items WHERE wishlist_id IN (SELECT id FROM wishlists WHERE user_id = 3);
DELETE FROM wishlists WHERE user_id = 3;
DELETE FROM auth_tokens WHERE user_id = 3;
DELETE FROM users WHERE email = 'admin@nike.com';
DELETE FROM users WHERE email LIKE 'test%@test.com';
DELETE FROM users WHERE email LIKE 'testuser_%@example.com';

-- 3. Clear Stale Metrics & Excessive Logs
TRUNCATE TABLE daily_metrics;
DELETE FROM security_logs WHERE created_at < '2026-03-01 00:00:00'; -- Clean up old security logs
TRUNCATE TABLE search_analytics; -- Clear search history for production refactor

-- 4. Standardize Inventory Logs
DELETE FROM inventory_logs WHERE reference_id LIKE 'product_size_%';

-- 5. Cleanup gift cards used for testing (if any)
DELETE FROM gift_card_transactions WHERE gift_card_id IN (SELECT id FROM gift_cards WHERE status = 'used' AND expiry_date < NOW());
