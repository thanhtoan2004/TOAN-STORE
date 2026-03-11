-- ============================================================
-- STEP 1: TEST DATA & LOGS CLEANUP
-- ============================================================

START TRANSACTION;

-- 1A. Orders Cleanup (Test orders)
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%' OR order_number LIKE 'MK-%');
DELETE FROM orders WHERE order_number LIKE 'TEST-%' OR order_number LIKE 'MK-%';

-- 1B. Users Cleanup (Test users)
DELETE FROM users WHERE email='test@example.com' OR email LIKE 'test_verification_%';

-- 1C. Stale Logs (Archived or transient logs)
TRUNCATE TABLE inventory_logs; -- Purge old migration logs if any
DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND user_id IS NULL;

-- 1D. Flash Sales Cleanup
DELETE FROM flash_sales WHERE deleted_at IS NOT NULL;

-- VERIFICATION
SELECT 
    (SELECT COUNT(*) FROM orders WHERE order_number LIKE 'TEST-%' OR order_number LIKE 'MK-%') as test_orders,
    (SELECT COUNT(*) FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL) as orphan_items,
    (SELECT COUNT(*) FROM users WHERE email='test@example.com' OR email LIKE 'test_verification_%') as test_users,
    (SELECT COUNT(*) FROM session_logs WHERE user_id NOT IN (SELECT id FROM users) AND user_id IS NOT NULL) as orphan_session_logs;

COMMIT;
