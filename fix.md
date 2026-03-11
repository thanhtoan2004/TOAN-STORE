-- ============================================================
-- STEP 1: DATA CLEANUP — toan_store
-- Run in a transaction. Verify counts before committing.
-- ============================================================

START TRANSACTION;

---

-- 1A. Remove test orders and their children
-- (cascade handles order_items, coupon_usage, refund_requests,
-- gift_card_transactions, shipment_items via ON DELETE CASCADE)

---

DELETE FROM orders
WHERE order_number LIKE 'TEST-%'
OR order_number LIKE 'MK-%';

---

-- 1B. Remove test users
-- (cascade handles carts, wishlists, addresses, notifications,
-- point_transactions, security_logs via ON DELETE CASCADE)

---

DELETE FROM users
WHERE email LIKE 'test*%@test.com'
OR email LIKE 'test*%@example.com'
OR email LIKE 'testuser\_%@example.com'
OR email = 'test@example.com'
OR email = 'admin@nike.com'; -- misplaced admin in users table

---

-- 1C. Remove residual inventory_logs from initial migration
-- (these are not real business events)

---

DELETE FROM inventory*logs
WHERE reference_id LIKE 'product_size*%'
AND reason = 'initial_migration';

---

-- 1D. Remove orphaned security_logs for deleted users
-- (users were cascade-deleted, but security_logs has no FK)

---

DELETE FROM security_logs
WHERE user_id IS NOT NULL
AND user_id NOT IN (SELECT id FROM users);

---

-- 1E. Remove soft-deleted flash sales and their items
-- (items already cascade, but clean up explicitly for clarity)

---

DELETE FROM flash_sale_items
WHERE flash_sale_id IN (
SELECT id FROM flash_sales WHERE deleted_at IS NOT NULL
);
DELETE FROM flash_sales WHERE deleted_at IS NOT NULL;

---

-- 1F. Reset daily_metrics — will be repopulated by app logic

---

TRUNCATE TABLE daily_metrics;

---

-- 1G. Purge search_analytics older than 90 days
-- (keep recent data for analytics value)

---

DELETE FROM search_analytics
WHERE created_at < NOW() - INTERVAL 90 DAY;

---

-- VERIFICATION — run these SELECTs before COMMIT
-- All counts should be 0

---

SELECT 'Remaining test orders' AS check*name, COUNT(*) AS remaining FROM orders WHERE order_number LIKE 'TEST-%' OR order_number LIKE 'MK-%'
UNION ALL
SELECT 'Remaining test users', COUNT(*) FROM users WHERE email LIKE 'test*%@test.com' OR email = 'admin@nike.com'
UNION ALL
SELECT 'Orphaned security*logs', COUNT(*) FROM security_logs WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'Stale inventory_logs', COUNT(*) FROM inventory_logs WHERE reference_id LIKE 'product_size*%'
UNION ALL
SELECT 'Soft-deleted flash_sales', COUNT(\*) FROM flash_sales WHERE deleted_at IS NOT NULL;

-- COMMIT; -- Uncomment after verifying all counts above are 0
ROLLBACK; -- Safety: remove this line when ready to apply

-- ============================================================
-- STEP 2: FK & CONSTRAINTS REINFORCEMENT
-- Safe to run after Step 1 cleanup.
-- ============================================================

START TRANSACTION;

---

-- 2A. orders.giftcard_number -> gift_cards.card_number
-- Current: varchar(16) with no FK, can reference non-existent cards.
-- Fix: Add FK. NULLable because most orders have no gift card.
-- NOTE: After Step 4 (hash), this column will be replaced by
-- giftcard_id -> gift_cards.id. This is an interim fix.

---

ALTER TABLE orders
ADD CONSTRAINT fk_orders_giftcard
FOREIGN KEY (giftcard_number)
REFERENCES gift_cards (card_number)
ON DELETE SET NULL
ON UPDATE CASCADE;

---

-- 2B. inventory_transfers: requested_by / approved_by -> admin_users
-- Current: bigint unsigned with no FK — orphan risk.

---

ALTER TABLE inventory_transfers
ADD CONSTRAINT fk_transfers_requested_by
FOREIGN KEY (requested_by)
REFERENCES admin_users (id)
ON DELETE SET NULL,

    ADD CONSTRAINT fk_transfers_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES admin_users (id)
    ON DELETE SET NULL;

---

-- 2C. product_variants.price — add CHECK constraint
-- (No FK possible for a scalar, but enforce non-negative)

---

ALTER TABLE product_variants
ADD CONSTRAINT chk_variant_price_non_negative
CHECK (price >= 0);

---

