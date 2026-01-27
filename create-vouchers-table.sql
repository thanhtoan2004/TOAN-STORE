-- Create vouchers table for gift codes and referral rewards
DROP TABLE IF EXISTS `vouchers`;

CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL UNIQUE COMMENT 'Unique voucher code',
  `value` decimal(12,2) NOT NULL COMMENT 'Credit value of voucher',
  `discount_type` enum('fixed','percent') DEFAULT 'fixed' COMMENT 'fixed for credits, percent not used',
  `description` varchar(255) DEFAULT NULL,
  `issued_by_user_id` bigint unsigned DEFAULT NULL COMMENT 'Admin who created it',
  `recipient_user_id` bigint unsigned DEFAULT NULL COMMENT 'Specific user if personalized',
  `redeemed_by_user_id` bigint unsigned DEFAULT NULL COMMENT 'User who claimed it',
  `status` enum('active','inactive','redeemed','expired') DEFAULT 'active',
  `valid_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` timestamp NULL DEFAULT NULL,
  `redeemed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `recipient_user_id` (`recipient_user_id`),
  KEY `redeemed_by_user_id` (`redeemed_by_user_id`),
  KEY `status` (`status`),
  CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_2` FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample vouchers
INSERT INTO vouchers (code, value, description, status, valid_until) VALUES
('GIFT2024-001', 100000, 'Gift code $100k credits', 'active', '2026-12-31 23:59:59'),
('REF-SIGN100', 50000, 'Referral sign up reward', 'active', '2026-12-31 23:59:59'),
('WELCOME-NEW', 200000, 'Welcome new customer', 'active', '2026-06-30 23:59:59');
