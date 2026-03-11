-- =============================================================
-- TOAN STORE — Complete Remediated Database
-- Version  : 2.0
-- Date     : 2026-03-07
-- Changes  :
--   [SEC-01] Removed placeholder password for manager account
--   [SEC-02] Masked gift card numbers (last4 + SHA2 hash)
--   [SEC-03] Added ip_blocklist table for brute-force protection
--   [SEC-04] Added token_version index on users
--   [HYG-01] Purged all TEST-* / test_verification data
--   [HYG-02] Purged test users (id 6-34 except real accounts)
--   [ARC-01] Added order_shipping_details table (Phase-1 split)
--   [ARC-02] Added order_payment_details table  (Phase-1 split)
--   [ARC-03] Added orders_full VIEW for backward compatibility
--   [ARC-04] Added user_roles junction table + backfill
--   [ARC-05] Added daily_metrics trigger
--   [ARC-06] Added missing CHECK constraints on prices / totals
--   [ARC-07] Added inventory SELECT FOR UPDATE pattern docs
--   [CON-01] Unified migration file naming convention noted
-- =============================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- =============================================================
-- TABLE: _migrations
-- =============================================================
DROP TABLE IF EXISTS `_migrations`;
CREATE TABLE `_migrations` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `executed_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `_migrations` WRITE;
INSERT INTO `_migrations` VALUES
  (1,  '20251206_000001_baseline.sql',                     '2026-02-13 07:03:50'),
  (2,  '20251206_000002_create_warehouses_table.sql',       '2026-02-13 07:06:12'),
  (3,  '20251206_000003_add_inventory_column.sql',          '2026-02-13 07:08:54'),
  (4,  '20251206_000004_update_inventory_data.sql',         '2026-02-13 07:08:54'),
  (5,  '20260215_000005_auth_support.sql',                  '2026-02-15 12:20:10'),
  (6,  '20260215_000006_roles_permissions.sql',             '2026-02-15 12:20:10'),
  (7,  '20260306_000007_phase1_low_risk.sql',               '2026-03-06 06:43:13'),
  (8,  '20260306_000008_phase2_auth_support.sql',           '2026-03-06 07:02:00'),
  (9,  '20260306_000009_phase3_high_risk.sql',              '2026-03-06 07:04:13'),
  (10, '20260306_000010_phase4_cleanup.sql',                '2026-03-06 10:02:47'),
  (11, '20260306_000011_final_optimization_seed.sql',       '2026-03-06 13:42:19'),
  (12, '20260307_000012_v2_security_arch_remediation.sql',  '2026-03-07 00:00:00');
UNLOCK TABLES;

-- =============================================================
-- TABLE: roles
-- =============================================================
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)    NOT NULL,
  `description` VARCHAR(255)    DEFAULT NULL,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `roles` WRITE;
INSERT INTO `roles` VALUES
  (1, 'customer',    'Regular customer',                  '2025-12-06 14:11:35', '2025-12-06 14:11:35'),
  (2, 'vip',         'VIP customer with special privileges','2025-12-06 14:11:35','2025-12-06 14:11:35'),
  (3, 'admin',       'Administrator with full access',     '2025-12-06 14:11:35','2025-12-06 14:11:35'),
  (4, 'super_admin', 'Full access to all systems',         '2026-02-15 12:13:48','2026-02-15 12:13:48'),
  (5, 'manager',     'Manage inventory and orders',        '2026-02-15 12:13:48','2026-02-15 12:13:48'),
  (6, 'staff',       'View and update status',             '2026-02-15 12:13:48','2026-02-15 12:13:48'),
  (7, 'support',     'Customer chat and basic viewing',    '2026-02-15 12:13:48','2026-02-15 12:13:48');
UNLOCK TABLES;

-- =============================================================
-- TABLE: permissions
-- =============================================================
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150)    NOT NULL,
  `description` VARCHAR(255)    DEFAULT NULL,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `permissions` WRITE;
INSERT INTO `permissions` VALUES
  (1,  'view_products',    'Can view products',                        '2025-12-06 14:11:35'),
  (2,  'purchase_products','Can purchase products',                     '2025-12-06 14:11:35'),
  (3,  'manage_products',  'Can create, update, delete products',       '2025-12-06 14:11:35'),
  (4,  'manage_orders',    'Can manage all orders',                     '2025-12-06 14:11:35'),
  (5,  'manage_users',     'Can manage users',                          '2025-12-06 14:11:35'),
  (6,  'view_reports',     'Can view sales and analytics reports',      '2025-12-06 14:11:35'),
  (7,  'all',              'Master permission',                         '2026-02-15 12:13:48'),
  (8,  'read:users',       'View admin and customer users',             '2026-02-15 12:13:48'),
  (9,  'write:users',      'Create/Edit users',                         '2026-02-15 12:13:48'),
  (10, 'delete:users',     'Delete users',                              '2026-02-15 12:13:48'),
  (11, 'manage:inventory', 'Full inventory management',                 '2026-02-15 12:13:48'),
  (12, 'manage:orders',    'Full order management',                     '2026-02-15 12:13:48'),
  (13, 'view:analytics',   'View business metrics',                     '2026-02-15 12:13:48');
UNLOCK TABLES;

-- =============================================================
-- TABLE: role_permission
-- =============================================================
DROP TABLE IF EXISTS `role_permission`;
CREATE TABLE `role_permission` (
  `role_id`       BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permission_ibfk_1` FOREIGN KEY (`role_id`)       REFERENCES `roles`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permission_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `role_permission` WRITE;
INSERT INTO `role_permission` VALUES
  (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),
  (3,3),(3,4),(3,5),(3,6),(4,7);
UNLOCK TABLES;

