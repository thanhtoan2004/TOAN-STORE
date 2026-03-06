-- Phase 3: High Risk Migration

-- 1. Variant-Color Integrity (Point 3)
-- Step 1a: Add color_id column conditionally
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'color_id' AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE `product_variants` ADD COLUMN `color_id` BIGINT UNSIGNED DEFAULT NULL AFTER `color`',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 1b: Populate product_colors from unique color strings per product conditionally
-- Check if we have product_variants.color text still
SET @s = (SELECT IF(
     (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'color' AND TABLE_SCHEMA = DATABASE()) > 0,
     'INSERT IGNORE INTO `product_colors` (product_id, color_name) SELECT DISTINCT product_id, color FROM `product_variants` WHERE color IS NOT NULL AND color != \'\'',
     'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- Step 1c: Update color_id conditionally if color column exists
SET @s = (SELECT IF(
     (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'color' AND TABLE_SCHEMA = DATABASE()) > 0,
     'UPDATE `product_variants` pv JOIN `product_colors` pc ON pv.product_id = pc.product_id AND pv.color = pc.color_name SET pv.color_id = pc.id',
     'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 1d: Add FK conditionally
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'product_variants' AND CONSTRAINT_NAME = 'product_variants_ibfk_2' AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `product_colors` (`id`) ON DELETE SET NULL',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 1e: Drop old column conditionally
SET @s = (SELECT IF(
     (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'color' AND TABLE_SCHEMA = DATABASE()) > 0,
     'ALTER TABLE `product_variants` DROP COLUMN `color`',
     'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- 2. Stock Tracking Source of Truth (Point 2)
-- Note: These columns might not exist if already cleaned up, but we ensure they are gone.
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'stock_quantity' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE products DROP COLUMN stock_quantity',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'stock_quantity' AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE product_variants DROP COLUMN stock_quantity',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
