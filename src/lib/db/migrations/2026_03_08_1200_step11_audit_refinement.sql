-- Final Refinement & Audit Sync (Phase 7)
-- Date: 2026-03-08 11:30
-- Target: Critical findings from Phase 6 Audit

START TRANSACTION;

-- 1. Fix news.author_id Orphaned FK
-- Record ID 3 has author_id = 3 but admin_users only has 1, 2.
UPDATE `news` SET `author_id` = 1 WHERE `author_id` = 3;
ALTER TABLE `news` MODIFY `author_id` bigint(20) unsigned DEFAULT 1;

-- 2. admin_users Schema Sync (Add missing Doc columns)
ALTER TABLE `admin_users` 
  ADD COLUMN `bio` TEXT DEFAULT NULL AFTER `full_name`,
  ADD COLUMN `avatar_url` VARCHAR(1000) DEFAULT NULL AFTER `bio`,
  ADD COLUMN `social_links` JSON DEFAULT NULL AFTER `avatar_url`;

-- 3. Users Points Consistency
ALTER TABLE `users` 
  ADD CONSTRAINT `chk_users_points_consistency` CHECK (`available_points` <= `lifetime_points`);

-- 4. Extra Indexing for Reports
CREATE INDEX `idx_orders_placed_at` ON `orders` (`placed_at`);

-- 5. Sync Settings & System Config (Consolidation)
-- Priority: system_config as source of truth for site_name and tax_rate
UPDATE `system_config` SET `value` = 'TOAN STORE' WHERE `key` = 'site_name';
UPDATE `system_config` SET `value` = '10' WHERE `key` = 'tax_rate'; 

-- 6. Fix Missing SKUs for Product ID 7 (Nike Mercurial)
UPDATE `product_variants` SET `sku` = 'NK-MERC-VAP-38' WHERE `product_id` = 7 AND `size` = '38';
UPDATE `product_variants` SET `sku` = 'NK-MERC-VAP-39' WHERE `product_id` = 7 AND `size` = '39';
UPDATE `product_variants` SET `sku` = 'NK-MERC-VAP-40' WHERE `product_id` = 7 AND `size` = '40';
UPDATE `product_variants` SET `sku` = 'NK-MERC-VAP-41' WHERE `product_id` = 7 AND `size` = '41';
UPDATE `product_variants` SET `sku` = 'NK-MERC-VAP-42' WHERE `product_id` = 7 AND `size` = '42';

-- 7. Audit: Confirm Legacy Columns Removal (Safe drop if exists)
-- This is a procedural check as database.sql showed them already gone.
-- In some environments they might persist.
SET @stock_col = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'stock_quantity');
SET @reserved_col = (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'reserved_quantity');

SET @drop_stock = IF(@stock_col > 0, 'ALTER TABLE `product_variants` DROP COLUMN `stock_quantity`','SELECT 1');
PREPARE stmt1 FROM @drop_stock;
EXECUTE stmt1;

SET @drop_reserved = IF(@reserved_col > 0, 'ALTER TABLE `product_variants` DROP COLUMN `reserved_quantity`','SELECT 1');
PREPARE stmt2 FROM @drop_reserved;
EXECUTE stmt2;

-- 8. Final Verification Assertions
SELECT 'VERIFICATION: News author fixed' AS msg, id, author_id FROM news WHERE id = 3;
SELECT 'VERIFICATION: Admin columns added' AS msg, id, username, bio FROM admin_users LIMIT 1;

COMMIT;
