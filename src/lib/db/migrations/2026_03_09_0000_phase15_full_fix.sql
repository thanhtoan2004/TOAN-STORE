-- =============================================================================
-- Migration: Phase 15 — Full Audit Fix
-- Generated: 2026-03-09
-- Target DB: toan_store (MySQL 8.0+)
-- 
-- Issues addressed (7 groups):
--   [1] 🔴 CRITICAL  — Inventory triggers missing
--   [2] 🔴 CRITICAL  — orders.coupon_id missing FK + Index
--   [3] 🟠 HIGH      — users.email_encrypted VARCHAR(512) → TEXT
--   [4] 🟠 HIGH      — users.is_encrypted → rename to is_encrypted (unify)
--   [5] 🟡 MEDIUM    — payment_status backfill for delivered COD orders
--   [6] 🟡 MEDIUM    — product_embeddings collation sync
--   [7] 🟡 MEDIUM    — archive_admin_activity_logs missing FK
-- =============================================================================

-- Safety: stop on first error
SET sql_mode = 'STRICT_TRANS_TABLES,NO_AUTO_VALUE_ON_ZERO';

-- Disable FK checks during migration (re-enabled at end)
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- [1] 🔴 CRITICAL — Inventory Triggers
-- SECURITY.md documents these as the DB-level last line of defense.
-- The dump contained 0 triggers — restoring them now.
-- =============================================================================

DROP TRIGGER IF EXISTS `trg_inventory_before_insert`;
DROP TRIGGER IF EXISTS `trg_inventory_before_update`;

DELIMITER $$

-- Trigger 1: Block negative quantity on INSERT
CREATE TRIGGER `trg_inventory_before_insert`
BEFORE INSERT ON `inventory`
FOR EACH ROW
BEGIN
    -- Block negative quantity unless backorder is explicitly allowed
    IF NEW.allow_backorder = 0 AND NEW.quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: quantity cannot be negative when allow_backorder=0';
    END IF;

    -- Block reserved exceeding quantity (backorder items have no stock to reserve)
    IF NEW.reserved < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: reserved cannot be negative';
    END IF;

    IF NEW.allow_backorder = 0 AND NEW.reserved > NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: reserved cannot exceed quantity';
    END IF;
END$$

-- Trigger 2: Enforce quantity/reserved rules on every UPDATE
CREATE TRIGGER `trg_inventory_before_update`
BEFORE UPDATE ON `inventory`
FOR EACH ROW
BEGIN
    -- Block negative quantity unless backorder allowed
    IF NEW.allow_backorder = 0 AND NEW.quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: quantity cannot be negative when allow_backorder=0';
    END IF;

    -- Block negative reserved
    IF NEW.reserved < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: reserved cannot be negative';
    END IF;

    -- Block reserved > quantity only when backorder is off
    IF NEW.allow_backorder = 0 AND NEW.reserved > NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVENTORY_ERROR: reserved cannot exceed available quantity';
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- [2] 🔴 CRITICAL — orders.coupon_id: Add Index + Foreign Key
-- Currently: column exists, no index, no FK → orphaned records + slow JOINs
-- =============================================================================

-- =============================================================================
-- [2] 🔴 CRITICAL — orders.coupon_id: Add Index + Foreign Key
-- Currently: column exists, no index, no FK → orphaned records + slow JOINs
-- =============================================================================

-- Add index first (required before FK)
ALTER TABLE `orders`
    ADD KEY `idx_orders_coupon_id` (`coupon_id`);

-- Add FK (ON DELETE SET NULL — consistent with other discount FKs in this table)
ALTER TABLE `orders`
    ADD CONSTRAINT `fk_orders_coupon_id`
    FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`)
    ON DELETE SET NULL;

-- =============================================================================
-- [3] 🟠 HIGH — users.email_encrypted: VARCHAR(512) → TEXT
-- AES-256-GCM format IV:AUTH_TAG:CIPHERTEXT can exceed 512 chars for long emails.
-- All other encrypted columns (phone_encrypted, address_encrypted) are TEXT.
-- =============================================================================

ALTER TABLE `users`
    MODIFY COLUMN `email_encrypted` TEXT DEFAULT NULL
    COMMENT 'AES-256-GCM encrypted email. Format: IV:AUTH_TAG:CIPHERTEXT';

-- =============================================================================
-- [4] 🟠 HIGH — users.is_encrypted → is_encrypted
-- All other tables (orders, user_addresses) use `is_encrypted` as the unified
-- flag. `users` alone uses `is_encrypted` which is confusing and
-- inconsistently named.
-- =============================================================================

ALTER TABLE `users`
    CHANGE COLUMN `is_encrypted` `is_encrypted` TINYINT(1) DEFAULT '0'
    COMMENT 'Unified encryption flag: 1 = all PII columns are AES-256-GCM encrypted';

-- =============================================================================
-- [5] 🟡 MEDIUM — Backfill payment_status for delivered COD orders
-- 10 delivered orders with payment_method='cod' still have payment_status='pending'.
-- For COD, delivery = payment received. These are historical data inconsistencies.
-- =============================================================================

UPDATE `orders`
SET
    `payment_status` = 'paid'
WHERE
    `status` = 'delivered'
    AND `payment_method` IN ('cod', 'Thanh toán khi nhận hàng')
    AND `payment_status` = 'pending';

-- =============================================================================
-- [6] 🟡 MEDIUM — product_embeddings: Collation sync
-- Table uses utf8mb4_unicode_ci while entire schema uses utf8mb4_0900_ai_ci.
-- Inconsistent collation causes implicit conversion on JOINs.
-- =============================================================================

ALTER TABLE `product_embeddings`
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- =============================================================================
-- [7] 🟡 MEDIUM — archive_admin_activity_logs: Add missing FK
-- This archive table mirrors admin_activity_logs but has no FK on admin_user_id.
-- Adding FK with ON DELETE CASCADE to match the source table behavior.
-- =============================================================================

-- First ensure index exists (required for FK)
ALTER TABLE `archive_admin_activity_logs`
    ADD KEY `fk_archive_admin_user` (`admin_user_id`);

ALTER TABLE `archive_admin_activity_logs`
    ADD CONSTRAINT `fk_archive_admin_user_id`
    FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`)
    ON DELETE CASCADE;

-- =============================================================================
-- [8] 🟡 MEDIUM — Standardization of lockout_until names
-- gift_card_lockouts uses locked_until, while users uses lockout_until.
-- Standardizing to lockout_until to match the schema.ts expectations.
-- =============================================================================

ALTER TABLE `gift_card_lockouts`
    CHANGE COLUMN `locked_until` `lockout_until` TIMESTAMP NULL DEFAULT NULL;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