-- 2D. Standardize inventory.warehouse_id — enforce NOT NULL
-- Current design allows NULL meaning "default warehouse" which
-- is ambiguous. Warehouse 1 (Kho Hà Nội) IS the default.
-- Migrate NULLs first, then add NOT NULL constraint.

---

UPDATE inventory
SET warehouse_id = 1
WHERE warehouse_id IS NULL;

-- Verify no NULLs remain before altering
SELECT 'NULL warehouse_id remaining' AS check_name, COUNT(\*) AS cnt
FROM inventory WHERE warehouse_id IS NULL;

ALTER TABLE inventory
MODIFY warehouse_id BIGINT UNSIGNED NOT NULL,
DROP INDEX unq_variant_warehouse,
ADD UNIQUE KEY unq_variant_warehouse (product_variant_id, warehouse_id);

---

-- 2E. Add missing index: orders.giftcard_number
-- (needed for the FK lookup performance above)

---

ALTER TABLE orders
ADD INDEX idx_orders_giftcard (giftcard_number);

---

-- VERIFICATION

---

SELECT
CONSTRAINT_NAME,
TABLE_NAME,
REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'toan_store'
AND CONSTRAINT_NAME IN (
'fk_orders_giftcard',
'fk_transfers_requested_by',
'fk_transfers_approved_by'
);

-- COMMIT;
ROLLBACK;

-- ============================================================
-- STEP 3: ORDERS & PRICING SCHEMA REFACTOR
-- IMPORTANT: Run Step 1 & 2 first.
-- This migration is DESTRUCTIVE — backup before running.
-- ============================================================

START TRANSACTION;

-- ============================================================
-- PART A: ORDERS TABLE — Remove redundant PII columns
-- Strategy:
-- 1. Ensure shipping_address_snapshot already captures the
-- necessary data (it does — confirmed in current schema).
-- 2. Drop plaintext PII columns that duplicate snapshot/FKs.
-- 3. Keep encrypted columns until encryption layer is removed
-- in a coordinated app-code change.
-- ============================================================

-- Step 3A-1: Verify snapshot is populated on all real orders
-- (Run this SELECT, expect 0 rows before proceeding)
SELECT id, order_number
FROM orders
WHERE shipping_address_snapshot IS NULL
AND status NOT IN ('cancelled');

-- Step 3A-2: Drop redundant plaintext columns
-- (encrypted counterparts are kept until app code is updated)
ALTER TABLE orders
DROP COLUMN phone, -- replaced by shipping_address_snapshot->phone
DROP COLUMN email, -- replaced by shipping_address_snapshot (or user lookup)
DROP COLUMN billing_phone_encrypted, -- billing = same as shipping in current flow
DROP COLUMN billing_address_id, -- not used (all NULLs in data)
DROP COLUMN shipping_address_id; -- snapshot already captured; FK was nullable

-- Step 3A-3: Rename remaining encrypted columns for clarity
ALTER TABLE orders
RENAME COLUMN phone_encrypted TO contact_phone_enc,
RENAME COLUMN email_encrypted TO contact_email_enc,
RENAME COLUMN shipping_phone_encrypted TO shipping_phone_enc,
RENAME COLUMN shipping_address_encrypted TO shipping_address_enc;

-- Step 3A-4: Add a clean, typed notes column for internal use
-- (existing `notes` column is kept — already correct)

-- ============================================================
-- PART B: PRICING — Standardize source of truth
-- Rule:
-- product_variants.price = actual checkout price (source of truth)
-- products.base_price = lowest variant price (denormalized cache)
-- products.retail_price = original MSRP for "crossed out" display
-- ============================================================

-- Step 3B-1: Rename base_price to msrp_cache for clarity
ALTER TABLE products
RENAME COLUMN base_price TO price_cache,
RENAME COLUMN retail_price TO msrp_price;

-- Step 3B-2: Add a comment/constraint documenting the contract
ALTER TABLE products
MODIFY price_cache DECIMAL(12,2) NOT NULL DEFAULT 0.00
COMMENT 'Denormalized: MIN(product_variants.price). Updated by app on variant change.',
MODIFY msrp_price DECIMAL(12,2) DEFAULT NULL
COMMENT 'Original retail price for display purposes only. Not used in checkout logic.';

-- Step 3B-3: Sync price_cache with actual variant prices
UPDATE products p
SET p.price_cache = (
SELECT MIN(pv.price)
FROM product_variants pv
WHERE pv.product_id = p.id
AND pv.price > 0
)
WHERE EXISTS (
SELECT 1 FROM product_variants pv
WHERE pv.product_id = p.id AND pv.price > 0
);

