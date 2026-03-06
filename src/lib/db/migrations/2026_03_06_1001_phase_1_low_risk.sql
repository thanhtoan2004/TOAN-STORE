-- Phase 1: Low Risk Schema Fixes

-- 1. Metrics Timezone Precision (Point 4)
ALTER TABLE `daily_metrics` MODIFY COLUMN `date` DATE NOT NULL;

-- 2. Attribute System Unification (Point 6)
-- We'll unify into attribute_values referencing attributes(id).
-- Step 2a: Fix attribute_values FK (it currently points to category_attributes in some places)
ALTER TABLE `attribute_values` DROP FOREIGN KEY `attribute_values_ibfk_1`;
ALTER TABLE `attribute_values` ADD CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;
ALTER TABLE `attribute_values` ADD COLUMN `label` VARCHAR(255) DEFAULT NULL AFTER `value`;

-- Step 2b: Migrate data from attribute_options to attribute_values if any
INSERT IGNORE INTO `attribute_values` (attribute_id, value, label)
SELECT attribute_id, value, label FROM `attribute_options`;

-- Step 2c: Update product_attribute_values to use attribute_values.id
ALTER TABLE `product_attribute_values` DROP FOREIGN KEY `product_attribute_values_ibfk_3`;
ALTER TABLE `product_attribute_values` CHANGE COLUMN `option_id` `value_id` BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE `product_attribute_values` ADD CONSTRAINT `product_attribute_values_ibfk_3` FOREIGN KEY (`value_id`) REFERENCES `attribute_values` (`id`) ON DELETE SET NULL;

DROP TABLE IF EXISTS `attribute_options`;

-- 3. Refund Traceability (Point 7)
ALTER TABLE `refunds` ADD COLUMN `request_id` BIGINT UNSIGNED DEFAULT NULL AFTER `order_id`;
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `refund_requests` (`id`) ON DELETE SET NULL;
