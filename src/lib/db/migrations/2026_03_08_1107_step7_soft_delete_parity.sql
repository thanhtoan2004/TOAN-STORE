-- Step 7: Schema Consistency - Soft Delete Parity (Phase 5)
-- Objective: Add deleted_at columns to tables missing them with robust compatibility.

START TRANSACTION;

-- 1. Add deleted_at to flash_sale_items
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='flash_sale_items' AND COLUMN_NAME='deleted_at' AND TABLE_SCHEMA=DATABASE()) > 0,
    'SELECT 1',
    'ALTER TABLE flash_sale_items ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='flash_sale_items' AND INDEX_NAME='idx_flash_items_deleted' AND TABLE_SCHEMA=DATABASE()) > 0,
    'SELECT 1',
    'CREATE INDEX idx_flash_items_deleted ON flash_sale_items(deleted_at)'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add deleted_at to product_reviews
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='product_reviews' AND COLUMN_NAME='deleted_at' AND TABLE_SCHEMA=DATABASE()) > 0,
    'SELECT 1',
    'ALTER TABLE product_reviews ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_NAME='product_reviews' AND INDEX_NAME='idx_reviews_deleted' AND TABLE_SCHEMA=DATABASE()) > 0,
    'SELECT 1',
    'CREATE INDEX idx_reviews_deleted ON product_reviews(deleted_at)'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verification
COMMIT;