-- ============================================================
-- PART C: COUPONS vs VOUCHERS — Clarify with column comments
-- (No structural change; these serve genuinely different flows)
-- coupons = admin-created discount codes, applied at checkout
-- vouchers = user-redeemable credit codes, added to wallet
-- ============================================================

ALTER TABLE coupons
MODIFY code VARCHAR(100) NOT NULL
COMMENT 'Publicly shareable discount code. Applied at checkout for all eligible users.';

ALTER TABLE vouchers
MODIFY code VARCHAR(100) NOT NULL
COMMENT 'One-time personal credit code. Claimed into user wallet, then applied at checkout.';

-- ============================================================
-- PART D: Clean up excess indexes on orders
-- Current: 15 indexes — reduce to essential set
-- ============================================================

-- Drop indexes that are subsumed by composite ones
ALTER TABLE orders
DROP INDEX idx_order_number, -- covered by UNIQUE KEY order_number
DROP INDEX idx_tracking_number, -- covered by idx_tracking_carrier
DROP INDEX idx_payment_status_placed; -- covered by idx_status_placed for common queries

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Confirm pricing is consistent (should return 0 rows)
SELECT p.id, p.name, p.price_cache, MIN(pv.price) AS actual_min_price
FROM products p
JOIN product_variants pv ON pv.product_id = p.id
WHERE pv.price > 0
GROUP BY p.id
HAVING p.price_cache != actual_min_price;

-- Confirm column cleanup (should not contain dropped columns)
SELECT COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'toan_store'
AND TABLE_NAME = 'orders'
AND COLUMN_NAME IN ('phone', 'email', 'billing_address_id', 'shipping_address_id');

-- COMMIT;
ROLLBACK;

-- ============================================================
-- STEP 4: GIFT CARD PCI-DSS HARDENING
-- Replaces plaintext card_number with hash + last4 pattern.
-- REQUIRES coordinated app-code deployment before COMMIT.
-- ============================================================

START TRANSACTION;

---

-- 4A. Add new secure columns
-- card_number_hash : SHA-256 of the full card number (app-side)
-- card_number_last4: Last 4 digits for display ("•••• 6969")

---

ALTER TABLE gift_cards
ADD COLUMN card_number_hash VARCHAR(64) NOT NULL DEFAULT ''
COMMENT 'SHA-256(card_number). Used for lookup/validation. Never store plaintext.'
AFTER card_number,
ADD COLUMN card_number_last4 CHAR(4) NOT NULL DEFAULT ''
COMMENT 'Last 4 digits of card number for display only.'
AFTER card_number_hash;

---

-- 4B. Populate hash and last4 FROM existing plaintext data
-- (One-time migration. App code must take over after this.)
-- MySQL's SHA2() produces a hex string identical to SHA-256.

---

UPDATE gift_cards
SET card_number_hash = SHA2(card_number, 256),
card_number_last4 = RIGHT(card_number, 4);

---

-- 4C. Enforce constraints on new columns

---

ALTER TABLE gift_cards
MODIFY card_number_hash VARCHAR(64) NOT NULL,
MODIFY card_number_last4 CHAR(4) NOT NULL,
ADD UNIQUE KEY uk_card_number_hash (card_number_hash);

---

