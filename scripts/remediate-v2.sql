-- =============================================================
-- TOAN STORE — Remediation Plan V2.0 Complete
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. IP Blocklist Table
DROP TABLE IF EXISTS `ip_blocklist`;
CREATE TABLE `ip_blocklist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `is_permanent` tinyint(1) DEFAULT '0',
  `blocked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`),
  KEY `idx_blocked_until` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Secure Gift Cards Table
DROP TABLE IF EXISTS `gift_cards`;
CREATE TABLE `gift_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_number_hash` varchar(255) NOT NULL,
  `card_number_last4` varchar(4) NOT NULL,
  `pin` varchar(255) NOT NULL,
  `initial_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'VND',
  `status` enum('active','inactive','expired','used','locked') DEFAULT 'active',
  `failed_attempts` int DEFAULT '0',
  `purchased_by` bigint unsigned DEFAULT NULL,
  `purchased_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_number_hash` (`card_number_hash`),
  KEY `purchased_by` (`purchased_by`),
  KEY `idx_card_last4` (`card_number_last4`),
  KEY `idx_gift_cards_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Update Users Table for Security
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `failed_login_attempts` int DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `lockout_until` timestamp NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `token_version` int DEFAULT '1',
  ADD INDEX IF NOT EXISTS `idx_token_version` (`id`,`token_version`);

-- [NOTE] PII Data (Phone Numbers) should be masked in seed files if not encrypted.
-- This script only ensures the SCHEMA is V2.0 compliant.

SET FOREIGN_KEY_CHECKS = 1;
