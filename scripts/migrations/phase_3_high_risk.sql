-- Phase 3: High Risk Migration

-- 1. Variant-Color Integrity (Point 3)
-- Step 1a: Add color_id column if not exists
ALTER TABLE `product_variants` ADD COLUMN `color_id` BIGINT UNSIGNED DEFAULT NULL AFTER `color`;

-- Step 1b: Populate product_colors from unique color strings
INSERT IGNORE INTO `product_colors` (name)
SELECT DISTINCT color FROM `product_variants` WHERE color IS NOT NULL AND color != '';

-- Step 1c: Update color_id by matching name
UPDATE `product_variants` pv
JOIN `product_colors` pc ON pv.color = pc.name
SET pv.color_id = pc.id;

-- Step 1d: Add FK and remove old column
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `product_colors` (`id`) ON DELETE SET NULL;
ALTER TABLE `product_variants` DROP COLUMN `color`;

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