-- 4D. Update orders reference: replace varchar card_number
-- with a nullable FK to gift_cards.id
-- (Drop Step 2's interim FK first to avoid conflict)

---

ALTER TABLE orders
DROP FOREIGN KEY fk_orders_giftcard,
DROP INDEX idx_orders_giftcard;

ALTER TABLE orders
ADD COLUMN giftcard_id BIGINT UNSIGNED DEFAULT NULL
COMMENT 'FK to gift_cards.id. Replaces plaintext giftcard_number.'
AFTER giftcard_discount;

-- Backfill giftcard_id from existing giftcard_number values
UPDATE orders o
JOIN gift_cards gc ON gc.card_number = o.giftcard_number
SET o.giftcard_id = gc.id
WHERE o.giftcard_number IS NOT NULL;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_giftcard_id
FOREIGN KEY (giftcard_id)
REFERENCES gift_cards (id)
ON DELETE SET NULL;

---

-- 4E. Drop plaintext card_number columns
-- WARNING: Only run after:
-- (a) app code is updated to use card_number_hash for lookup
-- (b) orders.giftcard_id backfill is verified (step above)

---

-- Verify backfill: should return 0 rows
SELECT id, order_number, giftcard_number
FROM orders
WHERE giftcard_number IS NOT NULL AND giftcard_id IS NULL;

-- Verify hash populated: should return 0 rows
SELECT id FROM gift_cards WHERE card_number_hash = '' OR card_number_last4 = '';

-- Only proceed with drops after verification above ↑
ALTER TABLE gift_cards
DROP FOREIGN KEY fk_orders_giftcard, -- if still exists from step 2
DROP COLUMN card_number; -- REMOVE PLAINTEXT

ALTER TABLE orders
DROP COLUMN giftcard_number; -- REMOVE PLAINTEXT REFERENCE

---

-- FINAL SCHEMA for gift_cards (key columns):
-- id BIGINT PK
-- card_number_hash VARCHAR(64) UNIQUE ← lookup/validation
-- card_number_last4 CHAR(4) ← display "•••• 6969"
-- pin VARCHAR(255) ← bcrypt hash (already correct)
-- ...

---

-- COMMIT;
ROLLBACK;

-- ============================================================
-- STEP 5: INFRA & PERFORMANCE
-- Log archiving strategy + rate limiting table
-- ============================================================

-- ============================================================
-- PART A: LOG ARCHIVING — TTL Strategy
-- Approach: Archive tables mirror source structure.
-- A scheduled event moves old rows nightly.
-- Source tables stay lean and fast.
-- ============================================================

-- A1. Archive tables (created once, never truncated)
CREATE TABLE IF NOT EXISTS archive_security_logs LIKE security_logs;
CREATE TABLE IF NOT EXISTS archive_admin_activity_logs LIKE admin_activity_logs;
CREATE TABLE IF NOT EXISTS archive_search_analytics LIKE search_analytics;

-- A2. Scheduled event: archive security_logs older than 90 days
DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_archive_security_logs
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
DO BEGIN
-- Move to archive
INSERT IGNORE INTO archive_security_logs
SELECT \* FROM security_logs
WHERE created_at < NOW() - INTERVAL 90 DAY;

    -- Delete from live table
    DELETE FROM security_logs
    WHERE created_at < NOW() - INTERVAL 90 DAY;

END$$

-- A3. Archive admin_activity_logs older than 180 days
CREATE EVENT IF NOT EXISTS evt_archive_admin_logs
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
DO BEGIN
INSERT IGNORE INTO archive_admin_activity_logs
SELECT \* FROM admin_activity_logs
WHERE created_at < NOW() - INTERVAL 180 DAY;

    DELETE FROM admin_activity_logs
    WHERE created_at < NOW() - INTERVAL 180 DAY;

END$$

-- A4. Purge search_analytics older than 90 days (not worth archiving)
CREATE EVENT IF NOT EXISTS evt_purge_search_analytics
ON SCHEDULE EVERY 1 WEEK
STARTS (CURRENT_TIMESTAMP + INTERVAL 2 HOUR)
DO BEGIN
DELETE FROM search_analytics
WHERE created_at < NOW() - INTERVAL 90 DAY;
END$$

DELIMITER ;

-- Enable event scheduler (requires SUPER or EVENT privilege)
SET GLOBAL event_scheduler = ON;

-- ============================================================
-- PART B: RATE LIMITING TABLE
-- Replaces the deleted ip_blocklist with a more flexible design.
-- Covers: login, API endpoints, OTP, gift card checks.
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
ip_address VARCHAR(45) NOT NULL,
action VARCHAR(50) NOT NULL
COMMENT 'e.g. login, otp_verify, gift_card_check, api_checkout',
user_id BIGINT UNSIGNED DEFAULT NULL
COMMENT 'NULL for unauthenticated attempts',
attempt_count INT NOT NULL DEFAULT 1,
window_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
COMMENT 'Start of the current counting window',
locked_until TIMESTAMP NULL DEFAULT NULL
COMMENT 'NULL = not locked. Populated after threshold breach.',
last_attempt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
UNIQUE KEY uk_ip_action_window (ip_address, action, window_start),
KEY idx_ip_action (ip_address, action),
KEY idx_locked_until (locked_until),
KEY idx_window_start (window_start),
CONSTRAINT fk_rla_user
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Rolling-window rate limiting for sensitive actions.';

-- Purge expired windows automatically
CREATE EVENT IF NOT EXISTS evt_purge_rate_limit
ON SCHEDULE EVERY 1 HOUR
DO
DELETE FROM rate_limit_attempts
WHERE window_start < NOW() - INTERVAL 24 HOUR
AND (locked_until IS NULL OR locked_until < NOW());

-- ============================================================
-- PART C: VERIFY INDEX COUNT on orders
-- Target: reduce from 15 to ≤ 10 essential indexes
-- (Drops were done in Step 3 Part D)
-- ============================================================

SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'toan_store'
AND TABLE_NAME = 'orders'
ORDER BY INDEX_NAME;

-- Expected count after Step 3 drops: 12 or fewer
SELECT COUNT(DISTINCT INDEX_NAME) AS total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'toan_store'
AND TABLE_NAME = 'orders';
