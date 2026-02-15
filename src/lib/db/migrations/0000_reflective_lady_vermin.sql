CREATE TABLE `admin_activity_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`admin_user_id` bigint unsigned,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100),
	`entity_id` varchar(100),
	`old_values` json,
	`new_values` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `admin_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`full_name` varchar(255),
	`role` enum('super_admin','admin','manager','support') DEFAULT 'admin',
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_username_unique` UNIQUE(`username`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(255),
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_name_unique` UNIQUE(`name`),
	CONSTRAINT `brands_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`parent_id` bigint unsigned,
	`name` varchar(200) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image_url` varchar(1000),
	`position` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`meta_title` varchar(255),
	`meta_description` text,
	`created_at` timestamp DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_variant_id` bigint unsigned NOT NULL,
	`warehouse_id` bigint unsigned,
	`quantity` int NOT NULL DEFAULT 0,
	`reserved` int NOT NULL DEFAULT 0,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned,
	`product_variant_id` bigint unsigned,
	`product_name` varchar(500) NOT NULL,
	`sku` varchar(100),
	`size` varchar(10) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2),
	`total_price` decimal(12,2),
	`cost_price` decimal(12,2) DEFAULT '0.00',
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`order_number` varchar(100) NOT NULL,
	`status` enum('pending','pending_payment_confirmation','payment_received','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`shipping_fee` decimal(12,2) DEFAULT '0.00',
	`discount` decimal(12,2) DEFAULT '0.00',
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
	`phone` varchar(255),
	`email` varchar(255),
	`payment_method` varchar(50) DEFAULT 'cod',
	`payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
	`placed_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`sku` varchar(200),
	`size` varchar(20),
	`color` varchar(100),
	`attributes` json,
	`price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(500) NOT NULL,
	`slug` varchar(512) NOT NULL,
	`short_description` text,
	`description` longtext,
	`brand_id` bigint unsigned,
	`category_id` bigint unsigned,
	`collection_id` bigint unsigned,
	`base_price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`retail_price` decimal(12,2),
	`cost_price` decimal(12,2) DEFAULT '0.00',
	`is_active` tinyint DEFAULT 1,
	`is_featured` tinyint DEFAULT 0,
	`is_new_arrival` tinyint DEFAULT 1,
	`view_count` int DEFAULT 0,
	`sale_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `support_chats` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`guest_email` varchar(255),
	`guest_name` varchar(255),
	`status` enum('waiting','active','resolved','closed') DEFAULT 'waiting',
	`access_token` varchar(255),
	`last_message_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `support_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`chat_id` bigint unsigned NOT NULL,
	`sender_type` enum('customer','admin') NOT NULL,
	`sender_id` bigint unsigned,
	`message` text,
	`image_url` varchar(500),
	`is_read` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255),
	`first_name` varchar(100),
	`last_name` varchar(100),
	`phone` varchar(50),
	`date_of_birth` timestamp,
	`gender` enum('male','female','other'),
	`accumulated_points` int DEFAULT 0,
	`membership_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
	`is_active` tinyint DEFAULT 1,
	`is_verified` tinyint DEFAULT 0,
	`is_banned` tinyint DEFAULT 0,
	`google_id` varchar(255),
	`facebook_id` varchar(255),
	`avatar_url` varchar(1000),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`),
	CONSTRAINT `users_facebook_id_unique` UNIQUE(`facebook_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_deleted_at` ON `categories` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_is_active` ON `products` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_is_featured` ON `products` (`is_featured`);--> statement-breakpoint
CREATE INDEX `idx_deleted_at` ON `products` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_deleted_at` ON `users` (`deleted_at`);