-- =============================================================
-- TABLE: admin_users
-- NOTE [SEC-01]: manager account with placeholder password REMOVED.
--   Add it back via `npm run seed:admin` with a real password.
-- =============================================================
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(100)    NOT NULL,
  `email`      VARCHAR(255)    NOT NULL,
  `password`   VARCHAR(255)    NOT NULL,
  `full_name`  VARCHAR(255)    DEFAULT NULL,
  `is_active`  TINYINT(1)      DEFAULT '1',
  `last_login` TIMESTAMP       NULL DEFAULT NULL,
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role_id`    BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email`    (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `admin_users` WRITE;
-- [SEC-01] Only 1 seed admin. All other staff added via seed script.
INSERT INTO `admin_users` VALUES
  (1,'admin','admin@toanstore.com','$2b$10$CTpJGqihD7OewkHcHf8rXuvQ/uLWlC3Imm6AoMpIv06db78INhiWi',
   'System Administrator',1,NULL,'2025-12-06 14:11:35','2026-02-15 12:29:37',4);
UNLOCK TABLES;

-- =============================================================
-- TABLE: users
-- NOTE [HYG-02]: All test_verification_* and testuser_* accounts removed.
-- =============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`                 VARCHAR(255)    NOT NULL,
  `password`              VARCHAR(255)    DEFAULT NULL,
  `first_name`            VARCHAR(100)    DEFAULT NULL,
  `last_name`             VARCHAR(100)    DEFAULT NULL,
  `full_name`             VARCHAR(255)    DEFAULT NULL,
  `phone`                 VARCHAR(255)    DEFAULT NULL,
  `phone_encrypted`       TEXT,
  `date_of_birth`         DATE            DEFAULT NULL,
  `date_of_birth_encrypted` TEXT,
  `is_encrypted`          TINYINT(1)      DEFAULT '0',
  `gender`                ENUM('male','female','other') DEFAULT NULL,
  `is_active`             TINYINT(1)      DEFAULT '1',
  `is_verified`           TINYINT(1)      DEFAULT '0',
  `meta`                  JSON            DEFAULT NULL,
  `created_at`            TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_banned`             TINYINT(1)      DEFAULT '0',
  `membership_tier`       ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `deleted_at`            TIMESTAMP       NULL DEFAULT NULL,
  `google_id`             VARCHAR(255)    DEFAULT NULL,
  `facebook_id`           VARCHAR(255)    DEFAULT NULL,
  `avatar_url`            VARCHAR(1000)   DEFAULT NULL,
  `failed_login_attempts` INT             DEFAULT '0',
  `lockout_until`         TIMESTAMP       NULL DEFAULT NULL,
  `token_version`         INT             DEFAULT '1',
  `two_factor_enabled`    TINYINT(1)      DEFAULT '0',
  `email_notifications`   TINYINT(1)      DEFAULT '1',
  `sms_notifications`     TINYINT(1)      DEFAULT '0',
  `push_notifications`    TINYINT(1)      DEFAULT '1',
  `promo_notifications`   TINYINT(1)      DEFAULT '0',
  `order_notifications`   TINYINT(1)      DEFAULT '1',
  `data_persistence`      TINYINT(1)      DEFAULT '1',
  `public_profile`        TINYINT(1)      DEFAULT '1',
  `sms_order_notifications` TINYINT(1)    DEFAULT '0',
  `lifetime_points`       INT             NOT NULL DEFAULT '0',
  `available_points`      INT             NOT NULL DEFAULT '0',
  `tier_updated_at`       DATETIME        DEFAULT NULL,
  `points_expiry_date`    DATE            DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email`       (`email`),
  UNIQUE KEY `google_id`   (`google_id`),
  UNIQUE KEY `facebook_id` (`facebook_id`),
  KEY `idx_is_banned`      (`is_banned`),
  KEY `idx_deleted_at`     (`deleted_at`),
  KEY `idx_is_encrypted`   (`is_encrypted`),
  KEY `idx_email_verified` (`email`,`is_verified`),
  KEY `idx_active_created` (`is_active`,`created_at` DESC),
  KEY `idx_users_tier`     (`membership_tier`),
  KEY `idx_users_lifetime` (`lifetime_points`),
  KEY `idx_tier_points`    (`membership_tier`,`lifetime_points` DESC),
  -- [SEC-04] Index for JWT token invalidation lookups
  KEY `idx_token_version`  (`id`,`token_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES
  (1,'thanhtoan06092004@gmail.com','$2b$10$nLRY6Uyu.3TgJzUP2GuyG.U7c1uVa0C4hFBMfw8hzWubSVRO7vZti',
   'TOAN','DANG','DANG TOAN','***',
   'bd041ef4cf217505728fdf70ec81f3a4:c92d4421cff5f64fd973efa865df1153:663c8776dd7e66e403d8',
   '2004-09-06',
   '45cb8f955c939db557bac47062cfa35e:0cca5d556fb0f82da3e96b316bf8f73b43fc485757eb8373942d0c08dd0c75a9',
   1,'male',1,0,
   '{"gender":"male","dateOfBirth":"2004-09-06"}',
   '2025-12-06 14:42:48','2026-03-06 04:51:28',
   0,'silver',NULL,NULL,NULL,
   'https://res.cloudinary.com/dbhfn2hqs/image/upload/v1772334121/nike-clone/products/qs2iayd7nebiv26grp9h.jpg',
   0,NULL,2,0,1,1,1,1,1,1,1,1,2447,2397,NULL,NULL),

  (2,'dangthanhtoan06092004@gmail.com','$2b$10$ckcKXxzPwAkzxq/qhxNeKOMM4MBJbkyBRTe3D.FpPB28Ux4OTbm2S',
   'DANG','TOAN',NULL,'***',
   '1d75fbce47802ae6e58172865e570e4d:f1663a5b955d8f5e8f24d9f8c79dc1a50ef796009453de3b72685186b2fbb990',
   '2004-09-06',
   'a23907ae38e4b138d8739e78a4496df0:87ce800b207ee81cf1bc00968eb1504d3ef42257454217ef24ce299726cc0270',
   1,'male',1,0,NULL,
   '2025-12-08 01:37:41','2026-03-02 03:12:16',
   0,'bronze',NULL,NULL,NULL,NULL,0,NULL,1,0,1,0,1,0,1,1,1,0,0,0,NULL,NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: user_roles  [ARC-04] NEW — customer role junction
-- =============================================================
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `role_id`     BIGINT UNSIGNED NOT NULL,
  `assigned_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `user_roles` WRITE;
-- Backfill: all existing users get 'customer' role (id=1)
INSERT INTO `user_roles` VALUES (1,1,'2025-12-06 14:42:48'),(2,1,'2025-12-08 01:37:41');
UNLOCK TABLES;

-- =============================================================
-- TABLE: ip_blocklist  [SEC-03] NEW
-- =============================================================
DROP TABLE IF EXISTS `ip_blocklist`;
CREATE TABLE `ip_blocklist` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address`    VARCHAR(45)     NOT NULL,
  `blocked_until` TIMESTAMP       NOT NULL,
  `reason`        VARCHAR(255)    DEFAULT NULL,
  `is_permanent`  TINYINT(1)      DEFAULT '0',
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`),
  KEY `idx_blocked_until` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- No seed data needed

-- =============================================================
-- TABLE: brands
-- =============================================================
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)    NOT NULL,
  `slug`        VARCHAR(255)    DEFAULT NULL,
  `description` TEXT,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `brands` WRITE;
INSERT INTO `brands` VALUES
  (1,'Nike',   'nike',    'Just Do It',         '2025-12-06 14:11:35'),
  (2,'Jordan', 'jordan',  'Air Jordan Brand',   '2025-12-06 14:11:35'),
  (3,'Nike SB','nike-sb', 'Nike Skateboarding', '2025-12-06 14:11:35');
UNLOCK TABLES;

-- =============================================================
-- TABLE: sports
-- =============================================================
DROP TABLE IF EXISTS `sports`;
CREATE TABLE `sports` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)    NOT NULL,
  `slug`        VARCHAR(255)    NOT NULL,
  `description` TEXT,
  `image_url`   VARCHAR(1000)   DEFAULT NULL,
  `is_active`   TINYINT(1)      DEFAULT '1',
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `sports` WRITE;
INSERT INTO `sports` VALUES
  (1,'Running',       'running',       'Running shoes and gear',        NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (2,'Basketball',    'basketball',    'Basketball shoes and apparel',  NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (3,'Training & Gym','training',      'Training and gym gear',         NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (4,'Football',      'football',      'Football boots and kits',       NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (5,'Tennis',        'tennis',        'Tennis shoes and apparel',      NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (6,'Yoga',          'yoga',          'Yoga and lifestyle apparel',    NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),
  (7,'Skateboarding', 'skateboarding', 'Skateboarding shoes and gear',  NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51');
UNLOCK TABLES;

-- =============================================================
-- TABLE: categories
-- =============================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id`        BIGINT UNSIGNED DEFAULT NULL,
  `name`             VARCHAR(200)    NOT NULL,
  `slug`             VARCHAR(255)    NOT NULL,
  `description`      TEXT,
  `image_url`        VARCHAR(1000)   DEFAULT NULL,
  `position`         INT             DEFAULT '0',
  `is_active`        TINYINT(1)      DEFAULT '1',
  `meta_title`       VARCHAR(255)    DEFAULT NULL,
  `meta_description` TEXT,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at`       TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id`      (`parent_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `categories` WRITE;
INSERT INTO `categories` VALUES
  (1,NULL,'Running',   'running',    'Running shoes and apparel', NULL,1,1,NULL,NULL,'2025-12-06 14:11:35',NULL),
  (2,NULL,'Basketball','basketball', 'Basketball shoes and gear', NULL,2,1,NULL,NULL,'2025-12-06 14:11:35',NULL),
  (3,NULL,'Training',  'training',   'Training and gym equipment',NULL,3,1,NULL,NULL,'2025-12-06 14:11:35',NULL),
  (4,NULL,'Lifestyle', 'lifestyle',  'Casual and lifestyle products',NULL,4,1,NULL,NULL,'2025-12-06 14:11:35',NULL),
  (5,NULL,'Jordan',    'jordan',     'Air Jordan collection',     NULL,5,1,NULL,NULL,'2025-12-06 14:11:35',NULL),
  (6,NULL,'Football',  'football',   'Football boots and equipment',NULL,6,1,NULL,NULL,'2025-12-06 14:11:35',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: collections
-- =============================================================
DROP TABLE IF EXISTS `collections`;
CREATE TABLE `collections` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)    NOT NULL,
  `slug`        VARCHAR(255)    DEFAULT NULL,
  `description` TEXT,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `collections` WRITE;
INSERT INTO `collections` VALUES
  (1,'Air Max',  'air-max',   'Air Max collection',      '2025-12-06 14:11:35'),
  (2,'Air Force','air-force', 'Air Force collection',    '2025-12-06 14:11:35'),
  (3,'Dunk',     'dunk',      'Nike Dunk collection',    '2025-12-06 14:11:35'),
  (4,'Pegasus',  'pegasus',   'Pegasus running collection','2025-12-06 14:11:35');
UNLOCK TABLES;

-- =============================================================
-- TABLE: attributes / attribute_values / category_attributes
-- =============================================================
DROP TABLE IF EXISTS `attributes`;
CREATE TABLE `attributes` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)    NOT NULL,
  `slug`          VARCHAR(100)    NOT NULL,
  `type`          ENUM('text','number','select','color','boolean') DEFAULT 'text',
  `is_filterable` TINYINT(1)      DEFAULT '1',
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `attribute_values`;
CREATE TABLE `attribute_values` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attribute_id` BIGINT UNSIGNED NOT NULL,
  `value`        VARCHAR(255)    NOT NULL,
  `label`        VARCHAR(255)    DEFAULT NULL,
  `position`     INT             DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `category_attributes`;
CREATE TABLE `category_attributes` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`   BIGINT UNSIGNED NOT NULL,
  `name`          VARCHAR(200)    NOT NULL,
  `input_type`    VARCHAR(50)     DEFAULT 'text',
  `is_filterable` TINYINT(1)      DEFAULT '0',
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `category_attributes_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: products
-- [ARC-06] Added CHECK constraints on prices
-- =============================================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku`              VARCHAR(100)    DEFAULT NULL,
  `name`             VARCHAR(500)    NOT NULL,
  `slug`             VARCHAR(512)    NOT NULL,
  `short_description` TEXT,
  `description`      LONGTEXT,
  `brand_id`         BIGINT UNSIGNED DEFAULT NULL,
  `category_id`      BIGINT UNSIGNED DEFAULT NULL,
  `collection_id`    BIGINT UNSIGNED DEFAULT NULL,
  `base_price`       DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `retail_price`     DECIMAL(12,2)   DEFAULT NULL,
  `cost_price`       DECIMAL(12,2)   DEFAULT '0.00',
  `is_active`        TINYINT(1)      DEFAULT '1',
  `is_featured`      TINYINT(1)      DEFAULT '0',
  `is_new_arrival`   TINYINT(1)      DEFAULT '0',
  `view_count`       INT             DEFAULT '0',
  `sale_count`       INT             DEFAULT '0',
  `meta_title`       VARCHAR(255)    DEFAULT NULL,
  `meta_description` TEXT,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sport_id`         BIGINT UNSIGNED DEFAULT NULL,
  `deleted_at`       TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku`  (`sku`),
  KEY `brand_id`      (`brand_id`),
  KEY `category_id`   (`category_id`),
  KEY `collection_id` (`collection_id`),
  KEY `idx_sku`       (`sku`),
  KEY `idx_slug`      (`slug`),
  KEY `fk_product_sport`          (`sport_id`),
  KEY `idx_deleted_at`            (`deleted_at`),
  KEY `idx_category_active_created` (`category_id`,`is_active`,`created_at` DESC),
  KEY `idx_featured_active`       (`is_featured`,`is_active`),
  KEY `idx_brand_active`          (`brand_id`,`is_active`),
  KEY `idx_new_arrival_created`   (`is_new_arrival`,`created_at` DESC),
  FULLTEXT KEY `idx_fts_product`  (`name`,`sku`,`description`),
  CONSTRAINT `fk_product_sport`   FOREIGN KEY (`sport_id`)     REFERENCES `sports`      (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_1`    FOREIGN KEY (`brand_id`)     REFERENCES `brands`      (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2`    FOREIGN KEY (`category_id`)  REFERENCES `categories`  (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3`    FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE SET NULL,
  -- [ARC-06]
  CONSTRAINT `chk_products_base_price_positive`   CHECK (`base_price`   >= 0),
  CONSTRAINT `chk_products_retail_price_positive` CHECK (`retail_price` >= 0 OR `retail_price` IS NULL),
  CONSTRAINT `chk_products_cost_price_positive`   CHECK (`cost_price`   >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `products` WRITE;
INSERT INTO `products` VALUES
  (1,'NK-AM270-BLK','Nike Air Max 270','nike-air-max-270-black',
   'Comfortable all-day wear',
   'The Nike Air Max 270 is inspired by two icons of big Air: the Air Max 180 and Air Max 93. It features Nike\'s biggest heel Air unit yet for a super-soft ride.',
   1,4,1,3829000.00,4500000.00,0.00,1,0,1,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-28 14:27:29',NULL,NULL),
  (2,'NK-AF1-WHT','Nike Air Force 1 \'07','nike-air-force-1-07-white',
   'Classic basketball style',
   'The radiance lives on in the Nike Air Force 1 \'07, the basketball original that puts a fresh spin on what you know best.',
   1,4,2,2929000.00,3500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),
  (3,'NK-PEG40','Nike Pegasus 40','nike-pegasus-40',
   'Running made responsive',
   'A springy ride for every run, the Peg\'s familiar, just-for-you feel returns to help you accomplish your goals.',
   1,1,4,3519000.00,4200000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-10 08:38:18',1,NULL),
  (4,'JD-J1MID-BRD','Air Jordan 1 Mid','air-jordan-1-mid-bred',
   'Iconic basketball style',
   'Inspired by the original AJ1, this mid-top edition maintains the iconic look you love while choice colours and crisp leather give it a distinct identity.',
   2,2,NULL,3829000.00,4500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),
  (5,'JD-J4-WHT','Air Jordan 4 Retro','air-jordan-4-retro-white-cement',
   'Legendary performance',
   'The Air Jordan 4 Retro brings back the iconic design with premium materials and Air cushioning.',
   2,2,NULL,5589000.00,6500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),
  (6,'NK-DUNK-PND','Nike Dunk Low','nike-dunk-low-panda',
   'Streetwear classic',
   'Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colours.',
   1,4,3,2829000.00,3300000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-13 01:09:38',NULL,NULL),
  (7,'NK-MV16-ELT','Nike Mercurial Vapor 16 Elite','nike-mercurial-vapor-16-elite',
   '',
   'Obsessed with speed? That\'s why we made this Elite boot with an improved 3/4-length Air Zoom unit.',
   1,6,NULL,5855000.00,7319000.00,0.00,1,0,1,0,0,NULL,NULL,'2026-02-04 11:02:44','2026-02-04 14:04:31',NULL,NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: product_colors
-- =============================================================
DROP TABLE IF EXISTS `product_colors`;
CREATE TABLE `product_colors` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  BIGINT UNSIGNED NOT NULL,
  `color_name`  VARCHAR(100)    NOT NULL,
  `color_code`  VARCHAR(7)      DEFAULT NULL,
  `image_url`   VARCHAR(1000)   DEFAULT NULL,
  `position`    INT             DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `product_colors` WRITE;
INSERT INTO `product_colors` VALUES
  (1,1,'Black',       '#000000',NULL,0),
  (2,1,'White',       '#FFFFFF',NULL,0),
  (3,2,'White',       '#FFFFFF',NULL,0),
  (4,2,'Triple White','#FFFFFF',NULL,0);
UNLOCK TABLES;

-- =============================================================
-- TABLE: product_variants
-- [ARC-06] Added CHECK on price
-- =============================================================
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `sku`        VARCHAR(200)    DEFAULT NULL,
  `size`       VARCHAR(20)     DEFAULT NULL,
  `color_id`   BIGINT UNSIGNED DEFAULT NULL,
  `barcode`    VARCHAR(100)    DEFAULT NULL,
  `attributes` JSON            DEFAULT NULL,
  `price`      DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `weight`     DECIMAL(10,3)   DEFAULT '0.000',
  `height`     DECIMAL(10,3)   DEFAULT '0.000',
  `width`      DECIMAL(10,3)   DEFAULT '0.000',
  `depth`      DECIMAL(10,3)   DEFAULT '0.000',
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_product_id`  (`product_id`),
  KEY `idx_size`        (`size`),
  KEY `idx_product_size`  (`product_id`,`size`),
  KEY `idx_price`       (`price`),
  KEY `product_variants_ibfk_2` (`color_id`),
  KEY `idx_product_color` (`product_id`,`color_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_variants_ibfk_2` FOREIGN KEY (`color_id`)   REFERENCES `product_colors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_variant_price_non_negative` CHECK (`price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `product_variants` WRITE;
INSERT INTO `product_variants` VALUES
  -- Nike Air Max 270 (product 1) sizes 38-45
  (1,1,'NK-AM270-BLK-38','38',1,NULL,'{"size":"38"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (2,1,'NK-AM270-BLK-39','39',1,NULL,'{"size":"39"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (3,1,'NK-AM270-BLK-40','40',1,NULL,'{"size":"40"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (4,1,'NK-AM270-BLK-41','41',1,NULL,'{"size":"41"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (5,1,'NK-AM270-BLK-42','42',1,NULL,'{"size":"42"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (6,1,'NK-AM270-BLK-43','43',1,NULL,'{"size":"43"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (7,1,'NK-AM270-BLK-44','44',1,NULL,'{"size":"44"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (8,1,'NK-AM270-BLK-45','45',1,NULL,'{"size":"45"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Air Force 1 (product 2) sizes 38-45
  (9, 2,'NK-AF1-WHT-38','38',NULL,NULL,'{"size":"38"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (10,2,'NK-AF1-WHT-39','39',NULL,NULL,'{"size":"39"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (11,2,'NK-AF1-WHT-40','40',NULL,NULL,'{"size":"40"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (12,2,'NK-AF1-WHT-41','41',NULL,NULL,'{"size":"41"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (13,2,'NK-AF1-WHT-42','42',NULL,NULL,'{"size":"42"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (14,2,'NK-AF1-WHT-43','43',NULL,NULL,'{"size":"43"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (15,2,'NK-AF1-WHT-44','44',NULL,NULL,'{"size":"44"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (16,2,'NK-AF1-WHT-45','45',NULL,NULL,'{"size":"45"}',2929000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Pegasus 40 (product 3)
  (17,3,'NK-PEG40-38','38',NULL,NULL,'{"size":"38"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (18,3,'NK-PEG40-39','39',NULL,NULL,'{"size":"39"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (19,3,'NK-PEG40-40','40',NULL,NULL,'{"size":"40"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (20,3,'NK-PEG40-41','41',NULL,NULL,'{"size":"41"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (21,3,'NK-PEG40-42','42',NULL,NULL,'{"size":"42"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (22,3,'NK-PEG40-43','43',NULL,NULL,'{"size":"43"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (23,3,'NK-PEG40-44','44',NULL,NULL,'{"size":"44"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (24,3,'NK-PEG40-45','45',NULL,NULL,'{"size":"45"}',3519000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Jordan 1 Mid (product 4)
  (25,4,'JD-J1MID-BRD-38','38',NULL,NULL,'{"size":"38"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (26,4,'JD-J1MID-BRD-39','39',NULL,NULL,'{"size":"39"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (27,4,'JD-J1MID-BRD-40','40',NULL,NULL,'{"size":"40"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (28,4,'JD-J1MID-BRD-41','41',NULL,NULL,'{"size":"41"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (29,4,'JD-J1MID-BRD-42','42',NULL,NULL,'{"size":"42"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (30,4,'JD-J1MID-BRD-43','43',NULL,NULL,'{"size":"43"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (31,4,'JD-J1MID-BRD-44','44',NULL,NULL,'{"size":"44"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (32,4,'JD-J1MID-BRD-45','45',NULL,NULL,'{"size":"45"}',3829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Jordan 4 (product 5)
  (33,5,'JD-J4-WHT-38','38',NULL,NULL,'{"size":"38"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (34,5,'JD-J4-WHT-39','39',NULL,NULL,'{"size":"39"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (35,5,'JD-J4-WHT-40','40',NULL,NULL,'{"size":"40"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (36,5,'JD-J4-WHT-41','41',NULL,NULL,'{"size":"41"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (37,5,'JD-J4-WHT-42','42',NULL,NULL,'{"size":"42"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (38,5,'JD-J4-WHT-43','43',NULL,NULL,'{"size":"43"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (39,5,'JD-J4-WHT-44','44',NULL,NULL,'{"size":"44"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (40,5,'JD-J4-WHT-45','45',NULL,NULL,'{"size":"45"}',5589000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Dunk Low (product 6)
  (41,6,'NK-DUNK-PND-38','38',NULL,NULL,'{"size":"38"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (42,6,'NK-DUNK-PND-39','39',NULL,NULL,'{"size":"39"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (43,6,'NK-DUNK-PND-40','40',NULL,NULL,'{"size":"40"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (44,6,'NK-DUNK-PND-41','41',NULL,NULL,'{"size":"41"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (45,6,'NK-DUNK-PND-42','42',NULL,NULL,'{"size":"42"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (46,6,'NK-DUNK-PND-43','43',NULL,NULL,'{"size":"43"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (47,6,'NK-DUNK-PND-44','44',NULL,NULL,'{"size":"44"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  (48,6,'NK-DUNK-PND-45','45',NULL,NULL,'{"size":"45"}',2829000.00,0,0,0,0,'2025-12-06 14:11:35'),
  -- Mercurial Vapor 16 (product 7)
  (64,7,NULL,'38',NULL,NULL,NULL,0.00,0,0,0,0,'2026-02-04 13:58:24'),
  (65,7,NULL,'39',NULL,NULL,NULL,0.00,0,0,0,0,'2026-02-04 13:59:36'),
  (66,7,NULL,'40',NULL,NULL,NULL,0.00,0,0,0,0,'2026-02-04 14:00:15'),
  (67,7,NULL,'41',NULL,NULL,NULL,0.00,0,0,0,0,'2026-02-04 14:00:32'),
  (68,7,NULL,'42',NULL,NULL,NULL,0.00,0,0,0,0,'2026-02-04 14:00:45');
UNLOCK TABLES;

-- =============================================================
-- TABLE: product_images
-- =============================================================
DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `color_id`   BIGINT UNSIGNED DEFAULT NULL,
  `url`        VARCHAR(1000)   NOT NULL,
  `media_type` ENUM('image','video') NOT NULL DEFAULT 'image',
  `alt_text`   VARCHAR(255)    DEFAULT NULL,
  `position`   INT             DEFAULT '0',
  `is_main`    TINYINT(1)      DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `product_id`               (`product_id`),
  KEY `fk_product_images_color`  (`color_id`),
  KEY `idx_product_images_main`  (`product_id`,`is_main`),
  CONSTRAINT `fk_product_images_color` FOREIGN KEY (`color_id`)   REFERENCES `product_colors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_images_ibfk_1`   FOREIGN KEY (`product_id`) REFERENCES `products`       (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `product_images` WRITE;
INSERT INTO `product_images` VALUES
  (1, 1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/awjogtdnqxniqqk0wpgf/AIR+MAX+270.png','image','Nike Air Max 270',0,1),
  (17,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/zohr1uagxkvngypyrsg6/AIR+MAX+270.png','image','Nike Air Max 270',1,0),
  (18,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/sdxif37re9xkdk2d7q0o/AIR+MAX+270.png','image','Nike Air Max 270',2,0),
  (19,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/pog7ksulvzectpug6r9j/AIR+MAX+270.png','image','Nike Air Max 270',3,0),
  (3, 2,NULL,'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-force-1-07-shoes-WrLlWX.png','image','Nike Air Force 1 - Main View',0,1),
  (4, 2,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto/a0a300da-2e16-4483-ba64-9815cf0598ac/AIR+FORCE+1+%2707.png','image','Nike Air Force 1 - Side View',1,0),
  (5, 3,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/20ec15db-5080-40e3-9b1f-8af886de0f1c/AIR+ZOOM+PEGASUS+41.png','image','Nike Pegasus 40 - Main View',0,1),
  (6, 4,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/9dbb19ec-29e0-428f-b6e0-188d7ec8cc90/WMNS+AIR+JORDAN+1+MID.png','image','Air Jordan 1 Mid - Main View',0,1),
  (7, 5,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/964aa0e2-5f27-4ab4-93f6-9ee25b06bf26/AIR+JORDAN+4+RETRO+%28GS%29.png','image','Air Jordan 4 Retro - Main View',0,1),
  (8, 6,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/1834a673-dfc2-401a-8afa-9ea20abc26c5/W+NIKE+DUNK+LOW.png','image','Nike Dunk Low',0,1),
  (9, 7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/4b3f60af-4f98-4b97-8e67-401e656d5601/ZM+VAPOR+16+ELITE+FG.png','image',NULL,0,1),
  (10,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b849691a-dc3c-4d2b-83a9-93fad27c7dba/ZM+VAPOR+16+ELITE+FG.png','image',NULL,1,0),
  (11,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/17e73dac-b75c-44cf-9274-02b1731f7ee5/ZM+VAPOR+16+ELITE+FG.png','image',NULL,2,0),
  (12,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/ef17a870-8a47-4a90-8a96-910e451b2b1a/ZM+VAPOR+16+ELITE+FG.png','image',NULL,3,0);
UNLOCK TABLES;

-- =============================================================
-- TABLE: product_attribute_values / product_attributes
-- =============================================================
DROP TABLE IF EXISTS `product_attribute_values`;
CREATE TABLE `product_attribute_values` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`   BIGINT UNSIGNED NOT NULL,
  `attribute_id` BIGINT UNSIGNED NOT NULL,
  `value_text`   TEXT,
  `value_id`     BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product`   (`product_id`),
  KEY `idx_attribute` (`attribute_id`),
  KEY `option_id`     (`value_id`),
  CONSTRAINT `pav_ibfk_1` FOREIGN KEY (`product_id`)   REFERENCES `products`         (`id`) ON DELETE CASCADE,
  CONSTRAINT `pav_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`        (`id`) ON DELETE CASCADE,
  CONSTRAINT `pav_ibfk_3` FOREIGN KEY (`value_id`)     REFERENCES `attribute_values`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `product_attributes`;
CREATE TABLE `product_attributes` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`   BIGINT UNSIGNED NOT NULL,
  `attribute_id` BIGINT UNSIGNED NOT NULL,
  `value`        VARCHAR(500)    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id`   (`product_id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `product_attributes_ibfk_1` FOREIGN KEY (`product_id`)   REFERENCES `products`           (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `category_attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: product_gender_categories
-- =============================================================
DROP TABLE IF EXISTS `product_gender_categories`;
CREATE TABLE `product_gender_categories` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `gender`     ENUM('men','women','unisex','kids','boys','girls') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gender`     (`gender`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `pgc_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: product_embeddings
-- NOTE: Lưu trữ tạm thời dạng JSON. TODO [ARC]: migrate sang
--       pgvector hoặc dedicated vector store (Pinecone / Weaviate).
-- =============================================================
DROP TABLE IF EXISTS `product_embeddings`;
CREATE TABLE `product_embeddings` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `embedding`  JSON            NOT NULL,
  `updated_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `pe_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_embedding_size` CHECK (JSON_LENGTH(`embedding`) <= 1536)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TABLE: warehouses
-- =============================================================
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL,
  `location`   VARCHAR(255) DEFAULT NULL,
  `is_active`  TINYINT(1)   DEFAULT '1',
  `created_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `warehouses` WRITE;
INSERT INTO `warehouses` VALUES
  (1,'Kho Hà Nội (Main)','Hà Nội',        1,'2026-02-13 07:03:50','2026-02-13 07:03:50'),
  (2,'Kho TP.HCM',        'TP. Hồ Chí Minh',1,'2026-02-13 07:03:50','2026-02-13 07:03:50');
UNLOCK TABLES;

-- =============================================================
-- TABLE: inventory
-- NOTE [ARC-07]: Concurrent order flow MUST use SELECT ... FOR UPDATE
--   inside a transaction to prevent overselling.
--   Example:
--     START TRANSACTION;
--     SELECT quantity, reserved FROM inventory
--       WHERE product_variant_id = ? AND warehouse_id = ?
--       FOR UPDATE;
--     -- check quantity - reserved > 0 then UPDATE
--     COMMIT;
-- =============================================================
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_variant_id`    BIGINT UNSIGNED NOT NULL,
  `warehouse_id`          BIGINT UNSIGNED DEFAULT NULL,
  `quantity`              INT             NOT NULL DEFAULT '0',
  `reserved`              INT             NOT NULL DEFAULT '0',
  `updated_at`            TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `low_stock_threshold`   INT             DEFAULT '10',
  `allow_backorder`       TINYINT         DEFAULT '0',
  `expected_restock_date` TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_variant_warehouse` (`product_variant_id`,`warehouse_id`),
  KEY `idx_variant`            (`product_variant_id`),
  KEY `idx_quantity`           (`quantity`),
  KEY `idx_warehouse_quantity` (`warehouse_id`,`quantity`),
  KEY `idx_quantity_reserved`  (`quantity`,`reserved`),
  KEY `idx_variant_warehouse`  (`product_variant_id`,`warehouse_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_inventory_quantity_non_negative` CHECK (`quantity` >= 0),
  CONSTRAINT `chk_inventory_reserved_non_negative` CHECK (`reserved` >= 0),
  CONSTRAINT `chk_inventory_reserved_not_exceed`   CHECK (`reserved` <= `quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `inventory` WRITE;
INSERT INTO `inventory` VALUES
  (1, 1, 1,49,0,'2026-02-13 07:03:50',10,0,NULL),
  (2, 2, 1,45,0,'2026-02-13 07:03:50',10,0,NULL),
  (3, 3, 1,59,0,'2026-03-02 03:03:17',10,0,NULL),
  (4, 4, 1,55,0,'2026-02-13 07:03:50',10,0,NULL),
  (5, 5, 1,22,0,'2026-03-02 03:03:17',10,0,NULL),
  (6, 6, 1,40,0,'2026-02-13 07:03:50',10,0,NULL),
  (7, 7, 1,29,0,'2026-02-14 02:47:45',10,0,NULL),
  (8, 8, 1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (9, 9, 1,55,0,'2026-02-13 07:03:50',10,0,NULL),
  (10,10,1,50,0,'2026-02-13 07:03:50',10,0,NULL),
  (11,11,1,60,0,'2026-03-02 03:03:17',10,0,NULL),
  (12,12,1,60,0,'2026-02-13 07:03:50',10,0,NULL),
  (13,13,1,55,0,'2026-02-13 07:03:50',10,0,NULL),
  (14,14,1,45,0,'2026-02-13 07:03:50',10,0,NULL),
  (15,15,1,34,0,'2026-03-02 03:03:17',10,0,NULL),
  (16,16,1,15,0,'2026-03-02 03:03:17',10,0,NULL),
  (17,17,1,40,0,'2026-02-13 07:03:50',10,0,NULL),
  (18,18,1,35,0,'2026-02-13 07:03:50',10,0,NULL),
  (19,19,1,49,0,'2026-03-02 03:03:17',10,0,NULL),
  (20,20,1,45,0,'2026-02-13 07:03:50',10,0,NULL),
  (21,21,1,40,0,'2026-02-13 07:03:50',10,0,NULL),
  (22,22,1,30,0,'2026-02-13 07:03:50',10,0,NULL),
  (23,23,1,25,0,'2026-02-13 07:03:50',10,0,NULL),
  (24,24,1,15,0,'2026-02-13 07:03:50',10,0,NULL),
  (25,25,1,30,0,'2026-02-13 07:03:50',10,0,NULL),
  (26,26,1,24,0,'2026-03-02 03:03:17',10,0,NULL),
  (27,27,1,35,0,'2026-02-13 07:03:50',10,0,NULL),
  (28,28,1,30,0,'2026-02-13 07:03:50',10,0,NULL),
  (29,29,1,25,0,'2026-02-13 07:03:50',10,0,NULL),
  (30,30,1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (31,31,1,15,0,'2026-02-13 07:03:50',10,0,NULL),
  (32,32,1,10,0,'2026-02-13 07:03:50',10,0,NULL),
  (33,33,1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (34,34,1,18,0,'2026-02-13 07:03:50',10,0,NULL),
  (35,35,1,24,0,'2026-03-02 03:03:17',10,0,NULL),
  (36,36,1,22,0,'2026-02-13 07:03:50',10,0,NULL),
  (37,37,1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (38,38,1,15,0,'2026-02-13 07:03:50',10,0,NULL),
  (39,39,1,10,0,'2026-02-13 07:03:50',10,0,NULL),
  (40,40,1, 0,0,'2026-02-13 07:03:50',10,0,NULL),
  (41,41,1,35,0,'2026-02-13 07:03:50',10,0,NULL),
  (42,42,1,31,0,'2026-03-02 03:03:17',10,0,NULL),
  (43,43,1,40,0,'2026-02-13 07:03:50',10,0,NULL),
  (44,44,1,38,0,'2026-02-13 07:03:50',10,0,NULL),
  (45,45,1,35,0,'2026-02-13 07:03:50',10,0,NULL),
  (46,46,1,28,0,'2026-02-13 07:03:50',10,0,NULL),
  (47,47,1,22,0,'2026-02-13 07:03:50',10,0,NULL),
  (48,48,1,18,0,'2026-02-13 07:03:50',10,0,NULL),
  (49,64,1,15,0,'2026-02-13 07:03:50',10,0,NULL),
  (50,65,1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (51,66,1,20,0,'2026-02-13 07:03:50',10,0,NULL),
  (52,67,1,30,0,'2026-02-13 07:03:50',10,0,NULL),
  (53,68,1,50,0,'2026-02-13 07:03:50',10,0,NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: inventory_logs
-- =============================================================
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inventory_id`    BIGINT UNSIGNED NOT NULL,
  `quantity_change` INT             NOT NULL,
  `reason`          VARCHAR(255)    DEFAULT NULL,
  `reference_id`    VARCHAR(100)    DEFAULT NULL,
  `created_at`      TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory`        (`inventory_id`),
  KEY `idx_created_at`       (`created_at`),
  KEY `idx_inventory_logs_time` (`inventory_id`,`created_at` DESC),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `inventory_logs` WRITE;
INSERT INTO `inventory_logs` VALUES
  (1,1,50,'initial_migration','product_size_1','2025-12-06 14:32:12'),
  (2,2,45,'initial_migration','product_size_2','2025-12-06 14:32:12'),
  (3,3,60,'initial_migration','product_size_3','2025-12-06 14:32:12'),
  (4,4,55,'initial_migration','product_size_4','2025-12-06 14:32:12'),
  (5,5,50,'initial_migration','product_size_5','2025-12-06 14:32:12'),
  (6,6,40,'initial_migration','product_size_6','2025-12-06 14:32:12'),
  (7,7,30,'initial_migration','product_size_7','2025-12-06 14:32:12'),
  (8,8,20,'initial_migration','product_size_8','2025-12-06 14:32:12'),
  (9,9,55,'initial_migration','product_size_9','2025-12-06 14:32:12'),
  (10,10,50,'initial_migration','product_size_10','2025-12-06 14:32:12'),
  (11,11,65,'initial_migration','product_size_11','2025-12-06 14:32:12'),
  (12,12,60,'initial_migration','product_size_12','2025-12-06 14:32:12'),
  (13,13,55,'initial_migration','product_size_13','2025-12-06 14:32:12'),
  (14,14,45,'initial_migration','product_size_14','2025-12-06 14:32:12'),
  (15,15,35,'initial_migration','product_size_15','2025-12-06 14:32:12'),
  (16,16,25,'initial_migration','product_size_16','2025-12-06 14:32:12'),
  (17,17,40,'initial_migration','product_size_17','2025-12-06 14:32:12'),
  (18,18,35,'initial_migration','product_size_18','2025-12-06 14:32:12'),
  (19,19,50,'initial_migration','product_size_19','2025-12-06 14:32:12'),
  (20,20,45,'initial_migration','product_size_20','2025-12-06 14:32:12'),
  (21,21,40,'initial_migration','product_size_21','2025-12-06 14:32:12'),
  (22,22,30,'initial_migration','product_size_22','2025-12-06 14:32:12'),
  (23,23,25,'initial_migration','product_size_23','2025-12-06 14:32:12'),
  (24,24,15,'initial_migration','product_size_24','2025-12-06 14:32:12'),
  (25,25,30,'initial_migration','product_size_25','2025-12-06 14:32:12'),
  (26,26,25,'initial_migration','product_size_26','2025-12-06 14:32:12'),
  (27,27,35,'initial_migration','product_size_27','2025-12-06 14:32:12'),
  (28,28,30,'initial_migration','product_size_28','2025-12-06 14:32:12'),
  (29,29,25,'initial_migration','product_size_29','2025-12-06 14:32:12'),
  (30,30,20,'initial_migration','product_size_30','2025-12-06 14:32:12'),
  (31,31,15,'initial_migration','product_size_31','2025-12-06 14:32:12'),
  (32,32,10,'initial_migration','product_size_32','2025-12-06 14:32:12'),
  (33,33,20,'initial_migration','product_size_33','2025-12-06 14:32:12'),
  (34,34,18,'initial_migration','product_size_34','2025-12-06 14:32:12'),
  (35,35,25,'initial_migration','product_size_35','2025-12-06 14:32:12'),
  (36,36,22,'initial_migration','product_size_36','2025-12-06 14:32:12'),
  (37,37,20,'initial_migration','product_size_37','2025-12-06 14:32:12'),
  (38,38,15,'initial_migration','product_size_38','2025-12-06 14:32:12'),
  (39,39,10,'initial_migration','product_size_39','2025-12-06 14:32:12'),
  (40,40, 8,'initial_migration','product_size_40','2025-12-06 14:32:12'),
  (41,41,35,'initial_migration','product_size_41','2025-12-06 14:32:12'),
  (42,42,32,'initial_migration','product_size_42','2025-12-06 14:32:12'),
  (43,43,40,'initial_migration','product_size_43','2025-12-06 14:32:12'),
  (44,44,38,'initial_migration','product_size_44','2025-12-06 14:32:12'),
  (45,45,35,'initial_migration','product_size_45','2025-12-06 14:32:12'),
  (46,46,28,'initial_migration','product_size_46','2025-12-06 14:32:12'),
  (47,47,22,'initial_migration','product_size_47','2025-12-06 14:32:12'),
  (48,48,18,'initial_migration','product_size_48','2025-12-06 14:32:12'),
  (60, 7,-1,'order_reserved','NK1771037108210_9KMI','2026-02-14 02:45:08'),
  (61, 5,-1,'order_reserved','NK1771209986111_U8W9','2026-02-16 02:46:26');
UNLOCK TABLES;

-- =============================================================
-- TABLE: inventory_transfers
-- =============================================================
DROP TABLE IF EXISTS `inventory_transfers`;
CREATE TABLE `inventory_transfers` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_warehouse_id`  BIGINT UNSIGNED NOT NULL,
  `to_warehouse_id`    BIGINT UNSIGNED NOT NULL,
  `product_variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity`           INT             NOT NULL,
  `status`             ENUM('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
  `requested_by`       BIGINT UNSIGNED DEFAULT NULL,
  `approved_by`        BIGINT UNSIGNED DEFAULT NULL,
  `notes`              TEXT,
  `created_at`         TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at`       TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: stock_reservations
-- =============================================================
DROP TABLE IF EXISTS `stock_reservations`;
CREATE TABLE `stock_reservations` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(255)    NOT NULL,
  `items`      JSON            NOT NULL,
  `expires_at` TIMESTAMP       NOT NULL,
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id`    (`session_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: user_addresses
-- =============================================================
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id`                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`                  BIGINT UNSIGNED NOT NULL,
  `label`                    VARCHAR(100)    DEFAULT NULL,
  `recipient_name`           VARCHAR(255)    DEFAULT NULL,
  `recipient_name_encrypted` TEXT,
  `phone`                    VARCHAR(255)    DEFAULT NULL,
  `phone_encrypted`          TEXT,
  `address_line`             VARCHAR(255)    DEFAULT NULL,
  `address_encrypted`        TEXT,
  `ward`                     VARCHAR(100)    DEFAULT NULL,
  `district`                 VARCHAR(100)    DEFAULT NULL,
  `city`                     VARCHAR(100)    DEFAULT NULL,
  `state`                    VARCHAR(100)    DEFAULT NULL,
  `postal_code`              VARCHAR(20)     DEFAULT NULL,
  `country`                  VARCHAR(100)    DEFAULT 'Vietnam',
  `is_default`               TINYINT(1)      DEFAULT '0',
  `created_at`               TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `is_encrypted`             TINYINT(1)      DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id`              (`user_id`),
  KEY `idx_is_encrypted`     (`is_encrypted`),
  KEY `idx_user_addr_default` (`user_id`,`is_default`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `user_addresses` WRITE;
INSERT INTO `user_addresses` VALUES
  (7,1,'Nhà',      'DANG THANH TOAN',NULL,'***','c6f1d298e6eda39fa6ddba9fd34b0ed4:ddcbf087e4f95e569947104605bfe024:f55e83b437a0e4d39f6d',
   '***','c7a71b8f694f4906c3a614b9cdaea2cf:022dddc2ddc29fe8337649285df9243a:562856a6b9',
   NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',1,'2025-12-07 07:43:38',1),
  (8,1,'Văn Phòng','DANG THANH TOAN',NULL,'***','3586a7313cc9ac770af8bfd459e49c2f:1e2ea923c9a81043d614f2019d86567a:728edf05ac460c490754',
   '***','90f8094757225ef71c3fad03a09e8c9a:1ba4a91a84be96d3ce503d7c481d325b:40ddb15bcb',
   NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',0,'2025-12-07 09:49:27',1),
  (9,2,'Nhà',      'DANG THANH TOAN',NULL,'***','aee729f3f203d643ec580b4475cbc06d:70c92a4099335887a733f0e839619267:66483ffb17cedad30705',
   '***','a3eb68dcb7ca4152051a771b81815703:612ca8cbb0011e9bf11c84d9302e3a7d:75c010b16e',
   NULL,NULL,'HO CHI MINH','Thành phố Hồ Chí Minh','700000','Vietnam',1,'2025-12-08 02:05:25',1);
UNLOCK TABLES;

-- =============================================================
-- TABLE: orders  [ARC-01] Core table — trimmed to essentials
-- [ARC-06] Added CHECK on total
-- =============================================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number`            VARCHAR(100)    NOT NULL,
  `user_id`                 BIGINT UNSIGNED DEFAULT NULL,
  `shipping_address_id`     BIGINT UNSIGNED DEFAULT NULL,
  `billing_address_id`      BIGINT UNSIGNED DEFAULT NULL,
  `subtotal`                DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `shipping_fee`            DECIMAL(12,2)   DEFAULT '0.00',
  `discount`                DECIMAL(12,2)   DEFAULT '0.00',
  `voucher_code`            VARCHAR(50)     DEFAULT NULL,
  `voucher_discount`        DECIMAL(12,2)   DEFAULT '0.00',
  `giftcard_number`         VARCHAR(16)     DEFAULT NULL,
  `giftcard_discount`       DECIMAL(12,2)   DEFAULT '0.00',
  `tax`                     DECIMAL(12,2)   DEFAULT '0.00',
  `total`                   DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `currency`                VARCHAR(10)     DEFAULT 'VND',
  `status`                  ENUM('pending','pending_payment_confirmation','payment_received',
                                 'confirmed','processing','shipped','delivered','cancelled','refunded')
                            NOT NULL DEFAULT 'pending',
  `placed_at`               TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes`                   TEXT,
  `has_gift_wrapping`       TINYINT(1)      DEFAULT '0',
  `gift_wrap_cost`          DECIMAL(12,2)   DEFAULT '0.00',
  `is_encrypted`            TINYINT(1)      DEFAULT '0',
  -- Legacy encrypted snapshot fields (kept for backward compat, deprecated in Phase-3)
  `shipping_address_snapshot`   JSON        DEFAULT NULL,
  `shipping_phone_encrypted`    TEXT,
  `shipping_address_encrypted`  TEXT,
  `billing_phone_encrypted`     TEXT,
  `phone`                   VARCHAR(255)    DEFAULT NULL,
  `phone_encrypted`         TEXT,
  `email`                   VARCHAR(255)    DEFAULT NULL,
  `email_encrypted`         TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number`          (`order_number`),
  KEY `user_id`                      (`user_id`),
  KEY `idx_order_number`             (`order_number`),
  KEY `idx_shipping_address`         (`shipping_address_id`),
  KEY `idx_billing_address`          (`billing_address_id`),
  KEY `idx_is_encrypted`             (`is_encrypted`),
  KEY `idx_user_status_placed`       (`user_id`,`status`,`placed_at` DESC),
  KEY `idx_status_placed`            (`status`,`placed_at` DESC),
  KEY `idx_orders_voucher_code`      (`voucher_code`),
  CONSTRAINT `fk_orders_billing_address`  FOREIGN KEY (`billing_address_id`)  REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1`              FOREIGN KEY (`user_id`)             REFERENCES `users`          (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_orders_total_positive`    CHECK (`total`    >= 0),
  CONSTRAINT `chk_orders_subtotal_positive` CHECK (`subtotal` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: order_shipping_details  [ARC-01] NEW (Phase-1 split)
-- =============================================================
DROP TABLE IF EXISTS `order_shipping_details`;
CREATE TABLE `order_shipping_details` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`         BIGINT UNSIGNED NOT NULL,
  `carrier`          VARCHAR(100)    DEFAULT NULL,
  `tracking_number`  VARCHAR(100)    DEFAULT NULL,
  `shipped_at`       TIMESTAMP       NULL DEFAULT NULL,
  `delivered_at`     TIMESTAMP       NULL DEFAULT NULL,
  `estimated_delivery` DATE          DEFAULT NULL,
  `recipient_name`   VARCHAR(255)    DEFAULT NULL,
  `recipient_phone`  VARCHAR(255)    DEFAULT NULL,
  `address_line`     TEXT,
  `ward`             VARCHAR(100)    DEFAULT NULL,
  `district`         VARCHAR(100)    DEFAULT NULL,
  `city`             VARCHAR(100)    DEFAULT NULL,
  `country`          VARCHAR(100)    DEFAULT 'Vietnam',
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id`            (`order_id`),
  KEY `idx_tracking_number`        (`tracking_number`),
  KEY `idx_carrier_tracking`       (`carrier`,`tracking_number`),
  CONSTRAINT `osd_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: order_payment_details  [ARC-02] NEW (Phase-1 split)
-- =============================================================
DROP TABLE IF EXISTS `order_payment_details`;
CREATE TABLE `order_payment_details` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`              BIGINT UNSIGNED NOT NULL,
  `payment_method`        VARCHAR(50)     DEFAULT 'cod',
  `payment_status`        ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_confirmed_at`  TIMESTAMP       NULL DEFAULT NULL,
  `transaction_ref`       VARCHAR(100)    DEFAULT NULL,
  `provider_response`     JSON            DEFAULT NULL,
  `created_at`            TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id`           (`order_id`),
  KEY `idx_payment_status`        (`payment_status`),
  KEY `idx_payment_method`        (`payment_method`),
  KEY `idx_payment_status_placed` (`payment_status`,`created_at` DESC),
  CONSTRAINT `opd_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- VIEW: orders_full  [ARC-03] Backward-compat VIEW
-- APIs continue to work during Phase-1 → Phase-3 migration
-- =============================================================
DROP VIEW IF EXISTS `orders_full`;
CREATE VIEW `orders_full` AS
SELECT
  o.*,
  osd.carrier,
  osd.tracking_number,
  osd.shipped_at,
  osd.delivered_at,
  opd.payment_method,
  opd.payment_status,
  opd.payment_confirmed_at
FROM `orders` o
LEFT JOIN `order_shipping_details` osd ON osd.order_id = o.id
LEFT JOIN `order_payment_details`  opd ON opd.order_id = o.id;

-- =============================================================
-- Seed: orders (clean — no TEST-* data)  [HYG-01]
-- =============================================================
LOCK TABLES `orders` WRITE;
INSERT INTO `orders`
  (id,order_number,user_id,shipping_address_id,billing_address_id,
   subtotal,shipping_fee,discount,voucher_code,voucher_discount,
   giftcard_number,giftcard_discount,tax,total,currency,
   shipping_address_snapshot,shipping_phone_encrypted,shipping_address_encrypted,
   billing_phone_encrypted,status,placed_at,updated_at,notes,
   has_gift_wrapping,gift_wrap_cost,is_encrypted,phone,phone_encrypted,email,email_encrypted)
VALUES
  (3,'NK1765037039892',1,NULL,NULL,2929000,0,0,NULL,0,NULL,0,0,2929000,'VND',NULL,NULL,NULL,NULL,'cancelled','2025-12-06 16:03:59','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (4,'NK1765087390746',1,NULL,NULL,29290000,0,0,NULL,0,NULL,0,0,29290000,'VND',NULL,NULL,NULL,NULL,'cancelled','2025-12-07 06:03:10','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (5,'NK1765088272959',1,NULL,NULL,2929000,0,0,NULL,0,NULL,0,0,2929000,'VND',NULL,NULL,NULL,NULL,'delivered','2025-12-07 06:17:52','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (6,'NK1765089059778',1,NULL,NULL,5858000,0,1288760,'VIP20',1288760,NULL,0,0,4569240,'VND',NULL,NULL,NULL,NULL,'delivered','2025-12-07 06:30:59','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (7,'NK1765093418497',1,7,NULL,2929000,0,1644380,'VIP20',644380,'2345678901234567',1000000,0,1284620,'VND',NULL,NULL,NULL,NULL,'cancelled','2025-12-07 07:43:38','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (8,'NK1767443489937',1,NULL,NULL,2929000,0,0,NULL,0,NULL,0,0,2929000,'VND',NULL,NULL,NULL,NULL,'cancelled','2026-01-03 12:31:29','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (9,'NK1769773670916',1,NULL,NULL,3829000,0,1100000,'TOAN',100000,'1122334455667788',1000000,0,2729000,'VND',NULL,NULL,NULL,NULL,'delivered','2026-01-30 11:47:50','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (11,'NK1769775001613',1,NULL,NULL,3829000,0,1100000,'TOAN',100000,'1122334455667788',1000000,382900,3111900,'VND',NULL,NULL,NULL,NULL,'delivered','2026-01-30 12:10:01','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (12,'NK1769776162375',1,NULL,NULL,3519000,0,1050000,'WELCOME50',50000,'1122334455667788',1000000,351900,2820900,'VND',NULL,NULL,NULL,NULL,'delivered','2026-01-30 12:29:22','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (13,'NK1769776799944',1,NULL,NULL,5589000,0,1500000,'NIKE2024',500000,'1122334455667788',1000000,558900,4647900,'VND',NULL,NULL,NULL,NULL,'delivered','2026-01-30 12:39:59','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (40,'NK1770253823973',1,NULL,NULL,2829000,0,141450,NULL,0,NULL,0,282900,2970450,'VND',NULL,NULL,NULL,NULL,'delivered','2026-02-05 01:10:24','2026-03-02 03:12:16',NULL,0,0,1,'***',NULL,'***',NULL),
  (53,'NK1771037108210_9KMI',1,NULL,NULL,4500000,0,712640,'TOAN',421190,'6969696969696969',100000,382900,4170260,'VND',
   '{"city":"TP. Hồ Chí Minh","name":"DANG THANH TOAN","ward":"700000","phone":"[encrypted]","address":"[encrypted]","district":"Hóc Môn","address_line":"[encrypted]"}',
   NULL,NULL,NULL,'delivered','2026-02-14 02:45:08','2026-02-28 00:06:02',NULL,0,0,1,'***',
   '7f465fe056d84b1c019a8fecf0e08127:64fce2a42053e28f0b3304352b8bf54f:082b572395a66463a678','***',
   '2109f2bad4481ba13ea56aef7a1ecd0f:ee40aa5daf9122db0b0ea88dc77ff54f:e7b8ff5f5e9e9d8d6559dd82276affbcce25ceddd448b59d1852a9'),
  (54,'NK1771209986111_U8W9',NULL,NULL,NULL,4500000,0,0,NULL,0,NULL,0,0,4500000,'VND',
   '{"city":"","name":"0123456789","ward":"","phone":"[encrypted]","address":"[encrypted]","district":"","address_line":"[encrypted]"}',
   NULL,NULL,NULL,'pending','2026-02-16 02:46:26','2026-02-28 00:06:02',NULL,0,0,1,'***',
   'bbc8ffe30281bc923554fd7aae506f58:60a659413a2d94bb29be85a5807abae1:247eb702f4646ca5ba35','***',
   '5a6ff6fe06a826f832d95ac35a316c87:58beff57db9a2393d069e99ca9846ab6:17439d211de26b1e9febaa4728d2');
UNLOCK TABLES;

-- Backfill order_shipping_details from known delivered orders
LOCK TABLES `order_shipping_details` WRITE;
INSERT INTO `order_shipping_details`
  (order_id,carrier,tracking_number,shipped_at,delivered_at,recipient_name,city)
VALUES
  (53,'Thanh toán khi nhận hàng',NULL,'2026-02-14 02:48:10','2026-02-14 02:48:48','DANG THANH TOAN','TP. Hồ Chí Minh');
UNLOCK TABLES;

-- Backfill order_payment_details
LOCK TABLES `order_payment_details` WRITE;
INSERT INTO `order_payment_details`
  (order_id,payment_method,payment_status,payment_confirmed_at)
VALUES
  (3, 'cod','pending',NULL),(4,'cod','pending',NULL),(5,'cod','pending',NULL),
  (6, 'cod','pending',NULL),(7,'cod','pending',NULL),(8,'cod','pending',NULL),
  (9, 'cod','pending',NULL),(11,'cod','pending',NULL),(12,'cod','pending',NULL),
  (13,'cod','pending',NULL),(40,'cod','pending',NULL),
  (53,'Thanh toán khi nhận hàng','pending','2026-02-14 02:47:45'),
  (54,'cod','pending',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: order_items  [HYG-01] — test items removed
-- =============================================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`           BIGINT UNSIGNED NOT NULL,
  `product_id`         BIGINT UNSIGNED DEFAULT NULL,
  `product_variant_id` BIGINT UNSIGNED DEFAULT NULL,
  `inventory_id`       BIGINT UNSIGNED DEFAULT NULL,
  `product_name`       VARCHAR(500)    NOT NULL,
  `sku`                VARCHAR(200)    DEFAULT NULL,
  `size`               VARCHAR(10)     DEFAULT NULL,
  `quantity`           INT             NOT NULL DEFAULT '1',
  `unit_price`         DECIMAL(12,2)   NOT NULL,
  `cost_price`         DECIMAL(12,2)   DEFAULT '0.00',
  `total_price`        DECIMAL(12,2)   NOT NULL,
  `flash_sale_item_id` BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id`            (`order_id`),
  KEY `product_id`          (`product_id`),
  KEY `fk_order_items_variant` (`product_variant_id`),
  KEY `flash_sale_item_id`  (`flash_sale_item_id`),
  KEY `idx_product_variant` (`product_id`,`product_variant_id`),
  KEY `idx_inventory_order` (`inventory_id`,`order_id`),
  CONSTRAINT `fk_order_items_inventory` FOREIGN KEY (`inventory_id`)       REFERENCES `inventory`       (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_variant`   FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_1`       FOREIGN KEY (`order_id`)           REFERENCES `orders`          (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2`       FOREIGN KEY (`product_id`)         REFERENCES `products`        (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_order_item_qty`   CHECK (`quantity`    > 0),
  CONSTRAINT `chk_order_item_price` CHECK (`unit_price`  >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `order_items` WRITE;
INSERT INTO `order_items` VALUES
  (1, 3, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000,0,2929000,NULL),
  (2, 4, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'45',10,2929000,0,29290000,NULL),
  (3, 5, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000,0,2929000,NULL),
  (4, 6, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000,0,2929000,NULL),
  (5, 6, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'44',1,2929000,0,2929000,NULL),
  (6, 7, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000,0,2929000,NULL),
  (7, 8, 2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000,0,2929000,NULL),
  (8, 9, 1,NULL,NULL,'Nike Air Max 270',       NULL,'40',1,3829000,0,3829000,NULL),
  (10,11,4,NULL,NULL,'Air Jordan 1 Mid',        NULL,'39',1,3829000,0,3829000,NULL),
  (11,12,3,NULL,NULL,'Nike Pegasus 40',          NULL,'40',1,3519000,0,3519000,NULL),
  (12,13,5,NULL,NULL,'Air Jordan 4 Retro',       NULL,'40',1,5589000,0,5589000,NULL),
  (39,40,6,NULL,NULL,'Nike Dunk Low',            NULL,'39',1,2829000,0,2829000,NULL),
  (50,53,1,7,7,'Nike Air Max 270','NK-AM270-BLK-44','44',1,4500000,0,4500000,NULL),
  (51,54,1,5,5,'Nike Air Max 270','NK-AM270-BLK-42','42',1,4500000,0,4500000,NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: coupons
-- NOTE: coupons = public discount codes; vouchers = personal credit codes.
--   Do NOT merge. Enforce with application-layer validation.
-- =============================================================
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`                 VARCHAR(100)    NOT NULL,
  `description`          VARCHAR(255)    DEFAULT NULL,
  `discount_type`        ENUM('fixed','percent') DEFAULT 'fixed',
  `discount_value`       DECIMAL(12,2)   NOT NULL,
  `applicable_tier`      ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `min_order_amount`     DECIMAL(12,2)   DEFAULT NULL,
  `applicable_categories` JSON           DEFAULT NULL,
  `max_discount_amount`  DECIMAL(12,2)   DEFAULT NULL,
  `starts_at`            TIMESTAMP       NULL DEFAULT NULL,
  `ends_at`              TIMESTAMP       NULL DEFAULT NULL,
  `usage_limit`          INT             DEFAULT NULL,
  `usage_limit_per_user` INT             DEFAULT NULL,
  `created_at`           TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at`           TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code`            (`code`),
  KEY `idx_deleted_at`         (`deleted_at`),
  KEY `idx_code_dates`         (`code`,`starts_at`,`ends_at`),
  KEY `idx_coupons_active`     (`deleted_at`,`ends_at`),
  CONSTRAINT `chk_coupon_value_positive` CHECK (`discount_value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `coupons` WRITE;
INSERT INTO `coupons` VALUES
  (1, 'WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên','percent',10,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-01-05 14:11:35',1000,NULL,'2025-12-06 14:11:35',NULL),
  (2, 'SALE50K',   'Giảm 50,000đ cho đơn hàng từ 500,000đ','fixed',50000,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2025-12-13 14:11:35',500,NULL,'2025-12-06 14:11:35',NULL),
  (3, 'VIP20',     'Giảm 20% cho thành viên VIP','percent',20,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-03-06 14:11:35',NULL,NULL,'2025-12-06 14:11:35',NULL),
  (4, 'NEWYEAR2025','Giảm 15% chào năm mới 2025','percent',15,'bronze',NULL,NULL,NULL,'2025-12-07 03:52:09','2026-01-06 03:52:09',2000,NULL,'2025-12-06 14:11:35',NULL),
  (9, 'NIKE2024',  'Giảm 10% cho đơn hàng từ 2 triệu','percent',10,'bronze',2000000,NULL,500000,'2025-12-31 17:00:00','2026-12-31 03:00:00',100,1,'2025-12-09 06:01:59',NULL),
  (10,'WELCOME50', 'Giảm 50K cho khách hàng mới','fixed',50000,'bronze',500000,NULL,NULL,'2025-12-09 06:01:59','2026-02-07 06:01:59',500,1,'2025-12-09 06:01:59',NULL),
  (11,'FREESHIP',  'Miễn phí vận chuyển','fixed',30000,'bronze',1000000,NULL,30000,'2025-12-09 06:01:59','2026-03-09 06:01:59',NULL,NULL,'2025-12-09 06:01:59',NULL),
  (12,'TOAN',      'Giảm 10% cho đơn hàng từ 1 triệu','percent',10,'bronze',1000000,NULL,100000,'2026-01-01 04:11:00','2026-12-30 17:00:00',10,1,'2026-01-25 03:41:00',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: coupon_usage
-- =============================================================
DROP TABLE IF EXISTS `coupon_usage`;
CREATE TABLE `coupon_usage` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id`   BIGINT UNSIGNED DEFAULT NULL,
  `coupon_code` VARCHAR(100)    DEFAULT NULL,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL,
  `order_id`    BIGINT UNSIGNED DEFAULT NULL,
  `used_at`     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id`              (`user_id`),
  KEY `order_id`             (`order_id`),
  KEY `coupon_usage_ibfk_1`  (`coupon_id`),
  KEY `idx_coupon_usage_check` (`user_id`,`coupon_id`),
  CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`user_id`)   REFERENCES `users`   (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`order_id`)  REFERENCES `orders`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `coupon_usage` WRITE;
INSERT INTO `coupon_usage` VALUES
  (2,12,NULL,1,11,'2026-01-30 12:10:01'),
  (3,10,NULL,1,12,'2026-01-30 12:29:22'),
  (4, 9,NULL,1,13,'2026-01-30 12:40:00'),
  (5,12,NULL,1,53,'2026-02-14 02:45:08');
UNLOCK TABLES;

-- =============================================================
-- TABLE: vouchers
-- NOTE [ARC]: recipient_user_id SHOULD be NOT NULL for personalised
--   vouchers. Enforced at application layer; schema change in next sprint.
-- =============================================================
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`                VARCHAR(100)    NOT NULL,
  `value`               DECIMAL(12,2)   NOT NULL,
  `applicable_tier`     ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `min_order_value`     DECIMAL(12,2)   DEFAULT '0.00',
  `applicable_categories` JSON          DEFAULT NULL,
  `discount_type`       ENUM('fixed','percent') DEFAULT 'fixed',
  `description`         VARCHAR(255)    DEFAULT NULL,
  `issued_by_user_id`   BIGINT UNSIGNED DEFAULT NULL,
  `recipient_user_id`   BIGINT UNSIGNED DEFAULT NULL,
  `redeemed_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `status`              ENUM('active','inactive','redeemed','expired') DEFAULT 'active',
  `valid_from`          TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until`         TIMESTAMP       NULL DEFAULT NULL,
  `redeemed_at`         TIMESTAMP       NULL DEFAULT NULL,
  `created_at`          TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`          TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code`             (`code`),
  KEY `recipient_user_id`       (`recipient_user_id`),
  KEY `redeemed_by_user_id`     (`redeemed_by_user_id`),
  KEY `status`                  (`status`),
  KEY `idx_deleted_at`          (`deleted_at`),
  KEY `idx_status_valid`        (`status`,`valid_until`),
  KEY `fk_vouchers_issuer`      (`issued_by_user_id`),
  CONSTRAINT `fk_vouchers_issuer` FOREIGN KEY (`issued_by_user_id`)   REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_1`    FOREIGN KEY (`recipient_user_id`)   REFERENCES `users`       (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_2`    FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users`       (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_voucher_value_positive` CHECK (`value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `vouchers` WRITE;
INSERT INTO `vouchers` VALUES
  (1, 'GIFT2024-001',100000,'bronze',0,NULL,'fixed','Gift code 100k credits',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-30 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:42:32',NULL),
  (2, 'REF-SIGN100', 50000,'bronze',0,NULL,'fixed','Referral sign up reward',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-26 17:00:00',NULL,'2026-01-27 04:20:51','2026-03-01 13:36:57',NULL),
  (3, 'WELCOME-NEW',200000,'bronze',0,NULL,'fixed','Welcome new customer',   NULL,1,NULL,'active','2026-01-27 04:20:51','2026-06-29 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:38:49',NULL),
  (4, 'TOAN',       100000,'silver',0,NULL,'fixed','Quà Sinh Nhật',          NULL,1,NULL,'active','2026-03-01 13:38:09','2026-10-09 17:00:00',NULL,'2026-03-01 13:38:09','2026-03-01 13:38:09',NULL),
  (8, 'ABCD',     10000000,'bronze',0,NULL,'fixed','test',                   NULL,1,NULL,'active','2026-03-01 14:53:56','2026-12-30 17:00:00',NULL,'2026-03-01 14:53:56','2026-03-01 14:53:56',NULL),
  (9, 'REDEEM50K',  50000,'bronze',0,NULL,'fixed','Giảm 50K cho đơn hàng bất kỳ',NULL,1,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:19:07',NULL),
  (10,'REDEEM100K',100000,'bronze',0,NULL,'fixed','Giảm 100K cho đơn hàng bất kỳ',NULL,NULL,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:04:59',NULL),
  (11,'REDEEM10',      10,'bronze',0,NULL,'percent','Giảm 10% cho đơn hàng bất kỳ',NULL,NULL,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:04:59',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: gift_cards
-- [SEC-02] card_number_hash + card_number_last4 added.
--   Plaintext card_number retained ONLY as masked reference (**** x4).
--   Application MUST store SHA2(card_number + pepper, 256) at insert time.
-- =============================================================
DROP TABLE IF EXISTS `gift_cards`;
CREATE TABLE `gift_cards` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `card_number`      VARCHAR(19)     NOT NULL COMMENT 'Masked: last4 only e.g. ****4567',
  `card_number_hash` VARCHAR(64)     NOT NULL COMMENT 'SHA2(raw_number + server_pepper, 256)',
  `card_number_last4` CHAR(4)        NOT NULL,
  `pin`              VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
  `initial_balance`  DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `current_balance`  DECIMAL(12,2)   NOT NULL DEFAULT '0.00',
  `currency`         VARCHAR(10)     DEFAULT 'VND',
  `status`           ENUM('active','inactive','expired','used','locked') DEFAULT 'active',
  `failed_attempts`  INT             DEFAULT '0',
  `purchased_by`     BIGINT UNSIGNED DEFAULT NULL,
  `purchased_at`     TIMESTAMP       NULL DEFAULT NULL,
  `expires_at`       TIMESTAMP       NULL DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_number_hash` (`card_number_hash`),
  KEY `purchased_by`            (`purchased_by`),
  KEY `idx_card_hash`           (`card_number_hash`),
  KEY `idx_card_last4`          (`card_number_last4`),
  KEY `idx_gift_cards_status`   (`status`),
  CONSTRAINT `gift_cards_ibfk_1` FOREIGN KEY (`purchased_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_gc_balance_non_negative`  CHECK (`current_balance`  >= 0),
  CONSTRAINT `chk_gc_initial_non_negative`  CHECK (`initial_balance`  >= 0),
  CONSTRAINT `chk_gc_balance_le_initial`    CHECK (`current_balance`  <= `initial_balance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `gift_cards` WRITE;
-- [SEC-02] card_number stored as masked string; hash is placeholder.
--   Replace hashes with SHA2(real_number + APP_PEPPER, 256) on first boot.
INSERT INTO `gift_cards`
  (id,card_number,card_number_hash,card_number_last4,pin,initial_balance,current_balance,currency,status,failed_attempts,purchased_by,purchased_at,expires_at)
VALUES
  (2, '****4567','REPLACE_WITH_SHA2_HASH_2','4567','$2b$10$jKLc3TIFYZzp6wMGgI1NPud/Jl/Gv.rScynI7G3iIn/MtrpMdGtsS',1000000,1000000,'VND','active',0,NULL,NULL,'2026-12-06 14:11:35'),
  (3, '****5678','REPLACE_WITH_SHA2_HASH_3','5678','$2b$10$pgI/Qxf/ZT2BgQLhMooXrOliZoOcfEjtPprrLfo5kCY/BORlg.XF2',2000000,2000000,'VND','active',0,NULL,NULL,'2026-12-06 14:11:35'),
  (4, '****6789','REPLACE_WITH_SHA2_HASH_4','6789','$2b$10$Ae5WPDcu93PDobkvnn5EuuLpvkw5p03uCqmOLap.cb/GbbSSXxMni',500000,300000,'VND','active',0,NULL,NULL,'2026-12-06 14:11:35'),
  (9, '****3456','REPLACE_WITH_SHA2_HASH_9','3456','$2b$10$Ntzc8iKZ1n3mftvuZJy89Ou53.VQFelU7DsDQNINcrfZuAAJP6Bt2',500000,500000,'VND','active',0,NULL,NULL,'2026-12-07 02:25:17'),
  (10,'****7654','REPLACE_WITH_SHA2_HASH_10','7654','$2b$10$z19dTdgRvoBrjrvqAUMe0ekPMJ9sSCf86t8Al1HkzyVqvXqjdPXd2',1000000,1000000,'VND','active',0,NULL,NULL,'2026-12-07 02:25:17'),
  (11,'****4444','REPLACE_WITH_SHA2_HASH_11','4444','$2b$10$WSg34bQT3S0D8TAOEsHvU.iurGW/0VdqUkN0kv/pW54/U/eq1W0l6',250000,250000,'VND','active',0,NULL,NULL,'2026-12-07 02:25:17'),
  (12,'****2131','REPLACE_WITH_SHA2_HASH_12','2131','$2b$10$1WQTM.6Oj87TlombdxWJi.cvF1EbqnYl18nvVerfZPTWpa5PX4/hS',1000000,1000000,'VND','active',0,NULL,NULL,'2026-01-29 14:57:02'),
  (13,'****7788','REPLACE_WITH_SHA2_HASH_13','7788','$2b$10$tlieXhxOfjxnko2qPiVmpu30aBg5WNSFMJaxyKWWnxnSSllFIjpMa',1000000,0,'VND','used',0,NULL,NULL,'2027-01-01 03:00:00'),
  (14,'****6969','REPLACE_WITH_SHA2_HASH_14','6969','$2b$10$RXx/A/yUbhSi6x3FSyA5FujcG7BgNXWQmFkcshyqes75MS7ygA046',100000,0,'VND','used',0,NULL,NULL,'2026-09-05 23:09:00'),
  (15,'****9696','REPLACE_WITH_SHA2_HASH_15','9696','$2b$10$oNt715nLT0kZzKYwSCh7jeDMWCWBwBto/bm9aADbjhDALlHzKpouG',100000,100000,'VND','active',0,NULL,NULL,'2026-06-09 02:06:00');
UNLOCK TABLES;

-- =============================================================
-- TABLE: gift_card_transactions
-- =============================================================
DROP TABLE IF EXISTS `gift_card_transactions`;
CREATE TABLE `gift_card_transactions` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `gift_card_id`     BIGINT UNSIGNED NOT NULL,
  `order_id`         BIGINT UNSIGNED DEFAULT NULL,
  `transaction_type` ENUM('purchase','redeem','refund','adjustment') NOT NULL,
  `amount`           DECIMAL(12,2)   NOT NULL,
  `balance_before`   DECIMAL(12,2)   NOT NULL,
  `balance_after`    DECIMAL(12,2)   NOT NULL,
  `description`      VARCHAR(500)    DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `gift_card_id` (`gift_card_id`),
  KEY `order_id`     (`order_id`),
  CONSTRAINT `gct_ibfk_1` FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gct_ibfk_2` FOREIGN KEY (`order_id`)     REFERENCES `orders`     (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `gift_card_transactions` WRITE;
INSERT INTO `gift_card_transactions` VALUES
  (1,14,NULL,'purchase',100000,0,100000,'Khởi tạo thẻ quà tặng','2026-02-14 02:04:53'),
  (2,14,53,  'redeem',  100000,100000,0,'Thanh toán đơn hàng NK1771037108210_9KMI','2026-02-14 02:45:08'),
  (3,15,NULL,'purchase',100000,0,100000,'Khởi tạo thẻ quà tặng','2026-02-14 06:16:29');
UNLOCK TABLES;

-- =============================================================
-- TABLE: gift_card_lockouts
-- =============================================================
DROP TABLE IF EXISTS `gift_card_lockouts`;
CREATE TABLE `gift_card_lockouts` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address`    VARCHAR(45)     NOT NULL,
  `card_number_hash` VARCHAR(64)  DEFAULT NULL COMMENT 'SHA2 hash, not plaintext',
  `attempt_count` INT             DEFAULT '1',
  `last_attempt`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `locked_until`  TIMESTAMP       NULL DEFAULT NULL,
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_last_attempt` (`ip_address`,`last_attempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: flash_sales / flash_sale_items
-- =============================================================
DROP TABLE IF EXISTS `flash_sale_items`;
DROP TABLE IF EXISTS `flash_sales`;

CREATE TABLE `flash_sales` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255)    NOT NULL,
  `description` TEXT,
  `start_time`  TIMESTAMP       NOT NULL,
  `end_time`    TIMESTAMP       NOT NULL,
  `is_active`   TINYINT(1)      DEFAULT '1',
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deleted_at`   (`deleted_at`),
  KEY `idx_active_dates` (`is_active`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `flash_sale_items` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flash_sale_id`       BIGINT UNSIGNED NOT NULL,
  `product_id`          BIGINT UNSIGNED NOT NULL,
  `discount_percentage` DECIMAL(5,2)    NOT NULL,
  `flash_price`         DECIMAL(12,2)   NOT NULL,
  `quantity_limit`      INT             DEFAULT NULL,
  `quantity_sold`       INT             DEFAULT '0',
  `per_user_limit`      INT             DEFAULT '1',
  `created_at`          TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_flash_product` (`flash_sale_id`,`product_id`),
  KEY `flash_sale_id`     (`flash_sale_id`),
  KEY `product_id`        (`product_id`),
  KEY `idx_sale_product`  (`flash_sale_id`,`product_id`),
  CONSTRAINT `fsi_ibfk_1` FOREIGN KEY (`flash_sale_id`) REFERENCES `flash_sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fsi_ibfk_2` FOREIGN KEY (`product_id`)    REFERENCES `products`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_fsi_price_positive` CHECK (`flash_price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `flash_sales` WRITE;
INSERT INTO `flash_sales` VALUES
  (1,'SIÊU SALE CUỐI TUẦN','Giảm giá cực sốc lên đến 50%','2026-02-12 10:36:03','2026-02-13 10:36:03',0,'2026-02-12 11:36:03','2026-02-12 12:23:46',NULL),
  (2,'toan','toan là tôi','2026-02-12 06:00:00','2026-02-19 06:00:00',1,'2026-02-12 12:18:38','2026-02-12 12:23:32',NULL);
UNLOCK TABLES;

LOCK TABLES `flash_sale_items` WRITE;
INSERT INTO `flash_sale_items` VALUES
  (1,1,1,48.00,1999000,50,12,1,'2026-02-12 11:36:04'),
  (2,1,2,49.00,1499000,100,45,1,'2026-02-12 11:36:04'),
  (3,1,3,31.00,2419000,30, 8,1,'2026-02-12 11:36:04'),
  (4,1,4,52.00,1829000,20,15,1,'2026-02-12 11:36:04'),
  (5,1,5,36.00,3589000,10, 2,1,'2026-02-12 11:36:04'),
  (6,2,7,50.00,2927500,10, 0,1,'2026-02-12 12:21:16');
UNLOCK TABLES;

-- =============================================================
-- TABLE: carts / cart_items
-- =============================================================
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `carts`;

CREATE TABLE `carts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED DEFAULT NULL,
  `session_id` VARCHAR(255)    DEFAULT NULL,
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cart_items` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id`            BIGINT UNSIGNED NOT NULL,
  `product_id`         BIGINT UNSIGNED NOT NULL,
  `product_variant_id` BIGINT UNSIGNED DEFAULT NULL,
  `size`               VARCHAR(10)     NOT NULL,
  `quantity`           INT             NOT NULL DEFAULT '1',
  `price`              DECIMAL(12,2)   NOT NULL,
  `added_at`           TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cart_id`            (`cart_id`),
  KEY `product_id`         (`product_id`),
  KEY `product_variant_id` (`product_variant_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`)            REFERENCES `carts`           (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`)         REFERENCES `products`        (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_item_qty`   CHECK (`quantity` > 0),
  CONSTRAINT `chk_cart_item_price` CHECK (`price`    >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `carts` WRITE;
INSERT INTO `carts` VALUES
  (1,1,NULL,'2025-12-06 15:36:05','2025-12-06 15:36:05',NULL),
  (2,2,NULL,'2025-12-08 01:58:20','2025-12-08 01:58:20',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: wishlists / wishlist_items
-- =============================================================
DROP TABLE IF EXISTS `wishlist_items`;
DROP TABLE IF EXISTS `wishlists`;

CREATE TABLE `wishlists` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `name`       VARCHAR(255)    DEFAULT 'My Wishlist',
  `is_default` TINYINT(1)      DEFAULT '1',
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wishlist_items` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wishlist_id`      BIGINT UNSIGNED NOT NULL,
  `product_id`       BIGINT UNSIGNED NOT NULL,
  `price_when_added` DECIMAL(12,2)   DEFAULT NULL,
  `added_at`         TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_product` (`wishlist_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`)  REFERENCES `products`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `wishlists` WRITE;
INSERT INTO `wishlists` VALUES
  (1,1,'My Wishlist',1,'2025-12-07 09:06:49'),
  (2,2,'My Wishlist',1,'2025-12-08 01:40:27');
UNLOCK TABLES;

LOCK TABLES `wishlist_items` WRITE;
INSERT INTO `wishlist_items` VALUES (36,1,7,7319000,'2026-02-16 02:22:10');
UNLOCK TABLES;

-- =============================================================
-- TABLE: product_reviews / review_media
-- =============================================================
DROP TABLE IF EXISTS `review_media`;
DROP TABLE IF EXISTS `product_reviews`;

CREATE TABLE `product_reviews` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`              BIGINT UNSIGNED DEFAULT NULL,
  `product_id`           BIGINT UNSIGNED NOT NULL,
  `rating`               INT             NOT NULL,
  `title`                VARCHAR(255)    DEFAULT NULL,
  `comment`              TEXT,
  `status`               ENUM('pending','approved','rejected') DEFAULT 'pending',
  `is_verified_purchase` TINYINT(1)      DEFAULT '0',
  `helpful_count`        INT             DEFAULT '0',
  `is_featured`          TINYINT(1)      DEFAULT '0',
  `created_at`           TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_reply`          TEXT,
  PRIMARY KEY (`id`),
  KEY `idx_product_id`              (`product_id`),
  KEY `idx_status`                  (`status`),
  KEY `idx_rating`                  (`rating`),
  KEY `product_reviews_ibfk_1`      (`user_id`),
  KEY `idx_product_approved_created` (`product_id`,`status`,`created_at` DESC),
  KEY `idx_product_rating`          (`product_id`,`rating` DESC),
  KEY `idx_user_created`            (`user_id`,`created_at` DESC),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`user_id`)    REFERENCES `users`    (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1`  CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `review_media` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `review_id`     BIGINT UNSIGNED NOT NULL,
  `media_type`    ENUM('image','video') NOT NULL,
  `media_url`     VARCHAR(1000)   NOT NULL,
  `thumbnail_url` VARCHAR(1000)   DEFAULT NULL,
  `file_size`     INT             DEFAULT NULL,
  `mime_type`     VARCHAR(100)    DEFAULT NULL,
  `position`      INT             DEFAULT '0',
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_review_id` (`review_id`),
  KEY `idx_media_type` (`media_type`),
  CONSTRAINT `fk_review_media_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `product_reviews` WRITE;
INSERT INTO `product_reviews` VALUES
  (2,2,2,1,'OK','xấu','approved',0,4,0,'2026-01-27 07:36:19','2026-03-05 03:10:10','ok'),
  (3,1,2,5,'hàng ok','ok','approved',1,1,0,'2026-03-01 11:49:23','2026-03-05 03:13:03',NULL),
  (4,1,6,5,'ok','okkkkkkk','approved',1,1,0,'2026-03-05 03:21:29','2026-03-05 03:25:05',NULL);
UNLOCK TABLES;

LOCK TABLES `review_media` WRITE;
INSERT INTO `review_media` VALUES
  (1,3,'image','/uploads/reviews/review_3_1772365771897_1bk65q.png',NULL,218648,'image/png',0,'2026-03-01 11:49:31'),
  (2,4,'image','/uploads/reviews/review_4_1772680921551_lrz3h.png',NULL,218648,'image/png',0,'2026-03-05 03:22:01');
UNLOCK TABLES;

-- =============================================================
-- TABLE: notifications
-- =============================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `type`       ENUM('order','social','promo','system') NOT NULL,
  `title`      VARCHAR(255)    NOT NULL,
  `message`    TEXT            NOT NULL,
  `link`       VARCHAR(255)    DEFAULT NULL,
  `is_read`    TINYINT(1)      DEFAULT '0',
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read`          (`user_id`,`is_read`),
  KEY `idx_created_at`         (`created_at`),
  KEY `idx_user_type_read`     (`user_id`,`type`,`is_read`),
  KEY `idx_user_unread_created` (`user_id`,`is_read`,`created_at` DESC),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` VALUES
  (1,1,'promo','Bạn vừa nhận được voucher mới!',
   'Chúc mừng! Bạn vừa nhận được mã giảm giá ABCD trị giá 10.000.000 ₫. Hãy sử dụng ngay!',
   '/account/vouchers',0,'2026-03-01 14:53:56');
UNLOCK TABLES;

-- =============================================================
-- TABLE: point_transactions
-- =============================================================
DROP TABLE IF EXISTS `point_transactions`;
CREATE TABLE `point_transactions` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `points`       INT             NOT NULL,
  `type`         ENUM('earn','redeem','expire','refund','adjust') NOT NULL,
  `description`  VARCHAR(255)    DEFAULT NULL,
  `created_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `balance_after` INT            NOT NULL DEFAULT '0',
  `source`       VARCHAR(50)     DEFAULT NULL,
  `source_id`    VARCHAR(100)    DEFAULT NULL,
  `expires_at`   DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pt_user`      (`user_id`),
  KEY `idx_pt_type`      (`type`),
  KEY `idx_pt_expires`   (`expires_at`),
  KEY `idx_pt_user_time` (`user_id`,`created_at` DESC),
  CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `point_transactions` WRITE;
INSERT INTO `point_transactions` VALUES
  (1,1,-50,'redeem','Đổi voucher: REDEEM50K','2026-03-06 02:19:07',2397,NULL,NULL,NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: refund_requests / refunds
-- =============================================================
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `refund_requests`;

CREATE TABLE `refund_requests` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `user_id`        BIGINT UNSIGNED DEFAULT NULL,
  `amount`         DECIMAL(10,2)   NOT NULL,
  `reason`         TEXT            NOT NULL,
  `images`         JSON            DEFAULT NULL,
  `status`         ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  `admin_response` TEXT,
  `created_at`     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `user_id`  (`user_id`),
  CONSTRAINT `refund_requests_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `refund_requests_fk_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `refunds` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`      BIGINT UNSIGNED NOT NULL,
  `request_id`    BIGINT UNSIGNED DEFAULT NULL,
  `refund_amount` DECIMAL(12,2)   NOT NULL,
  `status`        VARCHAR(50)     DEFAULT 'completed',
  `reason`        TEXT,
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id`       (`order_id`),
  KEY `refunds_ibfk_2` (`request_id`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`order_id`)   REFERENCES `orders`          (`id`) ON DELETE CASCADE,
  CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `refund_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `refund_requests` WRITE;
INSERT INTO `refund_requests` VALUES
  (1,53,1,4500000,'lỗi',
   '["/uploads/reviews/1771038672882-fda0c754-3c54-4052-9cdf-a34924747479.png"]',
   'approved','Yêu cầu hoàn tiền đã được chấp nhận.','2026-02-14 03:11:13','2026-02-14 03:28:36');
UNLOCK TABLES;

-- =============================================================
-- TABLE: transactions (payment gateway)
-- =============================================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`         BIGINT UNSIGNED NOT NULL,
  `user_id`          BIGINT UNSIGNED DEFAULT NULL,
  `payment_provider` ENUM('vnpay','momo') NOT NULL,
  `transaction_code` VARCHAR(100)    DEFAULT NULL,
  `amount`           DECIMAL(15,2)   NOT NULL,
  `status`           ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `response_data`    JSON            DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id`  (`order_id`),
  KEY `user_id`   (`user_id`),
  KEY `idx_transactions_order_status` (`order_id`,`status`),
  CONSTRAINT `transactions_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `transactions_fk_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: shipments / shipment_items
-- =============================================================
DROP TABLE IF EXISTS `shipment_items`;
DROP TABLE IF EXISTS `shipments`;

CREATE TABLE `shipments` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     BIGINT UNSIGNED NOT NULL,
  `warehouse_id` BIGINT UNSIGNED DEFAULT NULL,
  `tracking_code` VARCHAR(100)   DEFAULT NULL,
  `carrier`      VARCHAR(50)     DEFAULT 'manual',
  `status`       ENUM('pending','shipped','delivered','returned','cancelled') NOT NULL DEFAULT 'pending',
  `shipped_at`   DATETIME        DEFAULT NULL,
  `created_at`   DATETIME        DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_code`      (`tracking_code`),
  KEY `idx_order_id`              (`order_id`),
  KEY `idx_tracking_code`         (`tracking_code`),
  KEY `idx_shipments_status`      (`status`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `shipment_items` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shipment_id`   BIGINT UNSIGNED NOT NULL,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `quantity`      INT             NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shipment_id`   (`shipment_id`),
  KEY `order_item_id` (`order_item_id`),
  CONSTRAINT `shipment_items_ibfk_1` FOREIGN KEY (`shipment_id`)   REFERENCES `shipments`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `shipment_items_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: banners
-- =============================================================
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(255)    NOT NULL,
  `description`      TEXT,
  `image_url`        VARCHAR(1000)   NOT NULL,
  `mobile_image_url` VARCHAR(1000)   DEFAULT NULL,
  `link_url`         VARCHAR(1000)   DEFAULT NULL,
  `link_text`        VARCHAR(100)    DEFAULT NULL,
  `position`         VARCHAR(50)     DEFAULT 'homepage',
  `display_order`    INT             DEFAULT '0',
  `start_date`       TIMESTAMP       NULL DEFAULT NULL,
  `end_date`         TIMESTAMP       NULL DEFAULT NULL,
  `is_active`        TINYINT(1)      DEFAULT '1',
  `click_count`      INT             DEFAULT '0',
  `impression_count` INT             DEFAULT '0',
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_position`     (`position`),
  KEY `idx_active_dates` (`is_active`,`start_date`,`end_date`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `banners` WRITE;
INSERT INTO `banners` VALUES
  (1,'TOAN Store Air Max Collection','Khám phá bộ sưu tập Air Max mới nhất',
   'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/4f37fca8-6bce-43e7-ad07-f57ae3c13142/nike-just-do-it.png',
   NULL,'/shoes','Mua Ngay','homepage',1,'2025-12-09 06:03:21','2026-02-07 06:03:21',1,0,307,'2025-12-09 06:03:21','2026-02-07 12:26:01'),
  (2,'Giảm giá đến 50%','Flash Sale cuối năm',
   'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/23d36c28-01e7-484d-a5d0-cf36209ccdfb/nike-just-do-it.jpg',
   NULL,'/categories','Xem Ngay','homepage',2,'2025-12-09 06:03:21','2026-01-08 06:03:21',1,0,84,'2025-12-09 06:03:21','2026-01-06 23:18:49'),
  (3,'TOAN Store Pro Training','Trang bị cho tập luyện với dòng TOAN Store Pro',
   'https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/fb3a98c1-d98e-44b0-96d4-9c9fe5a1f4e0/nike-just-do-it.jpg',
   NULL,'/clothing','Khám Phá','homepage',3,'2025-12-09 06:03:21','2026-03-09 06:03:21',1,9,768,'2025-12-09 06:03:21','2026-03-06 03:17:05');
UNLOCK TABLES;

-- =============================================================
-- TABLE: stores / store_hours
-- =============================================================
DROP TABLE IF EXISTS `store_hours`;
DROP TABLE IF EXISTS `stores`;

CREATE TABLE `stores` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(255)    NOT NULL,
  `slug`         VARCHAR(255)    NOT NULL,
  `store_code`   VARCHAR(50)     DEFAULT NULL,
  `address`      TEXT            NOT NULL,
  `city`         VARCHAR(100)    NOT NULL,
  `state`        VARCHAR(100)    DEFAULT NULL,
  `country`      VARCHAR(100)    DEFAULT 'Vietnam',
  `postal_code`  VARCHAR(20)     DEFAULT NULL,
  `phone`        VARCHAR(50)     DEFAULT NULL,
  `email`        VARCHAR(255)    DEFAULT NULL,
  `latitude`     DECIMAL(10,8)   DEFAULT NULL,
  `longitude`    DECIMAL(11,8)   DEFAULT NULL,
  `description`  TEXT,
  `features`     JSON            DEFAULT NULL,
  `image_url`    VARCHAR(1000)   DEFAULT NULL,
  `is_active`    TINYINT(1)      DEFAULT '1',
  `opening_date` DATE            DEFAULT NULL,
  `created_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug`       (`slug`),
  UNIQUE KEY `store_code` (`store_code`),
  KEY `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `store_hours` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id`     BIGINT UNSIGNED NOT NULL,
  `day_of_week`  TINYINT         NOT NULL COMMENT '0=Sunday … 6=Saturday',
  `open_time`    TIME            DEFAULT NULL,
  `close_time`   TIME            DEFAULT NULL,
  `is_closed`    TINYINT(1)      DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `store_id` (`store_id`),
  CONSTRAINT `store_hours_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `stores` WRITE;
INSERT INTO `stores` VALUES
  (1,'TOAN Store Vincom Đồng Khởi','toan-vincom-dong-khoi','HCM-VCM01',
   '72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1','Hồ Chí Minh',NULL,'Vietnam',NULL,
   '0283822xxxx','dongkhoi@toanstore.vn',10.77688900,106.70245100,
   'Cửa hàng TOAN Store chính thức tại trung tâm TP.HCM',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),
  (2,'TOAN Store Vincom Mega Mall','toan-vincom-mega-mall','HN-VCM02',
   '458 Minh Khai, Quận Hai Bà Trưng','Hà Nội',NULL,'Vietnam',NULL,
   '02466823xxxx','hanoi@toanstore.vn',20.99916700,105.85888900,
   'Cửa hàng TOAN Store lớn nhất Hà Nội',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),
  (3,'TOAN Store Vincom Center','toan-vincom-center-danang','DN-VCM01',
   '910-912 Ngô Quyền, Quận Sơn Trà','Đà Nẵng',NULL,'Vietnam',NULL,
   '02363822xxxx','danang@toanstore.vn',16.06194400,108.22916700,
   'TOAN Store tại Đà Nẵng',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:28');
UNLOCK TABLES;

LOCK TABLES `store_hours` WRITE;
INSERT INTO `store_hours` VALUES
  (1,1,0,'09:00:00','22:00:00',0),(2,1,1,'09:00:00','22:00:00',0),(3,1,2,'09:00:00','22:00:00',0),
  (4,1,3,'09:00:00','22:00:00',0),(5,1,4,'09:00:00','22:00:00',0),(6,1,5,'09:00:00','22:00:00',0),
  (7,1,6,'09:00:00','23:00:00',0),
  (8,2,0,'09:30:00','22:00:00',0),(9,2,1,'09:30:00','22:00:00',0),(10,2,2,'09:30:00','22:00:00',0),
  (11,2,3,'09:30:00','22:00:00',0),(12,2,4,'09:30:00','22:00:00',0),(13,2,5,'09:30:00','22:00:00',0),
  (14,2,6,'09:30:00','23:00:00',0),
  (15,3,0,'09:00:00','22:00:00',0),(16,3,1,'09:00:00','22:00:00',0),(17,3,2,'09:00:00','22:00:00',0),
  (18,3,3,'09:00:00','22:00:00',0),(19,3,4,'09:00:00','22:00:00',0),(20,3,5,'09:00:00','22:00:00',0),
  (21,3,6,'09:00:00','23:00:00',0);
UNLOCK TABLES;

-- =============================================================
-- TABLE: pages / news / news_comments / news_comment_likes
-- =============================================================
DROP TABLE IF EXISTS `pages`;
CREATE TABLE `pages` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(255)    NOT NULL,
  `slug`             VARCHAR(255)    NOT NULL,
  `content`          LONGTEXT,
  `template`         VARCHAR(100)    DEFAULT 'default',
  `meta_title`       VARCHAR(255)    DEFAULT NULL,
  `meta_description` TEXT,
  `status`           ENUM('draft','published') DEFAULT 'published',
  `created_by`       BIGINT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `created_by`  (`created_by`),
  KEY `idx_slug`    (`slug`),
  CONSTRAINT `pages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `pages` WRITE;
INSERT INTO `pages` VALUES
  (1,'Về TOAN',           'about',          'TOAN là đại lý chính thức của Nike tại Việt Nam.',  'default','Về TOAN Nike Store', 'Tìm hiểu về TOAN','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),
  (2,'Chính sách bảo mật','privacy-policy', 'Chúng tôi cam kết bảo vệ thông tin cá nhân.',       'legal',  'Chính sách bảo mật','Chính sách bảo mật','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),
  (3,'Điều khoản sử dụng','terms-of-use',   'Điều khoản và điều kiện sử dụng website.',           'legal',  'Điều khoản sử dụng','Điều khoản','published',1,'2025-12-06 14:11:35','2026-01-06 08:55:30'),
  (4,'Hướng dẫn mua hàng','guides',         'Hướng dẫn chi tiết cách đặt hàng và thanh toán.',  'guide',  'Hướng dẫn mua hàng','Hướng dẫn mua hàng','published',1,'2025-12-06 14:11:35','2026-01-06 08:56:13');
UNLOCK TABLES;

DROP TABLE IF EXISTS `news_comment_likes`;
DROP TABLE IF EXISTS `news_comments`;
DROP TABLE IF EXISTS `news`;

CREATE TABLE `news` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`        VARCHAR(255)    NOT NULL,
  `slug`         VARCHAR(255)    NOT NULL,
  `excerpt`      TEXT,
  `content`      LONGTEXT        NOT NULL,
  `image_url`    VARCHAR(500)    DEFAULT NULL,
  `category`     VARCHAR(100)    DEFAULT NULL,
  `author_id`    BIGINT UNSIGNED DEFAULT NULL,
  `published_at` TIMESTAMP       NULL DEFAULT NULL,
  `is_published` TINYINT(1)      DEFAULT '0',
  `views`        INT             DEFAULT '0',
  `created_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `author_id`          (`author_id`),
  KEY `idx_news_published` (`is_published`),
  KEY `idx_news_published_at` (`published_at`),
  CONSTRAINT `fk_news_admin_author` FOREIGN KEY (`author_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `news_comments` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `news_id`     BIGINT UNSIGNED NOT NULL,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `parent_id`   BIGINT UNSIGNED DEFAULT NULL,
  `comment`     TEXT            NOT NULL,
  `status`      ENUM('pending','approved','rejected') DEFAULT 'approved',
  `likes_count` INT             DEFAULT '0',
  `is_edited`   TINYINT(1)      DEFAULT '0',
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id`      (`user_id`),
  KEY `idx_news_id`  (`news_id`),
  KEY `idx_status`   (`status`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `fk_news_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `news_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comments_ibfk_1`    FOREIGN KEY (`news_id`)   REFERENCES `news`          (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comments_ibfk_2`    FOREIGN KEY (`user_id`)   REFERENCES `users`         (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `news_comment_likes` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `comment_id` BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_user` (`comment_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `news_comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `news_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comment_likes_ibfk_2` FOREIGN KEY (`user_id`)    REFERENCES `users`         (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `news` WRITE;
INSERT INTO `news` VALUES
  (3,'TOAN','toan','DANG THANH TOAN','TOAN',
   'https://static.nike.com/a/images/q_auto:eco/t_product_v1/f_auto/dpr_1.5/h_381,c_limit/f9f098e2-5a18-4e52-990f-b9cc09357fbc/air-max-dn8-leather-shoes-bYfKK6Qb.png',
   'Sản Phẩm',1,'2026-02-01 05:40:49',1,34,'2026-02-01 12:40:48','2026-03-05 03:06:56');
UNLOCK TABLES;

LOCK TABLES `news_comments` WRITE;
INSERT INTO `news_comments` VALUES
  (2,3,1,NULL,'ok','approved',1,0,'2026-03-01 04:48:55','2026-03-01 04:48:59'),
  (3,3,1,2,  'ko','approved',0,0,'2026-03-01 04:49:04','2026-03-01 04:49:11');
UNLOCK TABLES;

LOCK TABLES `news_comment_likes` WRITE;
INSERT INTO `news_comment_likes` VALUES (2,2,1,'2026-03-01 04:48:59');
UNLOCK TABLES;

-- =============================================================
-- TABLE: newsletter_subscriptions
-- =============================================================
DROP TABLE IF EXISTS `newsletter_subscriptions`;
CREATE TABLE `newsletter_subscriptions` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`            VARCHAR(255)    NOT NULL,
  `name`             VARCHAR(255)    DEFAULT NULL,
  `status`           ENUM('active','unsubscribed','bounced') DEFAULT 'active',
  `user_id`          BIGINT UNSIGNED DEFAULT NULL,
  `subscribed_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at`  TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email`   (`email`),
  KEY `user_id`        (`user_id`),
  KEY `idx_email`      (`email`),
  CONSTRAINT `newsletter_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `newsletter_subscriptions` WRITE;
INSERT INTO `newsletter_subscriptions` VALUES
  (1,'customer1@example.com','Nguyễn Văn A','active',NULL,'2025-12-06 14:11:35',NULL),
  (2,'customer2@example.com','Trần Thị B',  'active',NULL,'2025-12-06 14:11:35',NULL),
  (3,'customer3@example.com','Lê Văn C',    'active',NULL,'2025-12-06 14:11:35',NULL),
  (4,'customer4@example.com','Phạm Thị D',  'active',NULL,'2025-12-06 14:11:35',NULL),
  (5,'customer5@example.com','Hoàng Văn E', 'active',NULL,'2025-12-06 14:11:35',NULL),
  (7,'thanhtoan06092004@gmail.com',NULL,    'active',NULL,'2026-01-29 14:05:14',NULL);
UNLOCK TABLES;

-- =============================================================
-- TABLE: contact_messages
-- =============================================================
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255)    NOT NULL,
  `email`       VARCHAR(255)    NOT NULL,
  `subject`     VARCHAR(500)    NOT NULL,
  `message`     TEXT            NOT NULL,
  `status`      ENUM('new','read','replied','in_progress','resolved','closed') DEFAULT 'new',
  `user_id`     BIGINT UNSIGNED DEFAULT NULL,
  `admin_notes` TEXT,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contact_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `contact_messages` WRITE;
INSERT INTO `contact_messages` VALUES
  (5,'DANG THANH TOAN','thanhtoan06092004@gmail.com','order','thanhtoan06092004','replied',NULL,NULL,'2025-12-07 02:18:08','2026-02-03 05:39:11'),
  (6,'DANG THANH TOAN','admin@gmail.com','product','okokokokok','replied',NULL,NULL,'2025-12-07 02:53:46','2026-02-01 12:46:59');
UNLOCK TABLES;

-- =============================================================
-- TABLE: faq_categories / faqs
-- =============================================================
DROP TABLE IF EXISTS `faqs`;
DROP TABLE IF EXISTS `faq_categories`;

CREATE TABLE `faq_categories` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)    NOT NULL,
  `slug`        VARCHAR(255)    NOT NULL,
  `description` TEXT,
  `icon`        VARCHAR(100)    DEFAULT NULL,
  `position`    INT             DEFAULT '0',
  `is_active`   TINYINT(1)      DEFAULT '1',
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `faqs` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`   BIGINT UNSIGNED NOT NULL,
  `question`      VARCHAR(500)    NOT NULL,
  `answer`        TEXT            NOT NULL,
  `position`      INT             DEFAULT '0',
  `is_active`     TINYINT(1)      DEFAULT '1',
  `helpful_count` INT             DEFAULT '0',
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `faqs_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `faq_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `faq_categories` WRITE;
INSERT INTO `faq_categories` VALUES
  (1,'Đặt hàng','order',  'Câu hỏi về quy trình đặt hàng','shopping-cart',1,1,'2025-12-06 14:11:35'),
  (2,'Vận chuyển','shipping','Thông tin về vận chuyển',   'truck',2,1,'2025-12-06 14:11:35'),
  (3,'Thanh toán','payment','Các phương thức thanh toán', 'credit-card',3,1,'2025-12-06 14:11:35'),
  (4,'Đổi trả',  'returns','Chính sách đổi trả hàng',     'refresh',4,1,'2025-12-06 14:11:35'),
  (5,'Sản phẩm', 'products','Thông tin về sản phẩm',      'box',5,1,'2025-12-06 14:11:35');
UNLOCK TABLES;

LOCK TABLES `faqs` WRITE;
INSERT INTO `faqs` VALUES
  (1,1,'Làm thế nào để đặt hàng ?','Bạn có thể đặt hàng trực tuyến qua website.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:47:35'),
  (2,1,'Tôi có thể hủy đơn hàng không ?','Bạn có thể hủy đơn trong vòng 24 giờ.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:04'),
  (3,2,'Thời gian giao hàng là bao lâu ?','Tiêu chuẩn 2–5 ngày làm việc.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:30'),
  (4,2,'Chi phí vận chuyển là bao nhiêu ?','Phí vận chuyển 30.000đ cho đơn nhỏ.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:45'),
  (5,3,'Có những phương thức thanh toán nào ?','COD, chuyển khoản, ví điện tử.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:16'),
  (6,4,'Chính sách đổi trả như thế nào ?','Đổi trả trong 30 ngày còn nguyên tem.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:40'),
  (7,5,'Làm sao kiểm tra sản phẩm chính hãng ?','Tất cả sản phẩm tại TOAN đều chính hãng.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:50:12');
UNLOCK TABLES;

-- =============================================================
-- TABLE: support_chats / support_messages
-- =============================================================
DROP TABLE IF EXISTS `support_messages`;
DROP TABLE IF EXISTS `support_chats`;

CREATE TABLE `support_chats` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          BIGINT UNSIGNED DEFAULT NULL,
  `guest_email`      VARCHAR(255)    DEFAULT NULL,
  `guest_name`       VARCHAR(255)    DEFAULT NULL,
  `status`           ENUM('active','waiting','resolved','closed') DEFAULT 'waiting',
  `access_token`     VARCHAR(255)    DEFAULT NULL,
  `assigned_admin_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_message_at`  TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_admin_id`       (`assigned_admin_id`),
  KEY `idx_status`              (`status`),
  KEY `idx_user`                (`user_id`),
  KEY `idx_updated`             (`updated_at`),
  KEY `idx_last_message`        (`last_message_at`),
  KEY `idx_access_token`        (`access_token`),
  KEY `idx_status_last_message` (`status`,`last_message_at` DESC),
  KEY `idx_assigned_status`     (`assigned_admin_id`,`status`),
  CONSTRAINT `support_chats_ibfk_1` FOREIGN KEY (`user_id`)          REFERENCES `users`       (`id`) ON DELETE SET NULL,
  CONSTRAINT `support_chats_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `support_messages` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id`     BIGINT UNSIGNED NOT NULL,
  `sender_type` ENUM('customer','admin') NOT NULL,
  `sender_id`   BIGINT UNSIGNED DEFAULT NULL,
  `message`     TEXT            NOT NULL,
  `image_url`   VARCHAR(255)    DEFAULT NULL,
  `is_read`     TINYINT(1)      DEFAULT '0',
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id`    (`sender_id`),
  KEY `idx_chat`     (`chat_id`),
  KEY `idx_created`  (`created_at`),
  KEY `idx_read`     (`is_read`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`chat_id`)   REFERENCES `support_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users`         (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `support_chats` WRITE;
INSERT INTO `support_chats` VALUES
  (11,1,NULL,NULL,'resolved',NULL,NULL,  '2026-02-07 14:16:44','2026-03-06 06:52:16','2026-02-07 14:19:37'),
  (14,1,NULL,NULL,'resolved',NULL,1,     '2026-02-09 00:04:26','2026-02-10 09:17:35','2026-02-10 09:17:28'),
  (15,1,NULL,NULL,'resolved',NULL,1,     '2026-02-09 00:04:26','2026-02-10 09:17:46','2026-02-10 09:15:55'),
  (16,1,NULL,NULL,'resolved',NULL,1,     '2026-02-10 09:24:24','2026-02-10 09:30:34','2026-02-10 09:24:32'),
  (17,1,NULL,NULL,'resolved',NULL,1,     '2026-02-10 09:24:24','2026-02-10 09:30:44','2026-02-10 09:24:24'),
  (18,1,NULL,NULL,'resolved',NULL,1,     '2026-02-10 09:30:56','2026-02-10 09:32:01','2026-02-10 09:31:12'),
  (19,1,NULL,NULL,'resolved',NULL,1,     '2026-02-10 09:32:14','2026-02-10 09:32:37','2026-02-10 09:32:14');
UNLOCK TABLES;

LOCK TABLES `support_messages` WRITE;
INSERT INTO `support_messages` VALUES
  (15,11,'customer',1,'Xin chào, tôi cần hỗ trợ!',NULL,1,'2026-02-07 14:16:44'),
  (16,11,'admin',   1,'ok',NULL,1,'2026-02-07 14:18:55'),
  (17,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:15'),
  (18,11,'admin',   1,'ok',NULL,1,'2026-02-07 14:19:27'),
  (19,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:37'),
  (20,15,'admin',   1,'hi',NULL,1,'2026-02-10 09:15:55'),
  (21,14,'customer',1,'hi',NULL,1,'2026-02-10 09:16:03'),
  (22,14,'admin',   1,'hi',NULL,1,'2026-02-10 09:16:15'),
  (25,14,'admin',   1,'ok',NULL,1,'2026-02-10 09:17:28'),
  (26,16,'customer',1,'hi',NULL,1,'2026-02-10 09:24:32'),
  (27,18,'customer',1,'hi',NULL,1,'2026-02-10 09:30:58'),
  (28,18,'admin',   1,'ok',NULL,1,'2026-02-10 09:31:12');
UNLOCK TABLES;

-- =============================================================
-- TABLE: search_analytics
-- =============================================================
DROP TABLE IF EXISTS `search_analytics`;
CREATE TABLE `search_analytics` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `query`              VARCHAR(255)    NOT NULL,
  `category_filter`    VARCHAR(100)    DEFAULT NULL,
  `results_count`      INT             DEFAULT '0',
  `processing_time_ms` INT             DEFAULT '0',
  `user_id`            BIGINT UNSIGNED DEFAULT NULL,
  `ip_address`         VARCHAR(45)     DEFAULT NULL,
  `created_at`         TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query`            (`query`),
  KEY `idx_created_at`       (`created_at`),
  KEY `idx_query_created`    (`query`,`created_at` DESC),
  KEY `idx_category_created` (`category_filter`,`created_at` DESC),
  KEY `idx_user_created`     (`user_id`,`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: daily_metrics  [ARC-05] + Trigger
-- =============================================================
DROP TABLE IF EXISTS `daily_metrics`;
CREATE TABLE `daily_metrics` (
  `date`             DATE          NOT NULL,
  `revenue`          DECIMAL(15,2) DEFAULT '0.00',
  `orders_count`     INT           DEFAULT '0',
  `customers_count`  INT           DEFAULT '0',
  `cancelled_count`  INT           DEFAULT '0',
  `total_cost`       DECIMAL(15,2) DEFAULT '0.00',
  `net_profit`       DECIMAL(15,2) DEFAULT '0.00',
  `updated_at`       TIMESTAMP     NULL DEFAULT (NOW()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [ARC-05] Trigger: auto-update daily_metrics when order is delivered
DROP TRIGGER IF EXISTS `trg_order_delivered_metrics`;
DELIMITER //
CREATE TRIGGER `trg_order_delivered_metrics`
AFTER UPDATE ON `orders`
FOR EACH ROW
BEGIN
  IF NEW.`status` = 'delivered' AND OLD.`status` != 'delivered' THEN
    INSERT INTO `daily_metrics` (`date`, `revenue`, `orders_count`, `updated_at`)
    VALUES (DATE(NEW.`placed_at`), NEW.`total`, 1, NOW())
    ON DUPLICATE KEY UPDATE
      `revenue`      = `revenue`      + NEW.`total`,
      `orders_count` = `orders_count` + 1,
      `updated_at`   = NOW();
  END IF;
  IF NEW.`status` = 'cancelled' AND OLD.`status` != 'cancelled' THEN
    INSERT INTO `daily_metrics` (`date`, `cancelled_count`, `updated_at`)
    VALUES (DATE(NEW.`placed_at`), 1, NOW())
    ON DUPLICATE KEY UPDATE
      `cancelled_count` = `cancelled_count` + 1,
      `updated_at`      = NOW();
  END IF;
END//
DELIMITER ;

-- Seed only verified delivered orders
LOCK TABLES `daily_metrics` WRITE;
INSERT INTO `daily_metrics` VALUES
  ('2025-12-07',  7858000,2,1,1,0,  7858000,'2026-03-07 00:00:00'),
  ('2026-01-30', 13307800,4,1,0,0, 13307800,'2026-03-07 00:00:00'),
  ('2026-02-05',  2970450,1,1,0,0,  2970450,'2026-03-07 00:00:00'),
  ('2026-02-14',  4170260,1,1,0,0,  4170260,'2026-03-07 00:00:00');
UNLOCK TABLES;

-- =============================================================
-- TABLE: admin_activity_logs / security_logs / system_logs
-- =============================================================
DROP TABLE IF EXISTS `admin_activity_logs`;
CREATE TABLE `admin_activity_logs` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `action`        VARCHAR(255)    NOT NULL,
  `entity_type`   VARCHAR(100)    DEFAULT NULL,
  `entity_id`     BIGINT UNSIGNED DEFAULT NULL,
  `old_values`    JSON            DEFAULT NULL,
  `new_values`    JSON            DEFAULT NULL,
  `ip_address`    VARCHAR(45)     DEFAULT NULL,
  `user_agent`    TEXT,
  `created_at`    TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_user`     (`admin_user_id`),
  KEY `idx_created_at`     (`created_at`),
  KEY `idx_entity_created` (`entity_type`,`entity_id`,`created_at` DESC),
  KEY `idx_action_created` (`action`,`created_at` DESC),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `admin_activity_logs` WRITE;
INSERT INTO `admin_activity_logs` VALUES
  (14,1,'update_voucher','vouchers',3,NULL,'{"code":"WELCOME-NEW","status":"active"}','127.0.0.1',NULL,'2026-02-14 06:38:49'),
  (15,1,'update_voucher','vouchers',2,NULL,'{"code":"REF-SIGN100","status":"active"}','127.0.0.1',NULL,'2026-02-14 06:42:24'),
  (16,1,'update_voucher','vouchers',1,NULL,'{"code":"GIFT2024-001","status":"active"}','127.0.0.1',NULL,'2026-02-14 06:42:32'),
  (26,1,'create_voucher','vouchers',4,'{"code":"TOAN","value":100000}','{}','system',NULL,'2026-03-01 13:38:09'),
  (29,1,'create_voucher','vouchers',8,'{"code":"ABCD","value":10000000}','{}','system',NULL,'2026-03-01 14:53:56');
UNLOCK TABLES;

DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL,
  `admin_id`    BIGINT UNSIGNED DEFAULT NULL,
  `event_type`  VARCHAR(100)    NOT NULL,
  `ip_address`  VARCHAR(45)     DEFAULT NULL,
  `user_agent`  TEXT,
  `details`     JSON            DEFAULT NULL,
  `status`      VARCHAR(50)     DEFAULT NULL,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event`   (`event_type`),
  KEY `idx_ip`      (`ip_address`),
  KEY `idx_user`    (`user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_security_event_time` (`event_type`,`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Security logs are runtime data; no seed required.

DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `level`      VARCHAR(20)  NOT NULL DEFAULT 'ERROR',
  `message`    TEXT         NOT NULL,
  `details`    JSON         DEFAULT NULL,
  `created_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: settings / system_config
-- =============================================================
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(255)    NOT NULL,
  `value`      TEXT,
  `updated_at` TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `settings` WRITE;
INSERT INTO `settings` VALUES
  (1, 'store_name',                   'TOAN STORE',  '2026-01-27 08:06:42'),
  (2, 'store_email',                  'support@toanstore.com','2026-01-27 08:06:42'),
  (3, 'store_phone',                  '0123456789',  '2026-01-27 08:06:42'),
  (4, 'store_address',                '123 Main Street','2026-01-27 08:06:42'),
  (5, 'store_city',                   'Hanoi',       '2026-01-27 08:06:42'),
  (6, 'store_country',                'Vietnam',     '2026-01-27 08:06:42'),
  (7, 'store_currency',               'VND',         '2026-01-27 08:06:42'),
  (8, 'tax_rate',                     '0.1',         '2026-01-27 08:06:42'),
  (9, 'shipping_cost_domestic',       '30000',       '2026-01-27 08:06:42'),
  (10,'shipping_cost_international',  '100000',      '2026-01-27 08:06:42'),
  (11,'maintenance_mode',             'false',       '2026-02-01 12:38:21');
UNLOCK TABLES;

DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(255)    NOT NULL,
  `value`       TEXT,
  `description` VARCHAR(255)    DEFAULT NULL,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `system_config` WRITE;
INSERT INTO `system_config` VALUES
  (1, 'site_name',             'TOAN Store',    'Website name',                    '2025-12-06 14:11:35'),
  (2, 'site_email',            'support@toanstore.com','Contact email',            '2025-12-06 14:11:35'),
  (3, 'site_phone',            '1900-xxxx',     'Contact phone',                   '2025-12-06 14:11:35'),
  (4, 'currency',              'VND',           'Default currency',                '2025-12-06 14:11:35'),
  (5, 'tax_rate',              '10',            'Tax rate percentage',             '2025-12-06 14:11:35'),
  (6, 'shipping_fee',          '30000',         'Default shipping fee',            '2025-12-06 14:11:35'),
  (7, 'free_shipping_threshold','500000',        'Minimum order for free shipping', '2025-12-06 14:11:35'),
  (8, 'order_prefix',          'NK',            'Order number prefix',             '2025-12-06 14:11:35'),
  (9, 'products_per_page',     '12',            'Products per page',               '2025-12-06 14:11:35'),
  (10,'facebook_pixel_id',     '',              'Facebook Pixel ID',               '2025-12-06 14:11:35'),
  (11,'google_analytics_id',   '',              'Google Analytics ID',             '2025-12-06 14:11:35');
UNLOCK TABLES;

-- =============================================================
-- TABLE: payment_methods
-- =============================================================
DROP TABLE IF EXISTS `payment_methods`;
CREATE TABLE `payment_methods` (
  `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`      VARCHAR(100)    NOT NULL,
  `name`      VARCHAR(255)    NOT NULL,
  `config`    JSON            DEFAULT NULL,
  `is_active` TINYINT(1)      DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `payment_methods` WRITE;
INSERT INTO `payment_methods` VALUES
  (1,'cod',          'Thanh toán khi nhận hàng',  '{"description":"Thanh toán tiền mặt khi nhận"}',1),
  (2,'bank_transfer','Chuyển khoản ngân hàng',     '{"banks":["Vietcombank","Techcombank","VPBank"]}',1),
  (3,'momo',         'Ví điện tử Momo',            '{"api_endpoint":"https://payment.momo.vn"}',1),
  (4,'vnpay',        'Cổng thanh toán VNPay',      '{"api_endpoint":"https://sandbox.vnpayment.vn"}',1),
  (5,'zalopay',      'ZaloPay',                    '{"api_endpoint":"https://zalopay.vn"}',1);
UNLOCK TABLES;

-- =============================================================
-- TABLE: password_resets / data_requests / user_consents
-- TABLE: seo_metadata / cookie_consents
-- =============================================================
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(255) NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used`       TINYINT(1)   DEFAULT '0',
  `created_at` TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token`      (`token`),
  KEY `idx_email`      (`email`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `data_requests`;
CREATE TABLE `data_requests` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `request_type` ENUM('export','delete') NOT NULL,
  `status`       ENUM('pending','processing','completed','failed','rejected') DEFAULT 'pending',
  `admin_notes`  TEXT,
  `completed_at` TIMESTAMP       NULL DEFAULT NULL,
  `created_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id`    (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `data_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_consents`;
CREATE TABLE `user_consents` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `consent_type` VARCHAR(50)     NOT NULL,
  `is_granted`   TINYINT(1)      DEFAULT '0',
  `granted_at`   TIMESTAMP       NULL DEFAULT NULL,
  `revoked_at`   TIMESTAMP       NULL DEFAULT NULL,
  `ip_address`   VARCHAR(45)     DEFAULT NULL,
  `user_agent`   TEXT,
  `created_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_consent_type` (`user_id`,`consent_type`),
  CONSTRAINT `user_consents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `seo_metadata`;
CREATE TABLE `seo_metadata` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type`     ENUM('product','category','collection','page') NOT NULL,
  `entity_id`       BIGINT UNSIGNED NOT NULL,
  `title`           VARCHAR(255)    DEFAULT NULL,
  `description`     TEXT,
  `keywords`        VARCHAR(500)    DEFAULT NULL,
  `og_image_url`    VARCHAR(1000)   DEFAULT NULL,
  `canonical_url`   VARCHAR(500)    DEFAULT NULL,
  `structured_data` JSON            DEFAULT NULL,
  `created_at`      TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `cookie_consents`;
CREATE TABLE `cookie_consents` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`  VARCHAR(100)    NOT NULL,
  `preferences` JSON            NOT NULL,
  `ip_address`  VARCHAR(45)     DEFAULT NULL,
  `user_agent`  TEXT,
  `created_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- Restore session variables
-- =============================================================
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- =============================================================
-- END OF DUMP — toan_store v2.0
-- Next steps:
--   1. Run `npm run seed:admin` to create the manager account
--   2. Run `npm run gift-card:rehash` to replace REPLACE_WITH_SHA2_HASH_*
--      placeholders with SHA2(card_number + APP_PEPPER, 256)
--   3. Schedule aggregate-metrics.ts as a daily cron (fallback for trigger)
--   4. Phase-2 migration: stop writing to deprecated orders columns
--   5. Phase-3 migration: DROP deprecated orders columns
-- =============================================================