-- =============================================================================
-- Migration: 2026_03_12_2000_maintenance_performance.sql
-- Goal: Fix Full-Text Search and optimize product filtering performance
-- =============================================================================

START TRANSACTION;

-- 1. FULL-TEXT SEARCH INDEX for Products
-- This is critical for the search function and chatbot to work efficiently.
ALTER TABLE `products` ADD FULLTEXT INDEX `idx_products_search` (`name`, `sku`, `description`);

-- 2. Performance Indexes for Product Filtering & Sorting
-- Optimization for the "Nike Shop" page which filters by Category, Sport, and Price.
CREATE INDEX `idx_products_category_active` ON `products` (`category_id`, `is_active`, `deleted_at`);
CREATE INDEX `idx_products_sport_active` ON `products` (`sport_id`, `is_active`, `deleted_at`);
CREATE INDEX `idx_products_created_at` ON `products` (`created_at` DESC);
CREATE INDEX `idx_products_price` ON `products` (`price_cache`);

-- 3. Optimization for User History
-- Faster loading of "My Orders" page.
CREATE INDEX `idx_orders_user_created` ON `orders` (`user_id`, `created_at` DESC);

-- 4. Optimization for Search Analytics (if exists)
-- If search analytics table exists, index the keywords.
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'search_analytics' AND TABLE_SCHEMA = DATABASE()) > 0,
    'CREATE INDEX idx_search_query ON search_analytics (query(100), created_at DESC)',
    'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;
