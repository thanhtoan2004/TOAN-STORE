-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: nike_clone
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_migrations`
--

DROP TABLE IF EXISTS `_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES (1,'001_baseline.sql','2026-02-13 07:03:50'),(2,'002_create_warehouses_table.sql','2026-02-13 07:06:12'),(3,'003_add_inventory_column.sql','2026-02-13 07:08:54'),(4,'004_update_inventory_data.sql','2026-02-13 07:08:54'),(5,'003_skip.sql','2026-02-13 07:10:57'),(6,'0000_reflective_lady_vermin.sql','2026-02-15 12:20:10'),(7,'0001_reflective_iceman.sql','2026-02-15 12:20:10');
/*!40000 ALTER TABLE `_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_activity_logs`
--

DROP TABLE IF EXISTS `admin_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint unsigned NOT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_user` (`admin_user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_activity_logs`
--

LOCK TABLES `admin_activity_logs` WRITE;
/*!40000 ALTER TABLE `admin_activity_logs` DISABLE KEYS */;
INSERT INTO `admin_activity_logs` VALUES (8,1,'soft_delete_flash_sale','flash_sales',10,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:29'),(9,1,'soft_delete_flash_sale','flash_sales',9,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:33'),(10,1,'soft_delete_flash_sale','flash_sales',7,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:36'),(11,1,'soft_delete_flash_sale','flash_sales',6,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:41'),(12,1,'soft_delete_flash_sale','flash_sales',5,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:46'),(13,1,'create_shipment','shipments',1,NULL,'{\"items\": [{\"quantity\": 1, \"orderItemId\": 43}], \"orderId\": 45}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:24:33'),(14,1,'update_voucher','vouchers',3,NULL,'{\"code\": \"WELCOME-NEW\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:38:49'),(15,1,'update_voucher','vouchers',2,NULL,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:42:24'),(16,1,'update_voucher','vouchers',1,NULL,'{\"code\": \"GIFT2024-001\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:42:32'),(17,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:16:50'),(18,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:35:55'),(19,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:43:43'),(20,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:44:39'),(21,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:46:16');
/*!40000 ALTER TABLE `admin_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_audit_logs`
--

DROP TABLE IF EXISTS `admin_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` varchar(100) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_target` (`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_audit_logs`
--

LOCK TABLES `admin_audit_logs` WRITE;
/*!40000 ALTER TABLE `admin_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','admin','manager','support') DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin','admin@nike.com','$2b$10$CTpJGqihD7OewkHcHf8rXuvQ/uLWlC3Imm6AoMpIv06db78INhiWi','System Administrator','super_admin',1,NULL,'2025-12-06 14:11:35','2026-02-15 12:29:37',4),(2,'manager','manager@nike.com','$2a$10$YourHashedPasswordHere','Store Manager','manager',1,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attribute_options`
--

DROP TABLE IF EXISTS `attribute_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attribute_options` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attribute_id` bigint unsigned NOT NULL,
  `value` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `attribute_options_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attribute_options`
--

LOCK TABLES `attribute_options` WRITE;
/*!40000 ALTER TABLE `attribute_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `attribute_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attribute_values`
--

DROP TABLE IF EXISTS `attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attribute_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attribute_id` bigint unsigned NOT NULL,
  `value` varchar(255) NOT NULL,
  `position` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `category_attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attribute_values`
--

LOCK TABLES `attribute_values` WRITE;
/*!40000 ALTER TABLE `attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attributes`
--

DROP TABLE IF EXISTS `attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attributes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `type` enum('text','number','select','color','boolean') DEFAULT 'text',
  `is_filterable` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attributes`
--

LOCK TABLES `attributes` WRITE;
/*!40000 ALTER TABLE `attributes` DISABLE KEYS */;
/*!40000 ALTER TABLE `attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(1000) NOT NULL,
  `mobile_image_url` varchar(1000) DEFAULT NULL,
  `link_url` varchar(1000) DEFAULT NULL,
  `link_text` varchar(100) DEFAULT NULL,
  `position` varchar(50) DEFAULT 'homepage',
  `display_order` int DEFAULT '0',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `click_count` int DEFAULT '0',
  `impression_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_position` (`position`),
  KEY `idx_active_dates` (`is_active`,`start_date`,`end_date`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'Nike Air Max Collection','Khám phá bộ sưu tập Air Max mới nhất với công nghệ đệm khí tiên tiến','https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/4f37fca8-6bce-43e7-ad07-f57ae3c13142/nike-just-do-it.png',NULL,'/shoes','Mua Ngay','homepage',1,'2025-12-09 06:03:21','2026-02-07 06:03:21',1,0,307,'2025-12-09 06:03:21','2026-02-07 12:26:01'),(2,'Giảm giá đến 50%','Flash Sale cuối năm - Ưu đãi cực lớn cho các sản phẩm chọn lọc','https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/23d36c28-01e7-484d-a5d0-cf36209ccdfb/nike-just-do-it.jpg',NULL,'/categories','Xem Ngay','homepage',2,'2025-12-09 06:03:21','2026-01-08 06:03:21',1,0,84,'2025-12-09 06:03:21','2026-01-06 23:18:49'),(3,'Nike Pro Training','Trang bị cho tập luyện với dòng sản phẩm Nike Pro','https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/fb3a98c1-d98e-44b0-96d4-9c9fe5a1f4e0/nike-just-do-it.jpg',NULL,'/clothing','Khám Phá','homepage',3,'2025-12-09 06:03:21','2026-03-09 06:03:21',1,9,415,'2025-12-09 06:03:21','2026-02-14 12:40:38'),(4,'TOAN Store','','https://static.nike.com/a/images/q_auto:eco/t_product_v1/f_auto/dpr_1.5/h_381,c_limit/12359d89-6050-4d71-b487-d31e3b9ea564/ja-3-lunar-new-year-ep-basketball-shoes-s5LwQ251.png','','http://localhost:3000/TOAN Store','','homepage',1,NULL,NULL,1,0,260,'2026-01-30 02:00:14','2026-02-14 12:40:38');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Nike','nike','Just Do It','2025-12-06 14:11:35'),(2,'Jordan','jordan','Air Jordan Brand','2025-12-06 14:11:35'),(3,'Nike SB','nike-sb','Nike Skateboarding','2025-12-06 14:11:35');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `product_variant_id` bigint unsigned DEFAULT NULL,
  `size` varchar(10) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(12,2) NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cart_id` (`cart_id`),
  KEY `product_id` (`product_id`),
  KEY `product_variant_id` (`product_variant_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,1,NULL,'2025-12-06 15:36:05','2025-12-06 15:36:05',NULL),(2,2,NULL,'2025-12-08 01:58:20','2025-12-08 01:58:20',NULL);
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(1000) DEFAULT NULL,
  `position` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Running','running','Running shoes and apparel',NULL,1,1,NULL,NULL,'2025-12-06 14:11:35',NULL),(2,NULL,'Basketball','basketball','Basketball shoes and gear',NULL,2,1,NULL,NULL,'2025-12-06 14:11:35',NULL),(3,NULL,'Training','training','Training and gym equipment',NULL,3,1,NULL,NULL,'2025-12-06 14:11:35',NULL),(4,NULL,'Lifestyle','lifestyle','Casual and lifestyle products',NULL,4,1,NULL,NULL,'2025-12-06 14:11:35',NULL),(5,NULL,'Jordan','jordan','Air Jordan collection',NULL,5,1,NULL,NULL,'2025-12-06 14:11:35',NULL),(6,NULL,'Football','football','Football boots and equipment',NULL,6,1,NULL,NULL,'2025-12-06 14:11:35',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_attributes`
--

DROP TABLE IF EXISTS `category_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_attributes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(200) NOT NULL,
  `input_type` varchar(50) DEFAULT 'text',
  `is_filterable` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `category_attributes_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_attributes`
--

LOCK TABLES `category_attributes` WRITE;
/*!40000 ALTER TABLE `category_attributes` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collections`
--

DROP TABLE IF EXISTS `collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `collections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collections`
--

LOCK TABLES `collections` WRITE;
/*!40000 ALTER TABLE `collections` DISABLE KEYS */;
INSERT INTO `collections` VALUES (1,'Air Max','air-max','Air Max collection','2025-12-06 14:11:35'),(2,'Air Force','air-force','Air Force collection','2025-12-06 14:11:35'),(3,'Dunk','dunk','Nike Dunk collection','2025-12-06 14:11:35'),(4,'Pegasus','pegasus','Pegasus running collection','2025-12-06 14:11:35');
/*!40000 ALTER TABLE `collections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied','in_progress','resolved','closed') DEFAULT 'new',
  `user_id` bigint unsigned DEFAULT NULL,
  `admin_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contact_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (5,'DANG THANH TOAN Store','thanhTOAN Store06092004@gmail.com','order','thanhTOAN Store06092004','replied',NULL,NULL,'2025-12-07 02:18:08','2026-02-03 05:39:11'),(6,'DANG THANH TOAN Store','admin@gmail.com','product','okokokokok','replied',NULL,NULL,'2025-12-07 02:53:46','2026-02-01 12:46:59');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_usage`
--

DROP TABLE IF EXISTS `coupon_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint unsigned DEFAULT NULL,
  `coupon_code` varchar(100) DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `coupon_usage_ibfk_1` (`coupon_id`),
  CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usage`
--

LOCK TABLES `coupon_usage` WRITE;
/*!40000 ALTER TABLE `coupon_usage` DISABLE KEYS */;
INSERT INTO `coupon_usage` VALUES (2,12,NULL,1,11,'2026-01-30 12:10:01'),(3,10,NULL,1,12,'2026-01-30 12:29:22'),(4,9,NULL,1,13,'2026-01-30 12:40:00'),(5,12,NULL,1,53,'2026-02-14 02:45:08');
/*!40000 ALTER TABLE `coupon_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` enum('fixed','percent') DEFAULT 'fixed',
  `discount_value` decimal(12,2) NOT NULL,
  `applicable_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `min_order_amount` decimal(12,2) DEFAULT NULL,
  `applicable_categories` json DEFAULT NULL,
  `max_discount_amount` decimal(12,2) DEFAULT NULL,
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `usage_limit_per_user` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'WELCOME10','Giảm 10% cho đơn hàng đầu tiên','percent',10.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-01-05 14:11:35',1000,NULL,'2025-12-06 14:11:35',NULL),(2,'SALE50K','Giảm 50,000đ cho đơn hàng từ 500,000đ','fixed',50000.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2025-12-13 14:11:35',500,NULL,'2025-12-06 14:11:35',NULL),(3,'VIP20','Giảm 20% cho thành viên VIP','percent',20.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-03-06 14:11:35',NULL,NULL,'2025-12-06 14:11:35',NULL),(4,'NEWYEAR2025','Giảm 15% chào năm mới 2025','percent',15.00,'bronze',NULL,NULL,NULL,'2025-12-07 03:52:09','2026-01-06 03:52:09',2000,NULL,'2025-12-06 14:11:35',NULL),(9,'NIKE2024','Giảm 10% cho đơn hàng từ 2 triệu','percent',10.00,'bronze',2000000.00,NULL,500000.00,'2025-12-31 17:00:00','2026-12-31 03:00:00',100,1,'2025-12-09 06:01:59',NULL),(10,'WELCOME50','Giảm 50K cho khách hàng mới','fixed',50000.00,'bronze',500000.00,NULL,NULL,'2025-12-09 06:01:59','2026-02-07 06:01:59',500,1,'2025-12-09 06:01:59',NULL),(11,'FREESHIP','Miễn phí vận chuyển','fixed',30000.00,'bronze',1000000.00,NULL,30000.00,'2025-12-09 06:01:59','2026-03-09 06:01:59',NULL,NULL,'2025-12-09 06:01:59',NULL),(12,'TOAN Store','Giảm 10% cho đơn hàng từ 1 triệu','percent',10.00,'bronze',1000000.00,NULL,100000.00,'2026-01-01 04:11:00','2026-12-30 17:00:00',10,1,'2026-01-25 03:41:00',NULL);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_metrics`
--

DROP TABLE IF EXISTS `daily_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_metrics` (
  `date` timestamp NOT NULL,
  `revenue` decimal(15,2) DEFAULT '0.00',
  `orders_count` int DEFAULT '0',
  `customers_count` int DEFAULT '0',
  `cancelled_count` int DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_metrics`
--

LOCK TABLES `daily_metrics` WRITE;
/*!40000 ALTER TABLE `daily_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faq_categories`
--

DROP TABLE IF EXISTS `faq_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faq_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(100) DEFAULT NULL,
  `position` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faq_categories`
--

LOCK TABLES `faq_categories` WRITE;
/*!40000 ALTER TABLE `faq_categories` DISABLE KEYS */;
INSERT INTO `faq_categories` VALUES (1,'Đặt hàng','order','Câu hỏi về quy trình đặt hàng','shopping-cart',1,1,'2025-12-06 14:11:35'),(2,'Vận chuyển','shipping','Thông tin về vận chuyển và giao hàng','truck',2,1,'2025-12-06 14:11:35'),(3,'Thanh toán','payment','Các phương thức thanh toán','credit-card',3,1,'2025-12-06 14:11:35'),(4,'Đổi trả','returns','Chính sách đổi trả hàng','refresh',4,1,'2025-12-06 14:11:35'),(5,'Sản phẩm','products','Thông tin về sản phẩm','box',5,1,'2025-12-06 14:11:35');
/*!40000 ALTER TABLE `faq_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `position` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `helpful_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `faqs_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `faq_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,1,'Làm thế nào để đặt hàng ?','Bạn có thể đặt hàng trực tuyến qua website của chúng tôi.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:47:35'),(2,1,'Tôi có thể hủy đơn hàng không ?','Bạn có thể hủy đơn hàng trong vòng 24 giờ sau khi đặt.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:04'),(3,2,'Thời gian giao hàng là bao lâu ?','Thời gian giao hàng tiêu chuẩn là 2–5 ngày làm việc.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:30'),(4,2,'Chi phí vận chuyển là bao nhiêu ?','Phí vận chuyển là 30.000đ cho đơn hàng dưới mức quy định.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:45'),(5,3,'Có những phương thức thanh toán nào ?','Chúng tôi hỗ trợ: Thanh toán khi nhận hàng, chuyển khoản ngân hàng, ví điện tử.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:16'),(6,4,'Chính sách đổi trả như thế nào ?','Sản phẩm được đổi trả trong vòng 30 ngày nếu còn nguyên tem mác.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:40'),(7,5,'Làm sao để kiểm tra sản phẩm chính hãng ?','Tất cả sản phẩm tại TOAN Store đều là chính hãng, có đầy đủ tem và bảo hành.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:50:12');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flash_sale_items`
--

DROP TABLE IF EXISTS `flash_sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `flash_sale_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `discount_percentage` decimal(5,2) NOT NULL,
  `flash_price` decimal(12,2) NOT NULL,
  `quantity_limit` int DEFAULT NULL COMMENT 'Total quantity available for flash sale',
  `quantity_sold` int DEFAULT '0',
  `per_user_limit` int DEFAULT '1' COMMENT 'Max quantity per user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_flash_product` (`flash_sale_id`,`product_id`),
  KEY `flash_sale_id` (`flash_sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `flash_sale_items_ibfk_1` FOREIGN KEY (`flash_sale_id`) REFERENCES `flash_sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `flash_sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flash_sale_items`
--

LOCK TABLES `flash_sale_items` WRITE;
/*!40000 ALTER TABLE `flash_sale_items` DISABLE KEYS */;
INSERT INTO `flash_sale_items` VALUES (1,1,1,48.00,1999000.00,50,12,1,'2026-02-12 11:36:04'),(2,1,2,49.00,1499000.00,100,45,1,'2026-02-12 11:36:04'),(3,1,3,31.00,2419000.00,30,8,1,'2026-02-12 11:36:04'),(4,1,4,52.00,1829000.00,20,15,1,'2026-02-12 11:36:04'),(5,1,5,36.00,3589000.00,10,2,1,'2026-02-12 11:36:04'),(6,2,7,50.00,2927500.00,10,0,1,'2026-02-12 12:21:16'),(7,4,9,50.00,500000.00,5,0,2,'2026-02-12 13:04:53'),(8,5,10,50.00,500000.00,5,0,2,'2026-02-12 13:06:03'),(9,6,11,50.00,500000.00,5,0,2,'2026-02-12 13:07:26'),(10,7,12,50.00,500000.00,5,1,2,'2026-02-12 13:09:24'),(11,8,13,50.00,500000.00,5,1,2,'2026-02-12 13:11:27'),(12,9,14,50.00,500000.00,5,1,2,'2026-02-12 13:14:27'),(13,10,15,50.00,500000.00,5,0,2,'2026-02-12 13:15:34'),(14,11,16,50.00,500000.00,5,0,2,'2026-02-13 00:56:52');
/*!40000 ALTER TABLE `flash_sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flash_sales`
--

DROP TABLE IF EXISTS `flash_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_active_time` (`is_active`,`start_time`,`end_time`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flash_sales`
--

LOCK TABLES `flash_sales` WRITE;
/*!40000 ALTER TABLE `flash_sales` DISABLE KEYS */;
INSERT INTO `flash_sales` VALUES (1,'SIÊU SALE CUỐI TUẦN','Giảm giá cực sốc lên đến 50% cho các sản phẩm Nike hot nhất hiện nay!','2026-02-12 10:36:03','2026-02-13 10:36:03',0,'2026-02-12 11:36:03','2026-02-12 12:23:46',NULL),(2,'TOAN Store','TOAN Store là toi','2026-02-12 06:00:00','2026-02-19 06:00:00',1,'2026-02-12 12:18:38','2026-02-12 12:23:32',NULL),(3,'Test Flash Sale','Testing E2E','2026-02-12 06:01:30','2026-02-12 07:01:30',1,'2026-02-12 13:01:30','2026-02-13 09:15:34','2026-02-13 09:15:34'),(4,'Test Flash Sale','Testing E2E','2026-02-12 06:04:53','2026-02-12 07:04:53',1,'2026-02-12 13:04:53','2026-02-13 09:15:40','2026-02-13 09:15:40'),(5,'Test Flash Sale','Testing E2E','2026-02-12 06:06:03','2026-02-12 07:06:03',1,'2026-02-12 13:06:03','2026-02-13 12:16:46','2026-02-13 12:16:46'),(6,'Test Flash Sale','Testing E2E','2026-02-12 06:07:26','2026-02-12 07:07:26',1,'2026-02-12 13:07:26','2026-02-13 12:16:40','2026-02-13 12:16:40'),(7,'Test Flash Sale','Testing E2E','2026-02-12 13:09:24','2026-02-12 14:09:24',1,'2026-02-12 13:09:24','2026-02-13 12:16:36','2026-02-13 12:16:36'),(8,'Test Flash Sale','Testing E2E','2026-02-12 13:11:27','2026-02-12 14:11:27',1,'2026-02-12 13:11:27','2026-02-13 09:15:43','2026-02-13 09:15:43'),(9,'Test Flash Sale','Testing E2E','2026-02-12 13:14:27','2026-02-12 14:14:27',1,'2026-02-12 13:14:27','2026-02-13 12:16:32','2026-02-13 12:16:32'),(10,'Test Flash Sale','Testing E2E','2026-02-12 13:15:34','2026-02-12 14:15:34',1,'2026-02-12 13:15:34','2026-02-13 12:16:28','2026-02-13 12:16:28'),(11,'Test Flash Sale','Testing E2E','2026-02-13 00:56:52','2026-02-13 01:56:52',1,'2026-02-13 00:56:52','2026-02-13 09:15:28','2026-02-13 09:15:28');
/*!40000 ALTER TABLE `flash_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_card_transactions`
--

DROP TABLE IF EXISTS `gift_card_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_card_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `gift_card_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `transaction_type` enum('purchase','redeem','refund','adjustment') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `balance_before` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `gift_card_id` (`gift_card_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `gift_card_transactions_ibfk_1` FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gift_card_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_card_transactions`
--

LOCK TABLES `gift_card_transactions` WRITE;
/*!40000 ALTER TABLE `gift_card_transactions` DISABLE KEYS */;
INSERT INTO `gift_card_transactions` VALUES (1,14,NULL,'purchase',100000.00,0.00,100000.00,'Khởi tạo thẻ quà tặng','2026-02-14 02:04:53'),(2,14,53,'redeem',100000.00,100000.00,0.00,'Thanh toán đơn hàng NK1771037108210_9KMI','2026-02-14 02:45:08'),(3,15,NULL,'purchase',100000.00,0.00,100000.00,'Khởi tạo thẻ quà tặng','2026-02-14 06:16:29');
/*!40000 ALTER TABLE `gift_card_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_cards`
--

DROP TABLE IF EXISTS `gift_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_number` varchar(16) NOT NULL,
  `pin` varchar(255) NOT NULL,
  `initial_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'VND',
  `status` enum('active','inactive','expired','used') DEFAULT 'active',
  `purchased_by` bigint unsigned DEFAULT NULL,
  `purchased_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_number` (`card_number`),
  KEY `purchased_by` (`purchased_by`),
  KEY `idx_card_number` (`card_number`),
  CONSTRAINT `gift_cards_ibfk_1` FOREIGN KEY (`purchased_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_cards`
--

LOCK TABLES `gift_cards` WRITE;
/*!40000 ALTER TABLE `gift_cards` DISABLE KEYS */;
INSERT INTO `gift_cards` VALUES (2,'2345678901234567','2345',1000000.00,1000000.00,'VND','active',NULL,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2025-12-06 14:11:35'),(3,'3456789012345678','3456',2000000.00,2000000.00,'VND','active',NULL,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2025-12-06 14:11:35'),(4,'4567890123456789','4567',500000.00,300000.00,'VND','active',NULL,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2025-12-06 14:11:35'),(9,'1234567890123456','1234',500000.00,500000.00,'VND','active',NULL,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2025-12-07 02:25:17'),(10,'9876543210987654','5678',1000000.00,1000000.00,'VND','active',NULL,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2025-12-07 02:25:17'),(11,'1111222233334444','9999',250000.00,250000.00,'VND','active',NULL,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2025-12-07 02:25:17'),(12,'1234567891012131','1234',1000000.00,1000000.00,'VND','active',NULL,NULL,'2026-12-31 17:00:00','2026-01-29 14:57:02','2026-01-29 14:57:02'),(13,'1122334455667788','1234',1000000.00,0.00,'VND','used',NULL,NULL,'2027-01-01 03:00:00','2026-01-29 15:13:24','2026-01-30 12:50:35'),(14,'6969696969696969','$2b$10$RXx/A/yUbhSi6x3FSyA5FujcG7BgNXWQmFkcshyqes75MS7ygA046',100000.00,0.00,'VND','used',NULL,NULL,'2026-09-05 23:09:00','2026-02-14 02:04:53','2026-02-14 02:45:08'),(15,'9696969696969696','c74ee807934c21b9c9484c9cf06e4a45:830e434d1c2c245e0b56b5ad920d9b39:e35b73c9',100000.00,100000.00,'VND','active',NULL,NULL,'2026-06-09 02:06:00','2026-02-14 06:16:29','2026-02-14 06:16:29');
/*!40000 ALTER TABLE `gift_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_variant_id` bigint unsigned NOT NULL,
  `warehouse_id` bigint unsigned DEFAULT NULL COMMENT 'NULL means default/main warehouse',
  `quantity` int NOT NULL DEFAULT '0',
  `reserved` int NOT NULL DEFAULT '0' COMMENT 'Items in pending orders',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_variant` (`product_variant_id`),
  KEY `idx_quantity` (`quantity`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,1,49,0,'2026-02-13 07:03:50'),(2,2,1,45,0,'2026-02-13 07:03:50'),(3,3,1,59,-1,'2026-02-13 07:03:50'),(4,4,1,55,0,'2026-02-13 07:03:50'),(5,5,1,23,-26,'2026-02-13 07:03:50'),(6,6,1,40,0,'2026-02-13 07:03:50'),(7,7,1,29,0,'2026-02-14 02:47:45'),(8,8,1,20,0,'2026-02-13 07:03:50'),(9,9,1,55,0,'2026-02-13 07:03:50'),(10,10,1,50,0,'2026-02-13 07:03:50'),(11,11,1,60,-5,'2026-02-13 07:03:50'),(12,12,1,60,0,'2026-02-13 07:03:50'),(13,13,1,55,0,'2026-02-13 07:03:50'),(14,14,1,45,0,'2026-02-13 07:03:50'),(15,15,1,34,-1,'2026-02-13 07:03:50'),(16,16,1,15,-10,'2026-02-13 07:03:50'),(17,17,1,40,0,'2026-02-13 07:03:50'),(18,18,1,35,0,'2026-02-13 07:03:50'),(19,19,1,49,-1,'2026-02-13 07:03:50'),(20,20,1,45,0,'2026-02-13 07:03:50'),(21,21,1,40,0,'2026-02-13 07:03:50'),(22,22,1,30,0,'2026-02-13 07:03:50'),(23,23,1,25,0,'2026-02-13 07:03:50'),(24,24,1,15,0,'2026-02-13 07:03:50'),(25,25,1,30,0,'2026-02-13 07:03:50'),(26,26,1,24,-1,'2026-02-13 07:03:50'),(27,27,1,35,0,'2026-02-13 07:03:50'),(28,28,1,30,0,'2026-02-13 07:03:50'),(29,29,1,25,0,'2026-02-13 07:03:50'),(30,30,1,20,0,'2026-02-13 07:03:50'),(31,31,1,15,0,'2026-02-13 07:03:50'),(32,32,1,10,0,'2026-02-13 07:03:50'),(33,33,1,20,0,'2026-02-13 07:03:50'),(34,34,1,18,0,'2026-02-13 07:03:50'),(35,35,1,24,-1,'2026-02-13 07:03:50'),(36,36,1,22,0,'2026-02-13 07:03:50'),(37,37,1,20,0,'2026-02-13 07:03:50'),(38,38,1,15,0,'2026-02-13 07:03:50'),(39,39,1,10,0,'2026-02-13 07:03:50'),(40,40,1,0,0,'2026-02-13 07:03:50'),(41,41,1,35,0,'2026-02-13 07:03:50'),(42,42,1,31,-1,'2026-02-13 07:03:50'),(43,43,1,40,0,'2026-02-13 07:03:50'),(44,44,1,38,0,'2026-02-13 07:03:50'),(45,45,1,35,0,'2026-02-13 07:03:50'),(46,46,1,28,0,'2026-02-13 07:03:50'),(47,47,1,22,0,'2026-02-13 07:03:50'),(48,48,1,18,0,'2026-02-13 07:03:50'),(49,64,1,15,0,'2026-02-13 07:03:50'),(50,65,1,20,0,'2026-02-13 07:03:50'),(51,66,1,20,0,'2026-02-13 07:03:50'),(52,67,1,30,0,'2026-02-13 07:03:50'),(53,68,1,50,0,'2026-02-13 07:03:50'),(54,69,1,100,0,'2026-02-13 07:03:50'),(55,70,1,99,0,'2026-02-13 07:03:50'),(56,71,1,99,0,'2026-02-13 07:03:50'),(57,72,1,99,0,'2026-02-13 07:03:50'),(58,73,1,99,0,'2026-02-13 07:03:50'),(59,74,1,99,0,'2026-02-13 07:03:50'),(60,75,1,99,0,'2026-02-13 07:03:50'),(61,76,1,100,0,'2026-02-13 07:03:50'),(62,77,1,100,0,'2026-02-13 07:03:50');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` bigint unsigned NOT NULL,
  `quantity_change` int NOT NULL COMMENT 'Positive for additions, negative for subtractions',
  `reason` varchar(255) DEFAULT NULL COMMENT 'e.g., "order_placed", "order_cancelled", "restock", "damaged"',
  `reference_id` varchar(100) DEFAULT NULL COMMENT 'order_id, purchase_order_id, etc.',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory` (`inventory_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES (1,1,50,'initial_migration','product_size_1','2025-12-06 14:32:12'),(2,2,45,'initial_migration','product_size_2','2025-12-06 14:32:12'),(3,3,60,'initial_migration','product_size_3','2025-12-06 14:32:12'),(4,4,55,'initial_migration','product_size_4','2025-12-06 14:32:12'),(5,5,50,'initial_migration','product_size_5','2025-12-06 14:32:12'),(6,6,40,'initial_migration','product_size_6','2025-12-06 14:32:12'),(7,7,30,'initial_migration','product_size_7','2025-12-06 14:32:12'),(8,8,20,'initial_migration','product_size_8','2025-12-06 14:32:12'),(9,9,55,'initial_migration','product_size_9','2025-12-06 14:32:12'),(10,10,50,'initial_migration','product_size_10','2025-12-06 14:32:12'),(11,11,65,'initial_migration','product_size_11','2025-12-06 14:32:12'),(12,12,60,'initial_migration','product_size_12','2025-12-06 14:32:12'),(13,13,55,'initial_migration','product_size_13','2025-12-06 14:32:12'),(14,14,45,'initial_migration','product_size_14','2025-12-06 14:32:12'),(15,15,35,'initial_migration','product_size_15','2025-12-06 14:32:12'),(16,16,25,'initial_migration','product_size_16','2025-12-06 14:32:12'),(17,17,40,'initial_migration','product_size_17','2025-12-06 14:32:12'),(18,18,35,'initial_migration','product_size_18','2025-12-06 14:32:12'),(19,19,50,'initial_migration','product_size_19','2025-12-06 14:32:12'),(20,20,45,'initial_migration','product_size_20','2025-12-06 14:32:12'),(21,21,40,'initial_migration','product_size_21','2025-12-06 14:32:12'),(22,22,30,'initial_migration','product_size_22','2025-12-06 14:32:12'),(23,23,25,'initial_migration','product_size_23','2025-12-06 14:32:12'),(24,24,15,'initial_migration','product_size_24','2025-12-06 14:32:12'),(25,25,30,'initial_migration','product_size_25','2025-12-06 14:32:12'),(26,26,25,'initial_migration','product_size_26','2025-12-06 14:32:12'),(27,27,35,'initial_migration','product_size_27','2025-12-06 14:32:12'),(28,28,30,'initial_migration','product_size_28','2025-12-06 14:32:12'),(29,29,25,'initial_migration','product_size_29','2025-12-06 14:32:12'),(30,30,20,'initial_migration','product_size_30','2025-12-06 14:32:12'),(31,31,15,'initial_migration','product_size_31','2025-12-06 14:32:12'),(32,32,10,'initial_migration','product_size_32','2025-12-06 14:32:12'),(33,33,20,'initial_migration','product_size_33','2025-12-06 14:32:12'),(34,34,18,'initial_migration','product_size_34','2025-12-06 14:32:12'),(35,35,25,'initial_migration','product_size_35','2025-12-06 14:32:12'),(36,36,22,'initial_migration','product_size_36','2025-12-06 14:32:12'),(37,37,20,'initial_migration','product_size_37','2025-12-06 14:32:12'),(38,38,15,'initial_migration','product_size_38','2025-12-06 14:32:12'),(39,39,10,'initial_migration','product_size_39','2025-12-06 14:32:12'),(40,40,8,'initial_migration','product_size_40','2025-12-06 14:32:12'),(41,41,35,'initial_migration','product_size_41','2025-12-06 14:32:12'),(42,42,32,'initial_migration','product_size_42','2025-12-06 14:32:12'),(43,43,40,'initial_migration','product_size_43','2025-12-06 14:32:12'),(44,44,38,'initial_migration','product_size_44','2025-12-06 14:32:12'),(45,45,35,'initial_migration','product_size_45','2025-12-06 14:32:12'),(46,46,28,'initial_migration','product_size_46','2025-12-06 14:32:12'),(47,47,22,'initial_migration','product_size_47','2025-12-06 14:32:12'),(48,48,18,'initial_migration','product_size_48','2025-12-06 14:32:12'),(49,55,-1,'order_placed','TEST-ORD-1770901493436','2026-02-12 13:04:53'),(50,56,-1,'order_placed','TEST-ORD-1770901563158','2026-02-12 13:06:03'),(51,57,-1,'order_placed','TEST-ORD-1770901646849','2026-02-12 13:07:26'),(52,58,-1,'order_placed','TEST-ORD-1770901764124','2026-02-12 13:09:24'),(53,59,-1,'order_placed','TEST-ORD-1770901887784','2026-02-12 13:11:27'),(54,60,-1,'order_placed','TEST-ORD-1770902067869','2026-02-12 13:14:27'),(55,61,-1,'order_placed','TEST-ORD-1770902134346','2026-02-12 13:15:34'),(56,61,1,'order_cancelled','TEST-ORD-1770902134346','2026-02-12 13:15:34'),(57,62,-1,'order_placed','TEST-ORD-1770944212731','2026-02-13 00:56:52'),(58,62,1,'order_cancelled','TEST-ORD-1770944212731','2026-02-13 00:56:52'),(59,5,-1,'order_placed','TEST-EMAIL-1770946266829','2026-02-13 01:31:06'),(60,7,-1,'order_reserved','NK1771037108210_9KMI','2026-02-14 02:45:08');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text,
  `content` longtext NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `author_id` bigint unsigned DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `views` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `news_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES (3,'TOAN Store','TOAN Store','DANG THANH TOAN Store','TOAN Store','https://static.nike.com/a/images/q_auto:eco/t_product_v1/f_auto/dpr_1.5/h_381,c_limit/f9f098e2-5a18-4e52-990f-b9cc09357fbc/air-max-dn8-leather-shoes-bYfKK6Qb.png','Sản Phẩm',3,'2026-02-01 05:40:49',1,5,'2026-02-01 12:40:48','2026-02-13 01:52:23');
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscriptions`
--

DROP TABLE IF EXISTS `newsletter_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` enum('active','unsubscribed','bounced') DEFAULT 'active',
  `user_id` bigint unsigned DEFAULT NULL,
  `subscribed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_id` (`user_id`),
  KEY `idx_email` (`email`),
  CONSTRAINT `newsletter_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscriptions`
--

LOCK TABLES `newsletter_subscriptions` WRITE;
/*!40000 ALTER TABLE `newsletter_subscriptions` DISABLE KEYS */;
INSERT INTO `newsletter_subscriptions` VALUES (1,'customer1@example.com','Nguyễn Văn A','active',NULL,'2025-12-06 14:11:35',NULL),(2,'customer2@example.com','Trần Thị B','active',NULL,'2025-12-06 14:11:35',NULL),(3,'customer3@example.com','Lê Văn C','active',NULL,'2025-12-06 14:11:35',NULL),(4,'customer4@example.com','Phạm Thị D','active',NULL,'2025-12-06 14:11:35',NULL),(5,'customer5@example.com','Hoàng Văn E','active',NULL,'2025-12-06 14:11:35',NULL),(6,'thanhTOAN Store060902004@gmail.com','Đặng Thanh Toàn','active',NULL,'2025-12-09 04:45:40',NULL),(7,'thanhTOAN Store06092004@gmail.com',NULL,'active',NULL,'2026-01-29 14:05:14',NULL);
/*!40000 ALTER TABLE `newsletter_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_variant_id` bigint unsigned DEFAULT NULL,
  `inventory_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(500) NOT NULL,
  `sku` varchar(200) DEFAULT NULL,
  `size` varchar(10) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `cost_price` decimal(12,2) DEFAULT '0.00',
  `total_price` decimal(12,2) NOT NULL,
  `flash_sale_item_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `fk_order_items_variant` (`product_variant_id`),
  KEY `flash_sale_item_id` (`flash_sale_item_id`),
  KEY `fk_order_items_inventory` (`inventory_id`),
  CONSTRAINT `fk_order_items_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`flash_sale_item_id`) REFERENCES `flash_sale_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,3,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,0.00,2929000.00,NULL),(2,4,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'45',10,2929000.00,0.00,29290000.00,NULL),(3,5,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,0.00,2929000.00,NULL),(4,6,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,0.00,2929000.00,NULL),(5,6,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'44',1,2929000.00,0.00,2929000.00,NULL),(6,7,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,0.00,2929000.00,NULL),(7,8,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,0.00,2929000.00,NULL),(8,9,1,NULL,NULL,'Nike Air Max 270',NULL,'40',1,3829000.00,0.00,3829000.00,NULL),(10,11,4,NULL,NULL,'Air Jordan 1 Mid',NULL,'39',1,3829000.00,0.00,3829000.00,NULL),(11,12,3,NULL,NULL,'Nike Pegasus 40',NULL,'40',1,3519000.00,0.00,3519000.00,NULL),(12,13,5,NULL,NULL,'Air Jordan 4 Retro',NULL,'40',1,5589000.00,0.00,5589000.00,NULL),(14,15,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(15,16,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(16,17,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(17,18,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(18,19,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(19,20,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(20,21,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(21,22,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(22,23,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(23,24,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(24,25,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(25,26,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(26,27,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(27,28,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(28,29,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(29,30,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(30,31,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(31,32,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(32,33,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(33,34,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(34,35,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(35,36,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(36,37,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(37,38,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(38,39,1,NULL,NULL,'Test Product',NULL,'42',1,1000000.00,0.00,1000000.00,NULL),(39,40,6,NULL,NULL,'Nike Dunk Low',NULL,'39',1,2829000.00,0.00,2829000.00,NULL),(40,42,1,1,NULL,'Nike Air Max 270',NULL,'38',1,1000000.00,0.00,1000000.00,NULL),(41,43,9,70,NULL,'Test Product Flash Sale','TEST-FS-1770901492725','42',1,1000000.00,0.00,1000000.00,NULL),(42,44,10,71,NULL,'Test Product Flash Sale','TEST-FS-1770901562442','42',1,1000000.00,0.00,1000000.00,NULL),(43,45,11,72,NULL,'Test Product Flash Sale','TEST-FS-1770901646528','42',1,1000000.00,0.00,1000000.00,NULL),(44,46,12,73,NULL,'Test Product Flash Sale','TEST-FS-1770901763475','42',1,500000.00,0.00,500000.00,10),(45,47,13,74,NULL,'Test Product Flash Sale','TEST-FS-1770901887369','42',1,500000.00,0.00,500000.00,11),(46,48,14,75,NULL,'Test Product Flash Sale','TEST-FS-1770902066999','42',1,500000.00,0.00,500000.00,12),(47,49,15,76,NULL,'Test Product Flash Sale','TEST-FS-1770902133761','42',1,500000.00,0.00,500000.00,13),(48,50,16,77,NULL,'Test Product Flash Sale','TEST-FS-1770944212477','42',1,500000.00,0.00,500000.00,14),(49,51,1,5,NULL,'Test Shoe','NK-AM270-BLK-42','42',1,4500000.00,0.00,4500000.00,NULL),(50,53,1,7,7,'Nike Air Max 270','NK-AM270-BLK-44','44',1,4500000.00,0.00,4500000.00,NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(100) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `shipping_address_id` bigint unsigned DEFAULT NULL,
  `billing_address_id` bigint unsigned DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) DEFAULT '0.00',
  `discount` decimal(12,2) DEFAULT '0.00',
  `voucher_code` varchar(50) DEFAULT NULL,
  `voucher_discount` decimal(12,2) DEFAULT '0.00',
  `giftcard_number` varchar(16) DEFAULT NULL,
  `giftcard_discount` decimal(12,2) DEFAULT '0.00',
  `tax` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'VND',
  `shipping_address_snapshot` json DEFAULT NULL,
  `status` enum('pending','pending_payment_confirmation','payment_received','confirmed','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  `placed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_method` varchar(50) DEFAULT 'cod',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_shipping_address` (`shipping_address_id`),
  KEY `idx_billing_address` (`billing_address_id`),
  KEY `idx_tracking_number` (`tracking_number`),
  CONSTRAINT `fk_orders_billing_address` FOREIGN KEY (`billing_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_shipping_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (3,'NK1765037039892',1,NULL,NULL,2929000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,2929000.00,'VND',NULL,'cancelled','2025-12-06 16:03:59','2025-12-06 16:09:29','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'NK1765087390746',1,NULL,NULL,29290000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,29290000.00,'VND',NULL,'cancelled','2025-12-07 06:03:10','2025-12-07 06:03:44','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'NK1765088272959',1,NULL,NULL,2929000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,2929000.00,'VND',NULL,'delivered','2025-12-07 06:17:52','2026-01-30 12:26:43','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'NK1765089059778',1,NULL,NULL,5858000.00,0.00,1288760.00,'VIP20',1288760.00,NULL,0.00,0.00,4569240.00,'VND',NULL,'delivered','2025-12-07 06:30:59','2026-01-30 12:03:44','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'NK1765093418497',1,7,NULL,2929000.00,0.00,1644380.00,'VIP20',644380.00,'2345678901234567',1000000.00,0.00,1284620.00,'VND',NULL,'cancelled','2025-12-07 07:43:38','2026-01-03 12:32:08','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,'NK1767443489937',1,NULL,NULL,2929000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,2929000.00,'VND',NULL,'cancelled','2026-01-03 12:31:29','2026-01-30 12:00:27','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,'NK1769773670916',1,NULL,NULL,3829000.00,0.00,1100000.00,'TOAN Store',100000.00,'1122334455667788',1000000.00,0.00,2729000.00,'VND',NULL,'delivered','2026-01-30 11:47:50','2026-01-30 11:58:51','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,'NK1769775001613',1,NULL,NULL,3829000.00,0.00,1100000.00,'TOAN Store',100000.00,'1122334455667788',1000000.00,382900.00,3111900.00,'VND',NULL,'delivered','2026-01-30 12:10:01','2026-01-30 12:15:57','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,'NK1769776162375',1,NULL,NULL,3519000.00,0.00,1050000.00,'WELCOME50',50000.00,'1122334455667788',1000000.00,351900.00,2820900.00,'VND',NULL,'delivered','2026-01-30 12:29:22','2026-01-30 12:29:31','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,'NK1769776799944',1,NULL,NULL,5589000.00,0.00,1500000.00,'NIKE2024',500000.00,'1122334455667788',1000000.00,558900.00,4647900.00,'VND',NULL,'delivered','2026-01-30 12:39:59','2026-01-30 12:40:26','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,'NK1770196157999',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:09:18','2026-02-04 09:09:18','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,'NK1770196178560',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:09:38','2026-02-04 09:09:38','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,'NK1770196191139',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:09:51','2026-02-04 09:09:51','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,'NK1770196219646',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:10:19','2026-02-04 09:10:19','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,'NK1770196270843',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:11:10','2026-02-04 09:11:10','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'NK1770196337590',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:12:17','2026-02-04 09:12:17','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(21,'NK1770196389744',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:13:09','2026-02-04 09:13:09','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,'NK1770196421706',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:13:41','2026-02-04 09:13:41','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,'NK1770196439024',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:13:59','2026-02-04 09:13:59','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,'NK1770196523454',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:15:23','2026-02-04 09:15:23','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,'NK1770196531049',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:15:31','2026-02-04 09:15:31','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(26,'NK1770196577187',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:16:17','2026-02-04 09:16:17','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(27,'NK1770196691103',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:18:11','2026-02-04 09:18:11','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(28,'NK1770196782235',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:19:42','2026-02-04 09:19:42','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(29,'NK1770196800262',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:20:00','2026-02-04 09:20:00','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,'NK1770196815188',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:20:15','2026-02-04 09:20:15','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,'NK1770196850291',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:20:50','2026-02-04 09:20:50','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,'NK1770196890568',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:21:30','2026-02-04 09:21:30','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,'NK1770196912386',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:21:52','2026-02-04 09:21:52','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,'NK1770196924822',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:22:04','2026-02-04 09:22:04','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,'NK1770196940529',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:22:20','2026-02-04 09:22:20','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,'NK1770196958574',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:22:38','2026-02-04 09:22:38','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(37,'NK1770197057864',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending','2026-02-04 09:24:17','2026-02-04 09:24:17','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(38,'NK1770197152721',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending_payment_confirmation','2026-02-04 09:25:52','2026-02-04 09:25:53','Ví MoMo','pending',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-04 09:25:53','\n[Xác nhận thanh toán] SĐT: 0987654321, Số tiền: 950.000₫, Ghi chú: Test Payment'),(39,'NK1770198112101',1,NULL,NULL,1000000.00,0.00,50000.00,NULL,0.00,NULL,0.00,0.00,950000.00,'VND',NULL,'pending_payment_confirmation','2026-02-04 09:41:52','2026-02-04 09:41:52','Ví MoMo','pending',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-04 09:41:52','\n[Xác nhận thanh toán] SĐT: 0987654321, Số tiền: 950.000₫, Ghi chú: Test Payment'),(40,'NK1770253823973',1,NULL,NULL,2829000.00,0.00,141450.00,NULL,0.00,NULL,0.00,282900.00,2970450.00,'VND',NULL,'delivered','2026-02-05 01:10:24','2026-02-05 01:13:28','Thanh toán khi nhận hàng','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(42,'TEST-1770769999102',1,NULL,NULL,1000000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,1000000.00,'VND','{\"city\": \"Test City\", \"name\": \"Test Receiver\", \"ward\": \"Test Ward\", \"phone\": \"0909000000\", \"address\": \"123 Test St\", \"district\": \"Test District\"}','pending','2026-02-11 00:33:19','2026-02-11 00:33:19','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(43,'TEST-ORD-1770901493436',NULL,NULL,NULL,1000000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,1000000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:04:53','2026-02-12 13:04:53','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(44,'TEST-ORD-1770901563158',NULL,NULL,NULL,1000000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,1000000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:06:03','2026-02-12 13:06:03','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(45,'TEST-ORD-1770901646849',NULL,NULL,NULL,1000000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,1000000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:07:26','2026-02-12 13:07:26','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,'TEST-ORD-1770901764124',NULL,NULL,NULL,500000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:09:24','2026-02-12 13:09:24','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(47,'TEST-ORD-1770901887784',NULL,NULL,NULL,500000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:11:27','2026-02-12 13:11:27','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'TEST-ORD-1770902067869',NULL,NULL,NULL,500000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','pending','2026-02-12 13:14:27','2026-02-12 13:14:27','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(49,'TEST-ORD-1770902134346',NULL,NULL,NULL,500000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','cancelled','2026-02-12 13:15:34','2026-02-12 13:15:34','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'TEST-ORD-1770944212731',NULL,NULL,NULL,500000.00,0.00,0.00,NULL,0.00,NULL,0.00,0.00,500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"0123456789\", \"address\": \"123 Test St\", \"district\": \"\"}','cancelled','2026-02-13 00:56:52','2026-02-13 00:56:52','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(51,'TEST-EMAIL-1770946266829',1,NULL,NULL,4500000.00,30000.00,0.00,NULL,0.00,NULL,0.00,0.00,4530000.00,'VND','{\"city\": \"Test City\", \"name\": \"Test User\", \"ward\": \"Test Ward\", \"phone\": \"0909090909\", \"address\": \"123 Test St\", \"district\": \"Test District\"}','pending','2026-02-13 01:31:06','2026-02-13 01:31:06','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(53,'NK1771037108210_9KMI',1,NULL,NULL,4500000.00,0.00,712640.00,'TOAN Store',421190.00,'6969696969696969',100000.00,382900.00,4170260.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN Store\", \"ward\": \"700000\", \"phone\": \"a9f98b18f57a56cff37ff166045ab792:3260be462131d60fcc4fc42184870499:2b2814eb7641c9609553\", \"address\": \"14bd1d5f0f4d5dbba320b85df0fb65e9:021af053ee4f588e6678041b64a974ba:ffe5c4ff9aee66cbb36e8d3a8dfa418cc3d454527f72c819ec7e25\", \"district\": \"Hóc Môn\", \"address_line\": \"fb2f9369ad06e444b3f4f866437de1be:43087caca0661b0a2343817bfe7923f9:3533329219da69f84a412878fd19cba13d3bc611c67719dc4da43b\"}','delivered','2026-02-14 02:45:08','2026-02-14 02:48:48','Thanh toán khi nhận hàng','pending','7f465fe056d84b1c019a8fecf0e08127:64fce2a42053e28f0b3304352b8bf54f:082b572395a66463a678','2109f2bad4481ba13ea56aef7a1ecd0f:ee40aa5daf9122db0b0ea88dc77ff54f:e7b8ff5f5e9e9d8d6559dd82276affbcce25ceddd448b59d1852a9',NULL,NULL,'2026-02-14 02:48:10','2026-02-14 02:48:48','2026-02-14 02:47:45',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext,
  `template` varchar(100) DEFAULT 'default',
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text,
  `status` enum('draft','published') DEFAULT 'published',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `created_by` (`created_by`),
  KEY `idx_slug` (`slug`),
  CONSTRAINT `pages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES (1,'Về TOAN Store','about','TOAN Store là đại lý chính thức của Nike tại Việt Nam, mang đến cho khách hàng những sản phẩm chính hãng với chất lượng tốt nhất. Chúng tôi cam kết cung cấp trải nghiệm mua sắm tuyệt vời với dịch vụ khách hàng chuyên nghiệp.','default','Về TOAN Store Nike Store','Tìm hiểu về TOAN Store - đại lý chính thức Nike tại Việt Nam','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),(2,'Chính sách bảo mật','privacy-policy','Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng...','legal','Chính sách bảo mật','Chính sách bảo mật thông tin khách hàng','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),(3,'Điều khoản sử dụng','terms-of-use','Điều khoản và điều kiện sử dụng website','legal','Điều khoản sử dụng','Điều khoản và điều kiện sử dụng','published',1,'2025-12-06 14:11:35','2026-01-06 08:55:30'),(4,'Hướng dẫn mua hàng','guides','Hướng dẫn chi tiết cách đặt hàng và thanh toán','guide','Hướng dẫn mua hàng','Hướng dẫn mua hàng tại TOAN Store Nike Store','published',1,'2025-12-06 14:11:35','2026-01-06 08:56:13');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'cod','Thanh toán khi nhận hàng','{\"description\": \"Thanh toán bằng tiền mặt khi nhận hàng\"}',1),(2,'bank_transfer','Chuyển khoản ngân hàng','{\"banks\": [\"Vietcombank\", \"Techcombank\", \"VPBank\"]}',1),(3,'momo','Ví điện tử Momo','{\"api_endpoint\": \"https://payment.momo.vn\"}',1),(4,'vnpay','Cổng thanh toán VNPay','{\"api_endpoint\": \"https://sandbox.vnpayment.vn\"}',1),(5,'zalopay','ZaloPay','{\"api_endpoint\": \"https://zalopay.vn\"}',1);
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned DEFAULT NULL,
  `payment_method_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'VND',
  `gateway_response` json DEFAULT NULL COMMENT 'Response from payment gateway (Stripe, PayPal, etc.)',
  `status` varchar(50) DEFAULT 'pending' COMMENT 'pending, completed, failed, refunded',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_paid_at` (`paid_at`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'view_products','Can view products','2025-12-06 14:11:35'),(2,'purchase_products','Can purchase products','2025-12-06 14:11:35'),(3,'manage_products','Can create, update, delete products','2025-12-06 14:11:35'),(4,'manage_orders','Can manage all orders','2025-12-06 14:11:35'),(5,'manage_users','Can manage users','2025-12-06 14:11:35'),(6,'view_reports','Can view sales and analytics reports','2025-12-06 14:11:35'),(7,'all','Master permission','2026-02-15 12:13:48'),(8,'read:users','View admin and customer users','2026-02-15 12:13:48'),(9,'write:users','Create/Edit users','2026-02-15 12:13:48'),(10,'delete:users','Delete users','2026-02-15 12:13:48'),(11,'manage:inventory','Full inventory management','2026-02-15 12:13:48'),(12,'manage:orders','Full order management','2026-02-15 12:13:48'),(13,'view:analytics','View business metrics','2026-02-15 12:13:48');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_attribute_values`
--

DROP TABLE IF EXISTS `product_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_attribute_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `attribute_id` bigint unsigned NOT NULL,
  `value_text` text,
  `option_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `option_id` (`option_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_attribute` (`attribute_id`),
  CONSTRAINT `product_attribute_values_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attribute_values_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attribute_values_ibfk_3` FOREIGN KEY (`option_id`) REFERENCES `attribute_options` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_attribute_values`
--

LOCK TABLES `product_attribute_values` WRITE;
/*!40000 ALTER TABLE `product_attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_attributes`
--

DROP TABLE IF EXISTS `product_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_attributes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `attribute_id` bigint unsigned NOT NULL,
  `value` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `product_attributes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `category_attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_attributes`
--

LOCK TABLES `product_attributes` WRITE;
/*!40000 ALTER TABLE `product_attributes` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_colors`
--

DROP TABLE IF EXISTS `product_colors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_colors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `color_name` varchar(100) NOT NULL,
  `color_code` varchar(7) DEFAULT NULL COMMENT 'Hex code like #FF0000',
  `image_url` varchar(1000) DEFAULT NULL,
  `position` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_colors`
--

LOCK TABLES `product_colors` WRITE;
/*!40000 ALTER TABLE `product_colors` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_colors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_embeddings`
--

DROP TABLE IF EXISTS `product_embeddings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_embeddings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `embedding` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `product_embeddings_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_embeddings`
--

LOCK TABLES `product_embeddings` WRITE;
/*!40000 ALTER TABLE `product_embeddings` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_embeddings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_gender_categories`
--

DROP TABLE IF EXISTS `product_gender_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_gender_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `gender` enum('men','women','unisex','kids','boys','girls') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gender` (`gender`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `product_gender_categories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_gender_categories`
--

LOCK TABLES `product_gender_categories` WRITE;
/*!40000 ALTER TABLE `product_gender_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_gender_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `color_id` bigint unsigned DEFAULT NULL,
  `url` varchar(1000) NOT NULL,
  `media_type` enum('image','video') NOT NULL DEFAULT 'image',
  `alt_text` varchar(255) DEFAULT NULL,
  `position` int DEFAULT '0',
  `is_main` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `fk_product_images_color` (`color_id`),
  CONSTRAINT `fk_product_images_color` FOREIGN KEY (`color_id`) REFERENCES `product_colors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/awjogtdnqxniqqk0wpgf/AIR+MAX+270.png','image','Nike Air Max 270',0,1),(3,2,NULL,'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-force-1-07-shoes-WrLlWX.png','image','Nike Air Force 1 - Main View',0,1),(4,2,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto/a0a300da-2e16-4483-ba64-9815cf0598ac/AIR+FORCE+1+%2707.png','image','Nike Air Force 1 - Side View',1,0),(5,3,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/20ec15db-5080-40e3-9b1f-8af886de0f1c/AIR+ZOOM+PEGASUS+41.png','image','Nike Pegasus 40 - Main View',0,1),(6,4,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/9dbb19ec-29e0-428f-b6e0-188d7ec8cc90/WMNS+AIR+JORDAN+1+MID.png','image','Air Jordan 1 Mid - Main View',0,1),(7,5,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/964aa0e2-5f27-4ab4-93f6-9ee25b06bf26/AIR+JORDAN+4+RETRO+%28GS%29.png','image','Air Jordan 4 Retro - Main View',0,1),(8,6,NULL,'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/1834a673-dfc2-401a-8afa-9ea20abc26c5/W+NIKE+DUNK+LOW.png','image','Nike Dunk Low',0,1),(9,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/4b3f60af-4f98-4b97-8e67-401e656d5601/ZM+VAPOR+16+ELITE+FG.png','image',NULL,0,1),(10,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b849691a-dc3c-4d2b-83a9-93fad27c7dba/ZM+VAPOR+16+ELITE+FG.png','image',NULL,1,0),(11,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/17e73dac-b75c-44cf-9274-02b1731f7ee5/ZM+VAPOR+16+ELITE+FG.png','image',NULL,2,0),(12,7,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/ef17a870-8a47-4a90-8a96-910e451b2b1a/ZM+VAPOR+16+ELITE+FG.png','image',NULL,3,0),(17,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/zohr1uagxkvngypyrsg6/AIR+MAX+270.png','image','Nike Air Max 270',1,0),(18,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/sdxif37re9xkdk2d7q0o/AIR+MAX+270.png','image','Nike Air Max 270',2,0),(19,1,NULL,'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/pog7ksulvzectpug6r9j/AIR+MAX+270.png','image','Nike Air Max 270',3,0);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `product_id` bigint unsigned NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_reply` text,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  KEY `idx_rating` (`rating`),
  KEY `product_reviews_ibfk_1` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,1,2,5,'màu sắc','đẹp','approved',0,0,0,'2025-12-10 02:41:34','2026-01-25 03:55:51','thank you'),(2,2,2,1,'OK','xấu','approved',0,0,0,'2026-01-27 07:36:19','2026-02-01 12:49:04','ok');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sizes`
--

DROP TABLE IF EXISTS `product_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sizes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `size` varchar(10) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `reserved` int NOT NULL DEFAULT '0',
  `price_adjustment` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_size` (`product_id`,`size`),
  CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sizes`
--

LOCK TABLES `product_sizes` WRITE;
/*!40000 ALTER TABLE `product_sizes` DISABLE KEYS */;
INSERT INTO `product_sizes` VALUES (1,1,'38',50,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(2,1,'39',45,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(3,1,'40',60,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(4,1,'41',55,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(5,1,'42',50,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(6,1,'43',40,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(7,1,'44',30,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(8,1,'45',20,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(9,2,'38',55,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(10,2,'39',50,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(11,2,'40',65,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(12,2,'41',60,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(13,2,'42',55,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(14,2,'43',45,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(15,2,'44',35,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(16,2,'45',25,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(17,3,'38',40,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(18,3,'39',35,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(19,3,'40',50,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(20,3,'41',45,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(21,3,'42',40,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(22,3,'43',30,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(23,3,'44',25,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(24,3,'45',15,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(25,4,'38',30,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(26,4,'39',25,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(27,4,'40',35,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(28,4,'41',30,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(29,4,'42',25,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(30,4,'43',20,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(31,4,'44',15,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(32,4,'45',10,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(33,5,'38',20,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(34,5,'39',18,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(35,5,'40',25,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(36,5,'41',22,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(37,5,'42',20,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(38,5,'43',15,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(39,5,'44',10,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(40,5,'45',8,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(41,6,'38',35,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(42,6,'39',32,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(43,6,'40',40,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(44,6,'41',38,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(45,6,'42',35,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(46,6,'43',28,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(47,6,'44',22,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35'),(48,6,'45',18,0,0.00,'2025-12-06 14:11:35','2025-12-06 14:11:35');
/*!40000 ALTER TABLE `product_sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `sku` varchar(200) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `attributes` json DEFAULT NULL COMMENT 'e.g., {"size": "42", "color": "Red", "width": "Standard"}',
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(10,3) DEFAULT '0.000',
  `height` decimal(10,3) DEFAULT '0.000',
  `width` decimal(10,3) DEFAULT '0.000',
  `depth` decimal(10,3) DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_sku` (`sku`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_size` (`size`),
  KEY `idx_color` (`color`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'NK-AM270-BLK-38','38',NULL,NULL,'{\"size\": \"38\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(2,1,'NK-AM270-BLK-39','39',NULL,NULL,'{\"size\": \"39\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(3,1,'NK-AM270-BLK-40','40',NULL,NULL,'{\"size\": \"40\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(4,1,'NK-AM270-BLK-41','41',NULL,NULL,'{\"size\": \"41\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(5,1,'NK-AM270-BLK-42','42',NULL,NULL,'{\"size\": \"42\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(6,1,'NK-AM270-BLK-43','43',NULL,NULL,'{\"size\": \"43\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(7,1,'NK-AM270-BLK-44','44',NULL,NULL,'{\"size\": \"44\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(8,1,'NK-AM270-BLK-45','45',NULL,NULL,'{\"size\": \"45\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(9,2,'NK-AF1-WHT-38','38',NULL,NULL,'{\"size\": \"38\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(10,2,'NK-AF1-WHT-39','39',NULL,NULL,'{\"size\": \"39\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(11,2,'NK-AF1-WHT-40','40',NULL,NULL,'{\"size\": \"40\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(12,2,'NK-AF1-WHT-41','41',NULL,NULL,'{\"size\": \"41\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(13,2,'NK-AF1-WHT-42','42',NULL,NULL,'{\"size\": \"42\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(14,2,'NK-AF1-WHT-43','43',NULL,NULL,'{\"size\": \"43\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(15,2,'NK-AF1-WHT-44','44',NULL,NULL,'{\"size\": \"44\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(16,2,'NK-AF1-WHT-45','45',NULL,NULL,'{\"size\": \"45\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(17,3,'NK-PEG40-38','38',NULL,NULL,'{\"size\": \"38\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(18,3,'NK-PEG40-39','39',NULL,NULL,'{\"size\": \"39\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(19,3,'NK-PEG40-40','40',NULL,NULL,'{\"size\": \"40\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(20,3,'NK-PEG40-41','41',NULL,NULL,'{\"size\": \"41\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(21,3,'NK-PEG40-42','42',NULL,NULL,'{\"size\": \"42\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(22,3,'NK-PEG40-43','43',NULL,NULL,'{\"size\": \"43\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(23,3,'NK-PEG40-44','44',NULL,NULL,'{\"size\": \"44\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(24,3,'NK-PEG40-45','45',NULL,NULL,'{\"size\": \"45\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(25,4,'JD-J1MID-BRD-38','38',NULL,NULL,'{\"size\": \"38\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(26,4,'JD-J1MID-BRD-39','39',NULL,NULL,'{\"size\": \"39\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(27,4,'JD-J1MID-BRD-40','40',NULL,NULL,'{\"size\": \"40\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(28,4,'JD-J1MID-BRD-41','41',NULL,NULL,'{\"size\": \"41\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(29,4,'JD-J1MID-BRD-42','42',NULL,NULL,'{\"size\": \"42\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(30,4,'JD-J1MID-BRD-43','43',NULL,NULL,'{\"size\": \"43\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(31,4,'JD-J1MID-BRD-44','44',NULL,NULL,'{\"size\": \"44\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(32,4,'JD-J1MID-BRD-45','45',NULL,NULL,'{\"size\": \"45\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(33,5,'JD-J4-WHT-38','38',NULL,NULL,'{\"size\": \"38\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(34,5,'JD-J4-WHT-39','39',NULL,NULL,'{\"size\": \"39\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(35,5,'JD-J4-WHT-40','40',NULL,NULL,'{\"size\": \"40\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(36,5,'JD-J4-WHT-41','41',NULL,NULL,'{\"size\": \"41\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(37,5,'JD-J4-WHT-42','42',NULL,NULL,'{\"size\": \"42\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(38,5,'JD-J4-WHT-43','43',NULL,NULL,'{\"size\": \"43\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(39,5,'JD-J4-WHT-44','44',NULL,NULL,'{\"size\": \"44\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(40,5,'JD-J4-WHT-45','45',NULL,NULL,'{\"size\": \"45\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(41,6,'NK-DUNK-PND-38','38',NULL,NULL,'{\"size\": \"38\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(42,6,'NK-DUNK-PND-39','39',NULL,NULL,'{\"size\": \"39\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(43,6,'NK-DUNK-PND-40','40',NULL,NULL,'{\"size\": \"40\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(44,6,'NK-DUNK-PND-41','41',NULL,NULL,'{\"size\": \"41\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(45,6,'NK-DUNK-PND-42','42',NULL,NULL,'{\"size\": \"42\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(46,6,'NK-DUNK-PND-43','43',NULL,NULL,'{\"size\": \"43\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(47,6,'NK-DUNK-PND-44','44',NULL,NULL,'{\"size\": \"44\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(48,6,'NK-DUNK-PND-45','45',NULL,NULL,'{\"size\": \"45\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35'),(64,7,NULL,'38',NULL,NULL,NULL,0.00,0.000,0.000,0.000,0.000,'2026-02-04 13:58:24'),(65,7,NULL,'39',NULL,NULL,NULL,0.00,0.000,0.000,0.000,0.000,'2026-02-04 13:59:36'),(66,7,NULL,'40',NULL,NULL,NULL,0.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:15'),(67,7,NULL,'41',NULL,NULL,NULL,0.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:32'),(68,7,NULL,'42',NULL,NULL,NULL,0.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:45'),(69,8,'TEST-FS-1770901289472','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:01:30'),(70,9,'TEST-FS-1770901492725','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:04:53'),(71,10,'TEST-FS-1770901562442','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:06:03'),(72,11,'TEST-FS-1770901646528','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:07:26'),(73,12,'TEST-FS-1770901763475','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:09:24'),(74,13,'TEST-FS-1770901887369','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:11:27'),(75,14,'TEST-FS-1770902066999','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:14:27'),(76,15,'TEST-FS-1770902133761','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-12 13:15:34'),(77,16,'TEST-FS-1770944212477','42','Black',NULL,NULL,1000000.00,0.000,0.000,0.000,0.000,'2026-02-13 00:56:52');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(500) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `short_description` text,
  `description` longtext,
  `brand_id` bigint unsigned DEFAULT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `collection_id` bigint unsigned DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `retail_price` decimal(12,2) DEFAULT NULL,
  `cost_price` decimal(12,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_new_arrival` tinyint(1) DEFAULT '0',
  `view_count` int DEFAULT '0',
  `sale_count` int DEFAULT '0',
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sport_id` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  KEY `brand_id` (`brand_id`),
  KEY `category_id` (`category_id`),
  KEY `collection_id` (`collection_id`),
  KEY `idx_sku` (`sku`),
  KEY `idx_slug` (`slug`),
  KEY `fk_product_sport` (`sport_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  FULLTEXT KEY `idx_fts_product` (`name`,`sku`,`description`),
  CONSTRAINT `fk_product_sport` FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'NK-AM270-BLK','Nike Air Max 270','nike-air-max-270-black','Comfortable all-day wear','The Nike Air Max 270 is inspired by two icons of big Air: the Air Max 180 and Air Max 93. It features Nike\'s biggest heel Air unit yet for a super-soft ride that feels as impossible as it looks.',1,4,1,3829000.00,4500000.00,0.00,1,0,1,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-05 07:24:02',NULL,NULL),(2,'NK-AF1-WHT','Nike Air Force 1 \'07','nike-air-force-1-07-white','Classic basketball style','The radiance lives on in the Nike Air Force 1 \'07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to make you shine.',1,4,2,2929000.00,3500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),(3,'NK-PEG40','Nike Pegasus 40','nike-pegasus-40','Running made responsive','A springy ride for every run, the Peg\'s familiar, just-for-you feel returns to help you accomplish your goals. This version has the same responsiveness and neutral support you love but with improved comfort in those sensitive areas of your foot, like the arch and toes.',1,1,4,3519000.00,4200000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-10 08:38:18',1,NULL),(4,'JD-J1MID-BRD','Air Jordan 1 Mid','air-jordan-1-mid-bred','Iconic basketball style','Inspired by the original AJ1, this mid-top edition maintains the iconic look you love while choice colours and crisp leather give it a distinct identity. With an encapsulated Air-Sole unit for cushioning and a Jumpman logo for heritage, this sneaker delivers on all counts.',2,2,NULL,3829000.00,4500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),(5,'JD-J4-WHT','Air Jordan 4 Retro','air-jordan-4-retro-white-cement','Legendary performance','The Air Jordan 4 Retro brings back the iconic design with premium materials and Air cushioning. Featuring visible Air units and unique mesh panels, this shoe delivers the legendary look with modern comfort.',2,2,NULL,5589000.00,6500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),(6,'NK-DUNK-PND','Nike Dunk Low','nike-dunk-low-panda','Streetwear classic','Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colours. This basketball icon channels \'80s vibes with premium leather in the upper that looks good and breaks in even better.',1,4,3,2829000.00,3300000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-13 01:09:38',NULL,NULL),(7,'NK-MV16-ELT','Nike Mercurial Vapor 16 Elite','nike-mercurial-vapor-16-elite','','Obsessed with speed? So are the game\'s biggest stars. That\'s why we made this Elite boot with an improved 3/4-length Air Zoom unit. It gives you and the sport\'s fastest players the propulsive feel needed to break through the back line. The result is the most responsive Mercurial we\'ve ever made, because you demand greatness from yourself and your footwear.',1,6,NULL,5855000.00,7319000.00,0.00,1,0,1,0,0,NULL,NULL,'2026-02-04 11:02:44','2026-02-04 14:04:31',NULL,NULL),(8,'TEST-FS-1770901289472','Test Product Flash Sale','test-fs-1770901289472',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:01:30','2026-02-13 12:17:46',NULL,'2026-02-13 12:17:46'),(9,'TEST-FS-1770901492725','Test Product Flash Sale','test-fs-1770901492725',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:04:53','2026-02-13 12:17:51',NULL,'2026-02-13 12:17:51'),(10,'TEST-FS-1770901562442','Test Product Flash Sale','test-fs-1770901562442',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:06:03','2026-02-13 12:17:54',NULL,'2026-02-13 12:17:54'),(11,'TEST-FS-1770901646528','Test Product Flash Sale','test-fs-1770901646528',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:07:26','2026-02-13 12:17:57',NULL,'2026-02-13 12:17:57'),(12,'TEST-FS-1770901763475','Test Product Flash Sale','test-fs-1770901763475',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:09:24','2026-02-13 12:17:59',NULL,'2026-02-13 12:17:59'),(13,'TEST-FS-1770901887369','Test Product Flash Sale','test-fs-1770901887369',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:11:27','2026-02-13 12:18:02',NULL,'2026-02-13 12:18:02'),(14,'TEST-FS-1770902066999','Test Product Flash Sale','test-fs-1770902066999',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:14:27','2026-02-13 12:18:05',NULL,'2026-02-13 12:18:05'),(15,'TEST-FS-1770902133761','Test Product Flash Sale','test-fs-1770902133761',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-12 13:15:34','2026-02-13 12:17:13',NULL,'2026-02-13 12:17:13'),(16,'TEST-FS-1770944212477','Test Product Flash Sale','test-fs-1770944212477',NULL,'Test Desc',NULL,NULL,NULL,1000000.00,NULL,0.00,0,0,0,0,0,NULL,NULL,'2026-02-13 00:56:52','2026-02-13 12:18:16',NULL,'2026-02-13 12:18:16');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rate_limits`
--

DROP TABLE IF EXISTS `rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limits` (
  `key` varchar(255) NOT NULL,
  `count` int NOT NULL DEFAULT '0',
  `expires_at` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `idx_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rate_limits`
--

LOCK TABLES `rate_limits` WRITE;
/*!40000 ALTER TABLE `rate_limits` DISABLE KEYS */;
INSERT INTO `rate_limits` VALUES ('auth:127.0.0.1',11,1770960173278);
/*!40000 ALTER TABLE `rate_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_requests`
--

DROP TABLE IF EXISTS `refund_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text NOT NULL,
  `images` json DEFAULT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `admin_response` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refund_requests_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `refund_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_requests`
--

LOCK TABLES `refund_requests` WRITE;
/*!40000 ALTER TABLE `refund_requests` DISABLE KEYS */;
INSERT INTO `refund_requests` VALUES (1,53,1,4500000.00,'lỗi','[\"/uploads/reviews/1771038672882-fda0c754-3c54-4052-9cdf-a34924747479.png\"]','approved','Yêu cầu hoàn tiền đã được chấp nhận.','2026-02-14 03:11:13','2026-02-14 03:28:36');
/*!40000 ALTER TABLE `refund_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_media`
--

DROP TABLE IF EXISTS `review_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `review_id` bigint unsigned NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_url` varchar(1000) NOT NULL,
  `thumbnail_url` varchar(1000) DEFAULT NULL COMMENT 'Thumbnail for videos or optimized image',
  `file_size` int DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the file',
  `position` int DEFAULT '0' COMMENT 'Display order',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_review_id` (`review_id`),
  KEY `idx_media_type` (`media_type`),
  CONSTRAINT `fk_review_media_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores media (images and videos) attached to product reviews';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_media`
--

LOCK TABLES `review_media` WRITE;
/*!40000 ALTER TABLE `review_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission`
--

DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permission_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission`
--

LOCK TABLES `role_permission` WRITE;
/*!40000 ALTER TABLE `role_permission` DISABLE KEYS */;
INSERT INTO `role_permission` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(3,3),(3,4),(3,5),(3,6);
/*!40000 ALTER TABLE `role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,4,7);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'customer','Regular customer','2025-12-06 14:11:35','2025-12-06 14:11:35'),(2,'vip','VIP customer with special privileges','2025-12-06 14:11:35','2025-12-06 14:11:35'),(3,'admin','Administrator with full access','2025-12-06 14:11:35','2025-12-06 14:11:35'),(4,'super_admin','Full access to all systems','2026-02-15 12:13:48','2026-02-15 12:13:48'),(5,'manager','Manage inventory and orders','2026-02-15 12:13:48','2026-02-15 12:13:48'),(6,'staff','View and update status but no deletions','2026-02-15 12:13:48','2026-02-15 12:13:48'),(7,'support','Customer chat and basic viewing','2026-02-15 12:13:48','2026-02-15 12:13:48');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_logs`
--

DROP TABLE IF EXISTS `security_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `admin_id` bigint unsigned DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `details` json DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event` (`event_type`),
  KEY `idx_ip` (`ip_address`),
  KEY `idx_user` (`user_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_logs`
--

LOCK TABLES `security_logs` WRITE;
/*!40000 ALTER TABLE `security_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seo_metadata`
--

DROP TABLE IF EXISTS `seo_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seo_metadata` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` enum('product','category','collection','page') NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `keywords` varchar(500) DEFAULT NULL,
  `og_image_url` varchar(1000) DEFAULT NULL,
  `canonical_url` varchar(500) DEFAULT NULL,
  `structured_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seo_metadata`
--

LOCK TABLES `seo_metadata` WRITE;
/*!40000 ALTER TABLE `seo_metadata` DISABLE KEYS */;
/*!40000 ALTER TABLE `seo_metadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'store_name','Nike Clone','2026-01-27 08:06:42'),(2,'store_email','admin@nike-clone.com','2026-01-27 08:06:42'),(3,'store_phone','0123456789','2026-01-27 08:06:42'),(4,'store_address','123 Main Street','2026-01-27 08:06:42'),(5,'store_city','Hanoi','2026-01-27 08:06:42'),(6,'store_country','Vietnam','2026-01-27 08:06:42'),(7,'store_currency','VND','2026-01-27 08:06:42'),(8,'tax_rate','0.1','2026-01-27 08:06:42'),(9,'shipping_cost_domestic','30000','2026-01-27 08:06:42'),(10,'shipping_cost_international','100000','2026-01-27 08:06:42'),(11,'maintenance_mode','false','2026-02-01 12:38:21');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_items`
--

DROP TABLE IF EXISTS `shipment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `shipment_id` bigint unsigned NOT NULL,
  `order_item_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shipment_id` (`shipment_id`),
  KEY `order_item_id` (`order_item_id`),
  CONSTRAINT `shipment_items_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shipment_items_ibfk_2` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_items`
--

LOCK TABLES `shipment_items` WRITE;
/*!40000 ALTER TABLE `shipment_items` DISABLE KEYS */;
INSERT INTO `shipment_items` VALUES (1,1,43,1);
/*!40000 ALTER TABLE `shipment_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `warehouse_id` bigint unsigned DEFAULT NULL,
  `tracking_code` varchar(100) DEFAULT NULL,
  `carrier` varchar(50) DEFAULT 'manual',
  `status` enum('pending','shipped','delivered','returned','cancelled') DEFAULT 'pending',
  `shipped_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_code` (`tracking_code`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_tracking_code` (`tracking_code`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (1,45,NULL,'TRK1770985473738','GHTK','pending',NULL,'2026-02-13 19:24:33','2026-02-13 19:24:33');
/*!40000 ALTER TABLE `shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sports`
--

DROP TABLE IF EXISTS `sports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sports`
--

LOCK TABLES `sports` WRITE;
/*!40000 ALTER TABLE `sports` DISABLE KEYS */;
INSERT INTO `sports` VALUES (1,'Running','running','Running shoes and gear',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(2,'Basketball','basketball','Basketball shoes and apparel',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(3,'Training & Gym','training','Training and gym gear',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(4,'Football','football','Football boots and kits',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(5,'Tennis','tennis','Tennis shoes and apparel',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(6,'Yoga','yoga','Yoga and lifestyle apparel',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51'),(7,'Skateboarding','skateboarding','Skateboarding shoes and gear',NULL,1,'2026-02-10 06:36:51','2026-02-10 06:36:51');
/*!40000 ALTER TABLE `sports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_reservations`
--

DROP TABLE IF EXISTS `stock_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reservations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL,
  `items` json NOT NULL COMMENT 'Array of {productVariantId, quantity}',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_reservations`
--

LOCK TABLES `stock_reservations` WRITE;
/*!40000 ALTER TABLE `stock_reservations` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_hours`
--

DROP TABLE IF EXISTS `store_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_hours` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `day_of_week` tinyint NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `store_id` (`store_id`),
  CONSTRAINT `store_hours_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_hours`
--

LOCK TABLES `store_hours` WRITE;
/*!40000 ALTER TABLE `store_hours` DISABLE KEYS */;
INSERT INTO `store_hours` VALUES (1,1,0,'09:00:00','22:00:00',0),(2,1,1,'09:00:00','22:00:00',0),(3,1,2,'09:00:00','22:00:00',0),(4,1,3,'09:00:00','22:00:00',0),(5,1,4,'09:00:00','22:00:00',0),(6,1,5,'09:00:00','22:00:00',0),(7,1,6,'09:00:00','23:00:00',0),(8,2,0,'09:30:00','22:00:00',0),(9,2,1,'09:30:00','22:00:00',0),(10,2,2,'09:30:00','22:00:00',0),(11,2,3,'09:30:00','22:00:00',0),(12,2,4,'09:30:00','22:00:00',0),(13,2,5,'09:30:00','22:00:00',0),(14,2,6,'09:30:00','23:00:00',0),(15,3,0,'09:00:00','22:00:00',0),(16,3,1,'09:00:00','22:00:00',0),(17,3,2,'09:00:00','22:00:00',0),(18,3,3,'09:00:00','22:00:00',0),(19,3,4,'09:00:00','22:00:00',0),(20,3,5,'09:00:00','22:00:00',0),(21,3,6,'09:00:00','23:00:00',0);
/*!40000 ALTER TABLE `store_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `store_code` varchar(50) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Vietnam',
  `postal_code` varchar(20) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text,
  `features` json DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `opening_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `store_code` (`store_code`),
  KEY `idx_city` (`city`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'Nike Store Vincom Đồng Khởi','nike-vincom-dong-khoi','HCM-VCM01','72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1','Hồ Chí Minh',NULL,'Vietnam',NULL,'0283822xxxx','dongkhoi@nike.vn',10.77688900,106.70245100,'Cửa hàng Nike chính thức tại trung tâm TP.HCM',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),(2,'Nike Store Vincom Mega Mall','nike-vincom-mega-mall','HN-VCM02','458 Minh Khai, Quận Hai Bà Trưng','Hà Nội',NULL,'Vietnam',NULL,'02466823xxxx','hanoi@nike.vn',20.99916700,105.85888900,'Cửa hàng Nike lớn nhất Hà Nội',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),(3,'Nike Store Vincom Center','nike-vincom-center-danang','DN-VCM01','910-912 Ngô Quyền, Quận Sơn Trà','Đà Nẵng',NULL,'Vietnam',NULL,'02363822xxxx','danang@nike.vn',16.06194400,108.22916700,'Nike Store tại Đà Nẵng',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:28');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_chats`
--

DROP TABLE IF EXISTS `support_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_chats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `guest_email` varchar(255) DEFAULT NULL,
  `guest_name` varchar(255) DEFAULT NULL,
  `status` enum('active','waiting','resolved','closed') DEFAULT 'waiting',
  `access_token` varchar(255) DEFAULT NULL,
  `assigned_admin_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_message_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_admin_id` (`assigned_admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_user` (`user_id`),
  KEY `idx_updated` (`updated_at`),
  KEY `idx_last_message` (`last_message_at`),
  KEY `idx_access_token` (`access_token`),
  CONSTRAINT `support_chats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `support_chats_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_chats`
--

LOCK TABLES `support_chats` WRITE;
/*!40000 ALTER TABLE `support_chats` DISABLE KEYS */;
INSERT INTO `support_chats` VALUES (11,1,NULL,NULL,'resolved',NULL,3,'2026-02-07 14:16:44','2026-02-07 15:06:37','2026-02-07 14:19:37'),(14,1,NULL,NULL,'resolved',NULL,1,'2026-02-09 00:04:26','2026-02-10 09:17:35','2026-02-10 09:17:28'),(15,1,NULL,NULL,'resolved',NULL,1,'2026-02-09 00:04:26','2026-02-10 09:17:46','2026-02-10 09:15:55'),(16,1,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:24:24','2026-02-10 09:30:34','2026-02-10 09:24:32'),(17,1,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:24:24','2026-02-10 09:30:44','2026-02-10 09:24:24'),(18,1,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:30:56','2026-02-10 09:32:01','2026-02-10 09:31:12'),(19,1,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:32:14','2026-02-10 09:32:37','2026-02-10 09:32:14');
/*!40000 ALTER TABLE `support_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_messages`
--

DROP TABLE IF EXISTS `support_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `chat_id` bigint unsigned NOT NULL,
  `sender_type` enum('customer','admin') NOT NULL,
  `sender_id` bigint unsigned DEFAULT NULL,
  `message` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_chat` (`chat_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_read` (`is_read`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `support_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_messages`
--

LOCK TABLES `support_messages` WRITE;
/*!40000 ALTER TABLE `support_messages` DISABLE KEYS */;
INSERT INTO `support_messages` VALUES (15,11,'customer',1,'Xin chào, tôi cần hỗ trợ!',NULL,1,'2026-02-07 14:16:44'),(16,11,'admin',3,'ok',NULL,1,'2026-02-07 14:18:55'),(17,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:15'),(18,11,'admin',3,'ok',NULL,1,'2026-02-07 14:19:27'),(19,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:37'),(20,15,'admin',1,'hi',NULL,1,'2026-02-10 09:15:55'),(21,14,'customer',1,'hi',NULL,1,'2026-02-10 09:16:03'),(22,14,'admin',1,'hi',NULL,1,'2026-02-10 09:16:15'),(23,14,'admin',1,'ok',NULL,1,'2026-02-10 09:16:33'),(24,14,'customer',1,'','/uploads/chat/1770715024944-1-Screenshot_2026-02-10_093337.png',0,'2026-02-10 09:17:05'),(25,14,'admin',1,'ok',NULL,1,'2026-02-10 09:17:28'),(26,16,'customer',1,'hi',NULL,1,'2026-02-10 09:24:32'),(27,18,'customer',1,'hi',NULL,1,'2026-02-10 09:30:58'),(28,18,'admin',1,'ok',NULL,1,'2026-02-10 09:31:12');
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_config`
--

LOCK TABLES `system_config` WRITE;
/*!40000 ALTER TABLE `system_config` DISABLE KEYS */;
INSERT INTO `system_config` VALUES (1,'site_name','TOAN Store Nike Store','Website name','2025-12-06 14:11:35'),(2,'site_email','info@TOAN Store-nike.com','Contact email','2025-12-06 14:11:35'),(3,'site_phone','1900-xxxx','Contact phone','2025-12-06 14:11:35'),(4,'currency','VND','Default currency','2025-12-06 14:11:35'),(5,'tax_rate','10','Tax rate percentage','2025-12-06 14:11:35'),(6,'shipping_fee','30000','Default shipping fee','2025-12-06 14:11:35'),(7,'free_shipping_threshold','500000','Minimum order for free shipping','2025-12-06 14:11:35'),(8,'order_prefix','NK','Order number prefix','2025-12-06 14:11:35'),(9,'products_per_page','12','Products per page in listing','2025-12-06 14:11:35'),(10,'facebook_pixel_id','123456789','Facebook Pixel ID for tracking','2025-12-06 14:11:35'),(11,'google_analytics_id','UA-123456-1','Google Analytics tracking ID','2025-12-06 14:11:35');
/*!40000 ALTER TABLE `system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level` varchar(20) NOT NULL DEFAULT 'ERROR',
  `message` text NOT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_logs`
--

LOCK TABLES `system_logs` WRITE;
/*!40000 ALTER TABLE `system_logs` DISABLE KEYS */;
INSERT INTO `system_logs` VALUES (1,'TEST','Test Error Log 1770967307029','{\"note\": \"Verification\"}','2026-02-13 07:21:47');
/*!40000 ALTER TABLE `system_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `payment_provider` enum('vnpay','momo') NOT NULL,
  `transaction_code` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','success','failed','refunded') DEFAULT 'pending',
  `response_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address_line` varchar(255) DEFAULT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Vietnam',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (7,1,'Nhà','DANG THANH TOAN Store','0869426904','TTN14, Xã Tân Thới Nhì',NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',1,'2025-12-07 07:43:38'),(8,1,'Văn Phòng','DANG THANH TOAN Store','0869426904','TTN14, Xã Tân Thới Nhì',NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',0,'2025-12-07 09:49:27'),(9,2,'Nhà','DANG THANH TOAN Store','0869426904','TTN14',NULL,NULL,'HO CHI MINH','Thành phố Hồ Chí Minh','700000','Vietnam',1,'2025-12-08 02:05:25');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_verified` tinyint(1) DEFAULT '0',
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_banned` tinyint(1) DEFAULT '0' COMMENT 'User banned status: 0 = active, 1 = banned',
  `accumulated_points` int DEFAULT '0',
  `membership_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `facebook_id` (`facebook_id`),
  KEY `idx_is_banned` (`is_banned`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'thanhTOAN Store06092004@gmail.com',0,'$2b$10$nLRY6Uyu.3TgJzUP2GuyG.U7c1uVa0C4hFBMfw8hzWubSVRO7vZti','DANG','TOAN Store','DANG TOAN Store','f8a5cd9173ff381c41e5dae02c201c56:0f575b2542441ed1762f6fc2a32aca12:66ee96551c215400e5f2','2004-09-05','male',1,0,'{\"gender\": \"male\", \"dateOfBirth\": \"2004-09-06\"}','2025-12-06 14:42:48','2026-02-14 06:48:38',0,2497,'silver',NULL,NULL,NULL,NULL),(2,'dangthanhTOAN Store06092004@gmail.com',0,'$2b$10$ckcKXxzPwAkzxq/qhxNeKOMM4MBJbkyBRTe3D.FpPB28Ux4OTbm2S','DANG','TOAN Store',NULL,'0869426904','2004-09-06','male',0,0,NULL,'2025-12-08 01:37:41','2026-02-09 02:51:55',0,0,'bronze',NULL,NULL,NULL,NULL),(3,'admin@nike.com',1,'$2b$10$SuU03Q1KXM0s0xvv6GClZeSq3YatLys0VcYp8z6uBQVd9nL3aZWiO',NULL,NULL,'Admin Nike',NULL,NULL,NULL,1,0,NULL,'2025-12-10 04:21:46','2025-12-10 04:27:58',0,0,'bronze',NULL,NULL,NULL,NULL),(6,'test_verification_1770196152084_865@test.com',0,'$2b$10$ixRrk79ACe7/H3UWZ60QzOrGAQywqL.AyaTYYfcNX8xIrehr6JhK2','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:09:15','2026-02-04 09:09:15',0,0,'bronze',NULL,NULL,NULL,NULL),(7,'test_verification_1770196177715_183@test.com',0,'$2b$10$q/TyR5q1a1yauf1z10abO.E1dvGpNo9mzdMbVBxIA/9JG9wUmUgs.','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:09:38','2026-02-04 09:09:38',0,0,'bronze',NULL,NULL,NULL,NULL),(8,'test_verification_1770196190324_704@test.com',0,'$2b$10$pdDY9p.PpKbYBqVnsG9tPe6z7cx5TMIqazl21FepE8hxMkpMdy3xO','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:09:50','2026-02-04 09:09:50',0,0,'bronze',NULL,NULL,NULL,NULL),(9,'test_verification_1770196218804_939@test.com',0,'$2b$10$IWN2xYVQ3Sg9xohSblnlWeQeXoi3Hpud02B6Iw0eHxSQ.Ppl92RlC','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:10:19','2026-02-04 09:10:19',0,0,'bronze',NULL,NULL,NULL,NULL),(10,'test_verification_1770196270063_142@test.com',0,'$2b$10$8NSrH36.Z11mF.9q9GrgvO8QYN0RKQhW5oEmuR9aEvX8X501/CGMO','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:11:10','2026-02-04 09:11:10',0,0,'bronze',NULL,NULL,NULL,NULL),(11,'test_verification_1770196336710_629@test.com',0,'$2b$10$UmSzkSJNbZxGw4RSeYcfQOxrAzjSbS2jBTCtnQsdSLbvSRs/SYNBK','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:12:17','2026-02-04 09:12:17',0,0,'bronze',NULL,NULL,NULL,NULL),(12,'test_verification_1770196388962_527@test.com',0,'$2b$10$dkDoNZkpWd6BEpSC3eFEKuqOXzLpJTsf65jkJU/okIYJQpOmkjYTu','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:13:09','2026-02-04 09:13:09',0,0,'bronze',NULL,NULL,NULL,NULL),(13,'test_verification_1770196420886_291@test.com',0,'$2b$10$QTcw9lV.1ttFIDtZyXnppO2VBvxld71Ts8Xfv11yyAHEl5v3F/Cu.','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:13:41','2026-02-04 09:13:41',0,0,'bronze',NULL,NULL,NULL,NULL),(14,'test_verification_1770196438232_890@test.com',0,'$2b$10$OdLmHOdv0r1jhYnwg42/4ej/FAXcWJESUcqLR36zPdy5hNEnQ0kRS','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:13:58','2026-02-04 09:13:58',0,0,'bronze',NULL,NULL,NULL,NULL),(15,'test_verification_1770196522682_861@test.com',0,'$2b$10$f9NucRiBNuNTK/jMlJtMF.0o6lgGwVmtiUjGk5xLV3lzeAIM4idz2','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:15:23','2026-02-04 09:15:23',0,0,'bronze',NULL,NULL,NULL,NULL),(16,'test_verification_1770196530276_629@test.com',0,'$2b$10$pCFXt/cYQX44E0nEwIyxqOgszs31SCAdaTwY5fvQTmwGgomAJHOk.','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:15:30','2026-02-04 09:15:30',0,0,'bronze',NULL,NULL,NULL,NULL),(17,'test_verification_1770196576327_351@test.com',0,'$2b$10$qcdHBfSITdl9dqazlK.9geJ/fziSX/nrkS2gHyX7NPFtHwB/7lokG','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:16:16','2026-02-04 09:16:16',0,0,'bronze',NULL,NULL,NULL,NULL),(18,'test_verification_1770196690357_898@test.com',0,'$2b$10$Tsb2SsftLQUvkR96AvUdd.gscRe9LUgglq7IL3G.2xADHGQdhMeqO','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:18:10','2026-02-04 09:18:10',0,0,'bronze',NULL,NULL,NULL,NULL),(19,'test_verification_1770196781445_673@test.com',0,'$2b$10$V5vwmZRtJsIw2M2.QBiFVOpRqyLekUOIWSw99ByS6gwy1WTLVPPVy','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:19:41','2026-02-04 09:19:41',0,0,'bronze',NULL,NULL,NULL,NULL),(20,'test_verification_1770196799493_188@test.com',0,'$2b$10$lmy9tAAYkrYAhttZHyB9duVXwcjRCMBI4kNaCPO2C0L6fAAMxzpFi','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:19:59','2026-02-04 09:19:59',0,0,'bronze',NULL,NULL,NULL,NULL),(21,'test_verification_1770196814420_499@test.com',0,'$2b$10$iRDO4qMTFLWAFtQaZ/H2vutptNbam8TNQkWdY0Nmqpfm5UyyHSeOS','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:20:14','2026-02-04 09:20:14',0,0,'bronze',NULL,NULL,NULL,NULL),(22,'test_verification_1770196849510_99@test.com',0,'$2b$10$1q6RwkRAN3hUHX6bsPwo7ebQcUKllqlPkXsH0pMBA3qU0PX1GqThW','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:20:49','2026-02-04 09:20:49',0,0,'bronze',NULL,NULL,NULL,NULL),(23,'test_verification_1770196885236_666@test.com',0,'$2b$10$IeqQBcR.2Kz8qh9YCbQVXOLifFosOwrrx25wIOeMvsYFlgbQJsRhO','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:21:28','2026-02-04 09:21:28',0,0,'bronze',NULL,NULL,NULL,NULL),(24,'test_verification_1770196911554_987@test.com',0,'$2b$10$DSk/.W0ad56g6PoqotIZmutwA8yDleA6byel3gPF3ruRnvnRQR.Za','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:21:51','2026-02-04 09:21:51',0,0,'bronze',NULL,NULL,NULL,NULL),(25,'test_verification_1770196924005_936@test.com',0,'$2b$10$2vQwvrg4qmrBKUMl66qLoe5iOe/XVx4376qUPOVKc1.sNkYOnlzk.','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:22:04','2026-02-04 09:22:04',0,0,'bronze',NULL,NULL,NULL,NULL),(26,'test_verification_1770196939766_998@test.com',0,'$2b$10$MCsptWJx27pccKvfV.GjnutzyVttsYt.d3EB5aZ9zPgwPuHl1Yase','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:22:20','2026-02-04 09:22:20',0,0,'bronze',NULL,NULL,NULL,NULL),(27,'test_verification_1770196957823_475@test.com',0,'$2b$10$oDNdSJQMPejY.XK4xIxNcOGJMl.WtrjH7dzwWT/AvLiladpAWJqiS','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:22:38','2026-02-04 09:22:38',0,0,'bronze',NULL,NULL,NULL,NULL),(28,'test_verification_1770197057100_972@test.com',0,'$2b$10$rymyee6vtqVLbKSozOQto.4z.VBogfjfeQLp3840Siz4VKsnLMMta','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:24:17','2026-02-04 09:24:17',0,0,'bronze',NULL,NULL,NULL,NULL),(29,'test_verification_1770197147670_418@test.com',0,'$2b$10$vDEbwbBMfif1SvJTlypppuYTV9ziv2Tw.DrHK.kTIMVy4jk8C4rQ2','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:25:50','2026-02-04 09:25:50',0,0,'bronze',NULL,NULL,NULL,NULL),(30,'test_verification_1770198110548_875@test.com',0,'$2b$10$kaXB15Smuy1KsPQKsrP2QeW2cRt./2Kw9QIcpgx6WkNMpljRpjsDK','Test','User',NULL,'0123456789','2000-01-01','male',1,0,NULL,'2026-02-04 09:41:51','2026-02-04 09:41:51',0,0,'bronze',NULL,NULL,NULL,NULL),(31,'test@example.com',0,'$2b$10$EpIx.i.vS/WvL5.z/S.t.e',NULL,NULL,'Test User',NULL,NULL,NULL,1,0,NULL,'2026-02-11 00:30:23','2026-02-11 00:30:23',0,0,'bronze',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL COMMENT 'Unique voucher code',
  `value` decimal(12,2) NOT NULL COMMENT 'Credit value of voucher',
  `applicable_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `min_order_value` decimal(12,2) DEFAULT '0.00',
  `applicable_categories` json DEFAULT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `recipient_user_id` (`recipient_user_id`),
  KEY `redeemed_by_user_id` (`redeemed_by_user_id`),
  KEY `status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_2` FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'GIFT2024-001',100000.00,'bronze',0.00,NULL,'fixed','Gift code $100k credits',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-30 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:42:32',NULL),(2,'REF-SIGN100',50000.00,'bronze',0.00,NULL,'fixed','Referral sign up reward',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-30 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:42:24',NULL),(3,'WELCOME-NEW',200000.00,'bronze',0.00,NULL,'fixed','Welcome new customer',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-06-29 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:38:49',NULL);
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'Kho Hà Nội (Main)','Hà Nội',1,'2026-02-13 07:03:50','2026-02-13 07:03:50'),(2,'Kho TP.HCM','TP. Hồ Chí Minh',1,'2026-02-13 07:03:50','2026-02-13 07:03:50');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wishlist_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_product` (`wishlist_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (31,1,2,'2026-02-03 06:18:24'),(32,1,1,'2026-02-08 23:46:18');
/*!40000 ALTER TABLE `wishlist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(255) DEFAULT 'My Wishlist',
  `is_default` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
INSERT INTO `wishlists` VALUES (1,1,'My Wishlist',1,'2025-12-07 09:06:49'),(2,2,'My Wishlist',1,'2025-12-08 01:40:27');
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-15 22:04:17
