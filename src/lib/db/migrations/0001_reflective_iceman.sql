CREATE TABLE `banners` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`image_url` varchar(1000) NOT NULL,
	`mobile_image_url` varchar(1000),
	`link_url` varchar(1000),
	`link_text` varchar(100),
	`position` varchar(50) DEFAULT 'homepage',
	`display_order` int DEFAULT 0,
	`start_date` timestamp,
	`end_date` timestamp,
	`is_active` tinyint DEFAULT 1,
	`click_count` int DEFAULT 0,
	`impression_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`cart_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`product_variant_id` bigint unsigned,
	`size` varchar(10) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`price` decimal(12,2) NOT NULL,
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`session_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expires_at` timestamp,
	CONSTRAINT `carts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`description` varchar(255),
	`discount_type` enum('fixed','percent') DEFAULT 'fixed',
	`discount_value` decimal(12,2) NOT NULL,
	`min_order_amount` decimal(12,2),
	`max_discount_amount` decimal(12,2),
	`starts_at` timestamp,
	`ends_at` timestamp,
	`usage_limit` int,
	`usage_limit_per_user` int,
	`created_at` timestamp DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `daily_metrics` (
	`date` timestamp NOT NULL,
	`revenue` decimal(15,2) DEFAULT '0.00',
	`orders_count` int DEFAULT 0,
	`customers_count` int DEFAULT 0,
	`cancelled_count` int DEFAULT 0,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_metrics_date` PRIMARY KEY(`date`)
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`question` text NOT NULL,
	`answer` longtext NOT NULL,
	`position` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flash_sales` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`status` enum('upcoming','active','ended','cancelled') DEFAULT 'upcoming',
	`created_at` timestamp DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `flash_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`summary` text,
	`content` longtext,
	`thumbnail_url` varchar(1000),
	`category_id` bigint unsigned,
	`author_id` bigint unsigned,
	`is_active` tinyint DEFAULT 1,
	`published_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`status` enum('subscribed','unsubscribed') DEFAULT 'subscribed',
	`token` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `newsletter_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscriptions_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` longtext,
	`is_active` tinyint DEFAULT 1,
	`meta_title` varchar(255),
	`meta_description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`color_id` bigint unsigned,
	`url` varchar(1000) NOT NULL,
	`alt_text` varchar(255),
	`position` int DEFAULT 0,
	`is_main` tinyint DEFAULT 0,
	`media_type` varchar(50) DEFAULT 'image',
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`rating` tinyint NOT NULL,
	`comment` text,
	`author_name` varchar(255),
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`is_featured` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `product_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_role_id_permission_id_unique` UNIQUE(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `security_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`admin_id` bigint unsigned,
	`event_type` varchar(100) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`details` json,
	`status` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `security_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_metadata` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`entity_type` enum('product','category','collection','page') NOT NULL,
	`entity_id` bigint unsigned NOT NULL,
	`title` varchar(255),
	`description` text,
	`keywords` varchar(500),
	`og_image_url` varchar(1000),
	`canonical_url` varchar(500),
	`structured_data` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seo_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `seo_metadata_entity_type_entity_id_unique` UNIQUE(`entity_type`,`entity_id`)
);
--> statement-breakpoint
CREATE TABLE `store_hours` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`store_id` bigint unsigned NOT NULL,
	`day_of_week` tinyint NOT NULL,
	`open_time` varchar(5),
	`close_time` varchar(5),
	`is_closed` tinyint DEFAULT 0,
	CONSTRAINT `store_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(50),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`wishlist_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `wishlist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`name` varchar(255) DEFAULT 'My Wishlist',
	`is_default` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_users` ADD `role_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `admin_users` DROP COLUMN `role`;