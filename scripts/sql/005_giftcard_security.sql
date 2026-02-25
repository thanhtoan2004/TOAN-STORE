-- Add failed_attempts and lock status to gift_cards table
ALTER TABLE `gift_cards`
ADD COLUMN `failed_attempts` INT DEFAULT 0 AFTER `status`;

-- Modify status enum to include 'locked'
ALTER TABLE `gift_cards` 
MODIFY COLUMN `status` enum('active','inactive','expired','used','locked') DEFAULT 'active';

-- Create table to track brute force attempts per IP and card
CREATE TABLE `gift_card_lockouts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `card_number` varchar(16) DEFAULT NULL,
  `attempt_count` int DEFAULT 1,
  `last_attempt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_last_attempt` (`ip_address`, `last_attempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
