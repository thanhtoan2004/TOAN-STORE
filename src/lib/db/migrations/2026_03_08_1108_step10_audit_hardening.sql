-- ============================================================
-- STEP 10: DATABASE AUDIT & HARDENING (PHASE 6)
-- Integrating remaining valid fixes from fix.md.
-- ============================================================

START TRANSACTION;

-- [AUDIT CLEANUP]
-- 1. Remove misplaced admin from users table
DELETE FROM users WHERE email = 'admin@nike.com';

-- 2. Remove residual inventory_logs from initial migration
DELETE FROM inventory_logs 
WHERE reference_id LIKE 'product_size_%' 
  AND reason = 'initial_migration';

-- 3. Purge orphaned security_logs for deleted users (Final check)
DELETE FROM security_logs 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM users);

-- 4. Purge search_analytics older than 90 days
DELETE FROM search_analytics WHERE created_at < NOW() - INTERVAL 90 DAY;

-- [CONSTRAINTS & FKs]
-- 5. inventory_transfers: requested_by / approved_by -> admin_users
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_transfers_requested_by' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE inventory_transfers ADD CONSTRAINT fk_transfers_requested_by FOREIGN KEY (requested_by) REFERENCES admin_users (id) ON DELETE SET NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_transfers_approved_by' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE inventory_transfers ADD CONSTRAINT fk_transfers_approved_by FOREIGN KEY (approved_by) REFERENCES admin_users (id) ON DELETE SET NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. product_variants.price — add CHECK constraint
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='chk_variant_price_non_negative' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE product_variants ADD CONSTRAINT chk_variant_price_non_negative CHECK (price >= 0)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- [DOCUMENTATION COMMENTS]
-- 7. Add comments to enforce business contracts in schema
ALTER TABLE products
    MODIFY price_cache DECIMAL(12,2) NOT NULL DEFAULT 0.00
        COMMENT 'Denormalized: MIN(product_variants.price). Updated by app on variant change.',
    MODIFY msrp_price DECIMAL(12,2) DEFAULT NULL
        COMMENT 'Original retail price for display purposes only. Not used in checkout logic.';

ALTER TABLE coupons
    MODIFY code VARCHAR(100) NOT NULL
        COMMENT 'Publicly shareable discount code. Applied at checkout for all eligible users.';

ALTER TABLE vouchers
    MODIFY code VARCHAR(100) NOT NULL
        COMMENT 'One-time personal credit code. Claimed into user wallet, then applied at checkout.';

-- 8. Final verification of metrics preservation
SELECT COUNT(*) AS daily_metrics_count FROM daily_metrics;

COMMIT;
