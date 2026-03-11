-- ============================================================
-- STEP 2: FK & CONSTRAINTS REINFORCEMENT
-- ============================================================

START TRANSACTION;

-- 2A. Guard for Warehouse 1
-- Enforce existence of default warehouse before migrations.
INSERT IGNORE INTO warehouses (id, name, location) VALUES (1, 'Default Warehouse', 'Khởi tạo tự động');

-- 2B. inventory_transfers: requested_by / approved_by -> admin_users
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_transfers_requested_by' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE inventory_transfers ADD CONSTRAINT fk_transfers_requested_by FOREIGN KEY (requested_by) REFERENCES admin_users (id) ON DELETE SET NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='fk_transfers_approved_by' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE inventory_transfers ADD CONSTRAINT fk_transfers_approved_by FOREIGN KEY (approved_by) REFERENCES admin_users (id) ON DELETE SET NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2C. product_variants.price — add CHECK constraint
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME='chk_variant_price_non_negative' AND TABLE_SCHEMA=DATABASE()) = 0, 'ALTER TABLE product_variants ADD CONSTRAINT chk_variant_price_non_negative CHECK (price >= 0)', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2D. Standardize inventory.warehouse_id
UPDATE inventory SET warehouse_id = 1 WHERE warehouse_id IS NULL;

SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='inventory' AND COLUMN_NAME='warehouse_id' AND IS_NULLABLE='YES' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE inventory MODIFY warehouse_id BIGINT UNSIGNED NOT NULL', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Fix index
SET @s = (SELECT IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='inventory' AND INDEX_NAME='unq_variant_warehouse' AND TABLE_SCHEMA=DATABASE()) > 0, 'ALTER TABLE inventory DROP INDEX unq_variant_warehouse', 'SELECT 1'));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE inventory ADD UNIQUE KEY unq_variant_warehouse (product_variant_id, warehouse_id);

-- 2E. Verification
SELECT id, name FROM warehouses WHERE id = 1;

COMMIT;
