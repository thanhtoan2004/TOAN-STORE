-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: toan_store
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
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES (1,'001_baseline.sql','2026-02-13 07:03:50'),(2,'002_create_warehouses_table.sql','2026-02-13 07:06:12'),(3,'003_add_inventory_column.sql','2026-02-13 07:08:54'),(4,'004_update_inventory_data.sql','2026-02-13 07:08:54'),(5,'003_skip.sql','2026-02-13 07:10:57'),(6,'0000_reflective_lady_vermin.sql','2026-02-15 12:20:10'),(7,'0001_reflective_iceman.sql','2026-02-15 12:20:10'),(8,'2026_03_06_1001_phase_1_low_risk.sql','2026-03-06 06:43:13'),(9,'2026_03_06_1002_phase_2_auth_support.sql','2026-03-06 07:02:00'),(10,'2026_03_06_1003_phase_3_high_risk.sql','2026-03-06 07:04:13'),(11,'2026_03_06_1004_phase_4_cleanup.sql','2026-03-06 10:02:47'),(12,'2026_03_06_1005_final_optimization_and_seed.sql','2026-03-06 13:42:19'),(13,'004_b_fix_warehouse_type.sql','2026-03-08 01:15:11'),(14,'005_add_inventory_fk.sql','2026-03-08 01:15:11'),(15,'006_create_system_logs.sql','2026-03-08 01:15:11'),(16,'2026_02_14_ai_embeddings.sql','2026-03-08 01:15:11'),(17,'2026_02_14_tier_vouchers.sql','2026-03-08 01:15:11'),(18,'2026_03_06_1005_phase_5_and_6.sql','2026-03-08 01:16:57'),(19,'2026_03_06_1005_phase_5_optimization.sql','2026-03-08 01:17:35'),(26,'2026_03_08_1101_step1_cleanup.sql','2026-03-08 01:47:06'),(27,'2026_03_08_1102_step2_constraints.sql','2026-03-08 01:47:07'),(28,'2026_03_08_1103_step3_orders_pricing.sql','2026-03-08 01:47:07'),(29,'2026_03_08_1104_step4_giftcard_security.sql','2026-03-08 01:47:08'),(30,'2026_03_08_1105_step5_infra_performance.sql','2026-03-08 01:47:08'),(33,'2026_03_08_1106_step6_deep_cleanup.sql','2026-03-08 02:43:03'),(34,'2026_03_08_1107_step7_soft_delete_parity.sql','2026-03-08 02:43:03'),(35,'2026_03_08_1108_step10_audit_hardening.sql','2026-03-08 03:15:30'),(36,'2026_03_08_1200_step11_audit_refinement.sql','2026-03-08 06:16:40'),(37,'2026_03_08_1315_step12_final_optimization.sql','2026-03-08 06:16:41'),(38,'2026_03_08_1400_step13_security_and_normalization.sql','2026-03-08 06:54:04'),(39,'2026_03_08_1430_step14_final_normalization_cleanup.sql','2026-03-08 07:34:54'),(40,'2026_03_08_2000_step15_advanced_audit_fixes.sql','2026-03-08 12:49:27'),(41,'2026_03_09_1100_phase17_logic_hardening.sql','2026-03-09 05:42:29'),(42,'2026_03_08_2100_step16_deep_audit_fixes.sql','2026-03-10 11:34:32'),(43,'2026_03_08_2300_step17_final_hardening.sql','2026-03-10 11:48:19'),(44,'2026_03_09_0000_phase15_full_fix.sql','2026-03-10 11:59:37'),(45,'2026_03_09_1000_phase16_audit_fixes.sql','2026-03-10 11:59:37'),(46,'2026_03_09_1200_phase17_email_hardening.sql','2026-03-10 11:59:37'),(47,'2026_03_12_2000_maintenance_performance.sql','2026-03-12 07:51:30'),(48,'2026_03_17_2001_admin_security_baseline.sql','2026-03-17 15:16:40');
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
  KEY `idx_entity_created` (`entity_type`,`entity_id`,`created_at` DESC),
  KEY `idx_action_created` (`action`,`created_at` DESC),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_activity_logs`
--

LOCK TABLES `admin_activity_logs` WRITE;
/*!40000 ALTER TABLE `admin_activity_logs` DISABLE KEYS */;
INSERT INTO `admin_activity_logs` VALUES (8,1,'soft_delete_flash_sale','flash_sales',10,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:29'),(9,1,'soft_delete_flash_sale','flash_sales',9,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:33'),(10,1,'soft_delete_flash_sale','flash_sales',7,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:36'),(11,1,'soft_delete_flash_sale','flash_sales',6,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:41'),(12,1,'soft_delete_flash_sale','flash_sales',5,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:16:46'),(13,1,'create_shipment','shipments',1,NULL,'{\"items\": [{\"quantity\": 1, \"orderItemId\": 43}], \"orderId\": 45}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-13 12:24:33'),(14,1,'update_voucher','vouchers',3,NULL,'{\"code\": \"WELCOME-NEW\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:38:49'),(15,1,'update_voucher','vouchers',2,NULL,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:42:24'),(16,1,'update_voucher','vouchers',1,NULL,'{\"code\": \"GIFT2024-001\", \"status\": \"active\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-02-14 06:42:32'),(17,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:16:50'),(18,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:35:55'),(19,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:43:43'),(20,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:44:39'),(21,1,'VERIFY_AUDIT_PHASE_23','test_module',1,'{\"name\": \"Old Product Name\", \"retail_price\": 100000}','{\"name\": \"New Product Name\", \"retail_price\": 90000}','system',NULL,'2026-02-15 03:46:16'),(22,1,'update_voucher','vouchers',2,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','{}','system',NULL,'2026-03-01 13:33:29'),(23,1,'update_voucher','vouchers',2,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','{}','system',NULL,'2026-03-01 13:33:48'),(24,1,'update_voucher','vouchers',2,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','{}','system',NULL,'2026-03-01 13:36:45'),(25,1,'update_voucher','vouchers',2,'{\"code\": \"REF-SIGN100\", \"status\": \"active\"}','{}','system',NULL,'2026-03-01 13:36:57'),(26,1,'create_voucher','vouchers',4,'{\"code\": \"TOAN\", \"value\": 100000}','{}','system',NULL,'2026-03-01 13:38:09'),(27,1,'create_voucher','vouchers',5,'{\"code\": \"THANHTOAN\", \"value\": 100000}','{}','system',NULL,'2026-03-01 14:17:46'),(28,1,'soft_delete_voucher','vouchers',5,NULL,'{}','system',NULL,'2026-03-01 14:20:34'),(29,1,'create_voucher','vouchers',8,'{\"code\": \"ABCD\", \"value\": 10000000}','{}','system',NULL,'2026-03-01 14:53:56'),(30,1,'UPDATE_ORDER_STATUS','order',57,'{\"oldStatus\": \"pending\"}','{\"status\": \"processing\", \"orderNumber\": \"NK1773730257531_CTP8\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-03-18 02:08:26'),(31,1,'create_shipment','shipments',2,'{\"items\": [{\"quantity\": 1, \"orderItemId\": 53}], \"orderId\": 57}','{}','system',NULL,'2026-03-18 02:12:22'),(32,1,'UPDATE_ORDER_STATUS','order',57,'{\"oldStatus\": \"processing\"}','{\"status\": \"cancelled\", \"orderNumber\": \"NK1773730257531_CTP8\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','2026-03-18 02:12:42');
/*!40000 ALTER TABLE `admin_activity_logs` ENABLE KEYS */;
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
  `email_hash` varchar(64) DEFAULT NULL,
  `email_encrypted` text,
  `is_encrypted` tinyint(1) DEFAULT '0',
  `password` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `bio` text,
  `avatar_url` varchar(1000) DEFAULT NULL,
  `social_links` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete timestamp — NULL = active, NOT NULL = deleted',
  `role_id` bigint unsigned DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL,
  `two_factor_secret` text,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_type` varchar(20) DEFAULT 'email',
  `two_factor_backup_codes` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `idx_admin_email_hash` (`email_hash`),
  KEY `idx_admin_deleted_at` (`deleted_at`),
  KEY `fk_admin_users_role` (`role_id`),
  CONSTRAINT `fk_admin_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin','***','79361cc16f1fd3d162b4e82985e49f42b3b26404b6a6305a8af6d1e683757229','8a5348bd128682c966f657dff257619c:80413d3e75bc4754f43e091fb25148f9:d5142fff2ff48405d42252adf347287cd08a80',1,'$2b$10$W4tn4nrvGPujeKgkUQTc4ej7Ya4HVb5MgIcfE2dy8M.xtss5S0Pc2','System Administrator',NULL,NULL,NULL,1,NULL,'2025-12-06 14:11:35','2026-03-11 01:03:16',NULL,4,0,NULL,NULL,0,'email',NULL),(2,'manager','***','a5439cc3f1e33de363a076783955e06411c87e9a3ca8fe910f50e448ce594699','118a798e8182d1349fb088c3ffb58891:92652e8de1ac8e770a28d89c375c7404:affef143de01324654257f2ec03133475a645f3b5d',1,NULL,'Store Manager',NULL,NULL,NULL,0,NULL,'2025-12-06 14:11:35','2026-03-09 15:20:39',NULL,NULL,0,NULL,NULL,0,'email',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archive_admin_activity_logs`
--

DROP TABLE IF EXISTS `archive_admin_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archive_admin_activity_logs` (
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
  KEY `idx_entity_created` (`entity_type`,`entity_id`,`created_at` DESC),
  KEY `idx_action_created` (`action`,`created_at` DESC),
  KEY `fk_archive_admin_user` (`admin_user_id`),
  CONSTRAINT `fk_archive_admin_user_id` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archive_admin_activity_logs`
--

LOCK TABLES `archive_admin_activity_logs` WRITE;
/*!40000 ALTER TABLE `archive_admin_activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `archive_admin_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archive_search_analytics`
--

DROP TABLE IF EXISTS `archive_search_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archive_search_analytics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `query` varchar(255) NOT NULL,
  `category_filter` varchar(100) DEFAULT NULL,
  `results_count` int DEFAULT '0',
  `processing_time_ms` int DEFAULT '0',
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query` (`query`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_query_created` (`query`,`created_at` DESC),
  KEY `idx_category_created` (`category_filter`,`created_at` DESC),
  KEY `idx_user_created` (`user_id`,`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archive_search_analytics`
--

LOCK TABLES `archive_search_analytics` WRITE;
/*!40000 ALTER TABLE `archive_search_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `archive_search_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archive_security_logs`
--

DROP TABLE IF EXISTS `archive_security_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archive_security_logs` (
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
  KEY `idx_created` (`created_at`),
  KEY `idx_security_event_time` (`event_type`,`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archive_security_logs`
--

LOCK TABLES `archive_security_logs` WRITE;
/*!40000 ALTER TABLE `archive_security_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `archive_security_logs` ENABLE KEYS */;
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
  `label` varchar(255) DEFAULT NULL,
  `position` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `attribute_id` (`attribute_id`),
  CONSTRAINT `attribute_values_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE
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
INSERT INTO `banners` VALUES (1,'TOAN Store Air Max Collection','Khám phá bộ sưu tập Air Max mới nhất với công nghệ đệm khí tiên tiến','https://static.nike.com/a/images/f_auto/dpr_2.0,cs_srgb/w_1311,c_limit/755c0c97-6a45-4de9-b5f7-9c98a5e8c07e/nike-just-do-it.jpg',NULL,'/shoes','Mua Ngay','homepage',1,'2025-12-09 06:03:21','2027-03-13 01:56:01',1,0,385,'2025-12-09 06:03:21','2026-03-17 15:18:21'),(2,'Giảm giá đến 50%','Flash Sale cuối năm - Ưu đãi cực lớn cho các sản phẩm chọn lọc','https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/23d36c28-01e7-484d-a5d0-cf36209ccdfb/nike-just-do-it.jpg',NULL,'/categories','Xem Ngay','homepage',2,'2025-12-09 06:03:21','2027-03-13 01:56:01',1,0,162,'2025-12-09 06:03:21','2026-03-17 15:18:21'),(3,'TOAN Store Pro Training','Trang bị cho tập luyện với dòng sản phẩm TOAN Store Pro','https://static.nike.com/a/images/f_auto/dpr_1.0,cs_srgb/w_1423,c_limit/fb3a98c1-d98e-44b0-96d4-9c9fe5a1f4e0/nike-just-do-it.jpg',NULL,'/clothing','Khám Phá','homepage',3,'2025-12-09 06:03:21','2027-03-13 01:56:01',1,9,846,'2025-12-09 06:03:21','2026-03-17 15:18:21'),(4,'TOAN','','https://static.nike.com/a/images/f_auto/dpr_2.0,cs_srgb/w_1311,c_limit/6c9868f0-1e5b-4686-8106-a4ed847a9acc/nike-just-do-it.jpg','','http://localhost:3000/toan','','homepage',1,NULL,'2027-03-13 01:56:01',1,0,719,'2026-01-30 02:00:14','2026-03-17 15:18:21');
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
-- Table structure for table `bulk_discounts`
--

DROP TABLE IF EXISTS `bulk_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_discounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_percentage` int NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bulk_active` (`is_active`),
  KEY `idx_bulk_time` (`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_discounts`
--

LOCK TABLES `bulk_discounts` WRITE;
/*!40000 ALTER TABLE `bulk_discounts` DISABLE KEYS */;
INSERT INTO `bulk_discounts` VALUES (1,'Test Summer Sale',20,NULL,'2026-03-16 00:29:01','2026-03-23 00:29:01',1,'2026-03-16 00:29:01','2026-03-16 00:29:01');
/*!40000 ALTER TABLE `bulk_discounts` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
INSERT INTO `categories` VALUES (1,NULL,'Running','running','Running shoes and apparel',NULL,1,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL),(2,NULL,'Basketball','basketball','Basketball shoes and gear',NULL,2,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL),(3,NULL,'Training','training','Training and gym equipment',NULL,3,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL),(4,NULL,'Lifestyle','lifestyle','Casual and lifestyle products',NULL,4,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL),(5,NULL,'Jordan','jordan','Air Jordan collection',NULL,5,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL),(6,NULL,'Football','football','Football boots and equipment',NULL,6,1,NULL,NULL,'2025-12-06 14:11:35','2026-03-18 02:19:03',NULL);
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
INSERT INTO `contact_messages` VALUES (5,'DANG THANH TOAN','thanhtoan06092004@gmail.com','order','thanhtoan06092004','replied',NULL,NULL,'2025-12-07 02:18:08','2026-02-03 05:39:11'),(6,'DANG THANH TOAN','admin@gmail.com','product','okokokokok','replied',NULL,NULL,'2025-12-07 02:53:46','2026-02-01 12:46:59');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cookie_consents`
--

DROP TABLE IF EXISTS `cookie_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cookie_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferences` json NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cookie_consents`
--

LOCK TABLES `cookie_consents` WRITE;
/*!40000 ALTER TABLE `cookie_consents` DISABLE KEYS */;
/*!40000 ALTER TABLE `cookie_consents` ENABLE KEYS */;
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
  `user_id` bigint unsigned DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_coupon` (`user_id`,`coupon_id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `coupon_usage_ibfk_1` (`coupon_id`),
  CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_coupon_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usage`
--

LOCK TABLES `coupon_usage` WRITE;
/*!40000 ALTER TABLE `coupon_usage` DISABLE KEYS */;
INSERT INTO `coupon_usage` VALUES (2,12,1,11,'2026-01-30 12:10:01'),(3,10,1,12,'2026-01-30 12:29:22'),(4,9,1,13,'2026-01-30 12:40:00');
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
  `code` varchar(100) NOT NULL COMMENT 'Publicly shareable discount code. Applied at checkout for all eligible users.',
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
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_code_dates` (`code`,`starts_at`,`ends_at`),
  KEY `idx_coupons_active` (`deleted_at`,`ends_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'WELCOME10','Giảm 10% cho đơn hàng đầu tiên','percent',10.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-01-05 14:11:35',1000,NULL,'2025-12-06 14:11:35','2026-03-09 04:50:32','2026-03-09 04:50:32'),(2,'SALE50K','Giảm 50,000đ cho đơn hàng từ 500,000đ','fixed',50000.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2025-12-13 14:11:35',500,NULL,'2025-12-06 14:11:35','2026-03-09 04:50:32','2026-03-09 04:50:32'),(3,'VIP20','Giảm 20% cho thành viên VIP','percent',20.00,'bronze',NULL,NULL,NULL,'2025-12-06 14:11:35','2026-03-06 14:11:35',NULL,NULL,'2025-12-06 14:11:35','2026-03-09 04:50:32','2026-03-09 04:50:32'),(4,'NEWYEAR2025','Giảm 15% chào năm mới 2025','percent',15.00,'bronze',NULL,NULL,NULL,'2025-12-07 03:52:09','2026-01-06 03:52:09',2000,NULL,'2025-12-06 14:11:35','2026-03-09 04:50:32','2026-03-09 04:50:32'),(9,'NIKE2024','Giảm 10% cho đơn hàng từ 2 triệu','percent',10.00,'bronze',2000000.00,NULL,500000.00,'2025-12-31 17:00:00','2026-12-31 03:00:00',100,1,'2025-12-09 06:01:59',NULL,'2026-03-08 06:54:04'),(10,'WELCOME50','Giảm 50K cho khách hàng mới','fixed',50000.00,'bronze',500000.00,NULL,NULL,'2025-12-09 06:01:59','2026-02-07 06:01:59',500,1,'2025-12-09 06:01:59','2026-03-09 04:50:32','2026-03-09 04:50:32'),(11,'FREESHIP','Miễn phí vận chuyển','fixed',30000.00,'bronze',1000000.00,NULL,30000.00,'2025-12-09 06:01:59','2026-03-09 06:01:59',NULL,NULL,'2025-12-09 06:01:59',NULL,'2026-03-08 06:54:04'),(12,'TOAN','Giảm 10% cho đơn hàng từ 1 triệu','percent',10.00,'bronze',1000000.00,NULL,100000.00,'2026-01-01 04:11:00','2026-12-30 17:00:00',10,1,'2026-01-25 03:41:00',NULL,'2026-03-08 06:54:04');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_metrics`
--

DROP TABLE IF EXISTS `daily_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_metrics` (
  `date` date NOT NULL,
  `revenue` decimal(15,2) DEFAULT '0.00',
  `orders_count` int DEFAULT '0',
  `customers_count` int DEFAULT '0',
  `cancelled_count` int DEFAULT '0',
  `total_cost` decimal(15,2) DEFAULT '0.00',
  `net_profit` decimal(15,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_metrics`
--

LOCK TABLES `daily_metrics` WRITE;
/*!40000 ALTER TABLE `daily_metrics` DISABLE KEYS */;
INSERT INTO `daily_metrics` VALUES ('2025-12-06',2929000.00,1,0,0,2050300.00,878700.00,'2026-03-08 14:18:11'),('2025-12-07',36788240.00,3,1,3,20503000.00,16285240.00,'2026-03-08 14:21:25'),('2026-01-31',13309700.00,4,1,0,0.00,13309700.00,'2026-03-07 19:55:18'),('2026-02-05',2970450.00,1,1,0,0.00,2970450.00,'2026-03-07 19:55:18'),('2026-02-14',4170260.00,1,1,0,0.00,4170260.00,'2026-03-07 19:55:18'),('2026-02-16',4500000.00,1,0,0,0.00,4500000.00,'2026-03-07 19:55:18'),('2026-03-08',0.00,0,0,0,0.00,0.00,'2026-03-08 13:34:36'),('2026-03-12',0.00,0,0,1,0.00,0.00,'2026-03-12 02:53:17'),('2026-03-17',0.00,0,0,1,0.00,0.00,'2026-03-18 02:12:42');
/*!40000 ALTER TABLE `daily_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_requests`
--

DROP TABLE IF EXISTS `data_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `request_type` enum('export','delete') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','completed','failed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `data_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_requests`
--

LOCK TABLES `data_requests` WRITE;
/*!40000 ALTER TABLE `data_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_requests` ENABLE KEYS */;
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
INSERT INTO `faqs` VALUES (1,1,'Làm thế nào để đặt hàng ?','Bạn có thể đặt hàng trực tuyến qua website của chúng tôi.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:47:35'),(2,1,'Tôi có thể hủy đơn hàng không ?','Bạn có thể hủy đơn hàng trong vòng 24 giờ sau khi đặt.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:04'),(3,2,'Thời gian giao hàng là bao lâu ?','Thời gian giao hàng tiêu chuẩn là 2–5 ngày làm việc.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:30'),(4,2,'Chi phí vận chuyển là bao nhiêu ?','Phí vận chuyển là 30.000đ cho đơn hàng dưới mức quy định.',2,1,0,'2025-12-06 14:11:35','2026-01-06 08:48:45'),(5,3,'Có những phương thức thanh toán nào ?','Chúng tôi hỗ trợ: Thanh toán khi nhận hàng, chuyển khoản ngân hàng, ví điện tử.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:16'),(6,4,'Chính sách đổi trả như thế nào ?','Sản phẩm được đổi trả trong vòng 30 ngày nếu còn nguyên tem mác.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:49:40'),(7,5,'Làm sao để kiểm tra sản phẩm chính hãng ?','Tất cả sản phẩm tại TOAN đều là chính hãng, có đầy đủ tem và bảo hành.',1,1,0,'2025-12-06 14:11:35','2026-01-06 08:50:12');
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
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_flash_product` (`flash_sale_id`,`product_id`),
  KEY `flash_sale_id` (`flash_sale_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_sale_product` (`flash_sale_id`,`product_id`),
  KEY `idx_flash_items_deleted` (`deleted_at`),
  CONSTRAINT `flash_sale_items_ibfk_1` FOREIGN KEY (`flash_sale_id`) REFERENCES `flash_sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `flash_sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_flash_sold_not_exceed` CHECK (((`quantity_sold` <= `quantity_limit`) or (`quantity_limit` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flash_sale_items`
--

LOCK TABLES `flash_sale_items` WRITE;
/*!40000 ALTER TABLE `flash_sale_items` DISABLE KEYS */;
INSERT INTO `flash_sale_items` VALUES (1,1,1,48.00,1999000.00,50,12,1,'2026-02-12 11:36:04',NULL),(2,1,2,49.00,1499000.00,100,45,1,'2026-02-12 11:36:04',NULL),(3,1,3,31.00,2419000.00,30,8,1,'2026-02-12 11:36:04',NULL),(4,1,4,52.00,1829000.00,20,15,1,'2026-02-12 11:36:04',NULL),(5,1,5,36.00,3589000.00,10,2,1,'2026-02-12 11:36:04',NULL),(6,2,7,50.00,2927500.00,10,0,1,'2026-02-12 12:21:16',NULL);
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
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_active_dates` (`is_active`,`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flash_sales`
--

LOCK TABLES `flash_sales` WRITE;
/*!40000 ALTER TABLE `flash_sales` DISABLE KEYS */;
INSERT INTO `flash_sales` VALUES (1,'SIÊU SALE CUỐI TUẦN','Giảm giá cực sốc lên đến 50% cho các sản phẩm TOAN Store hot nhất hiện nay!','2026-02-12 10:36:03','2026-02-13 10:36:03',0,'2026-02-12 11:36:03','2026-02-12 12:23:46',NULL),(2,'toan','toan là toi','2026-02-12 06:00:00','2026-02-19 06:00:00',0,'2026-02-12 12:18:38','2026-03-09 04:50:32',NULL);
/*!40000 ALTER TABLE `flash_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_card_lockouts`
--

DROP TABLE IF EXISTS `gift_card_lockouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_card_lockouts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `card_number` varchar(16) DEFAULT NULL,
  `attempt_count` int DEFAULT '1',
  `last_attempt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lockout_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_last_attempt` (`ip_address`,`last_attempt`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_card_lockouts`
--

LOCK TABLES `gift_card_lockouts` WRITE;
/*!40000 ALTER TABLE `gift_card_lockouts` DISABLE KEYS */;
INSERT INTO `gift_card_lockouts` VALUES (1,'127.0.0.1',NULL,2,'2026-03-13 07:01:59',NULL,'2026-03-13 14:01:13');
/*!40000 ALTER TABLE `gift_card_lockouts` ENABLE KEYS */;
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
  `card_number_hash` varchar(64) NOT NULL,
  `card_number_last4` char(4) NOT NULL,
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
  UNIQUE KEY `uk_card_number_hash` (`card_number_hash`),
  KEY `purchased_by` (`purchased_by`),
  KEY `idx_gift_cards_status` (`status`),
  CONSTRAINT `gift_cards_ibfk_1` FOREIGN KEY (`purchased_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_cards`
--

LOCK TABLES `gift_cards` WRITE;
/*!40000 ALTER TABLE `gift_cards` DISABLE KEYS */;
INSERT INTO `gift_cards` VALUES (2,'0ffc6ee5675f9b75b238768af6752f70372dc2c8719c9a6e3d8ff21a3183b478','4567','$2b$10$jKLc3TIFYZzp6wMGgI1NPud/Jl/Gv.rScynI7G3iIn/MtrpMdGtsS',1000000.00,1000000.00,'VND','active',0,1,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2026-03-08 16:23:24'),(3,'ed59c712b738f408a826dd1ad2c9b8a2353efd882ae7b973f0315c0ba5faa661','5678','$2b$10$pgI/Qxf/ZT2BgQLhMooXrOliZoOcfEjtPprrLfo5kCY/BORlg.XF2',2000000.00,2000000.00,'VND','active',0,1,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2026-03-08 16:23:24'),(4,'40b70c58bd6487e565946e75b890351dfb4cfd8307660912e8d06c97a7ef3bc7','6789','$2b$10$Ae5WPDcu93PDobkvnn5EuuLpvkw5p03uCqmOLap.cb/GbbSSXxMni',500000.00,300000.00,'VND','active',0,1,NULL,'2026-12-06 14:11:35','2025-12-06 14:11:35','2026-03-08 16:23:24'),(9,'7a51d064a1a216a692f753fcdab276e4ff201a01d8b66f56d50d4d719fd0dc87','3456','$2b$10$Ntzc8iKZ1n3mftvuZJy89Ou53.VQFelU7DsDQNINcrfZuAAJP6Bt2',500000.00,500000.00,'VND','active',0,1,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2026-03-08 16:23:24'),(10,'d958ce38a6d281743f29567cccb0e359fc59a48155cb2754cd4025178fc866f7','7654','$2b$10$z19dTdgRvoBrjrvqAUMe0ekPMJ9sSCf86t8Al1HkzyVqvXqjdPXd2',1000000.00,1000000.00,'VND','active',0,1,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2026-03-08 16:23:24'),(11,'c6b25ffac5d2c50f41af3ac4d97d07d95fd4f2d5f9fcef98dc709e5741060508','4444','$2b$10$WSg34bQT3S0D8TAOEsHvU.iurGW/0VdqUkN0kv/pW54/U/eq1W0l6',250000.00,250000.00,'VND','active',0,1,NULL,'2026-12-07 02:25:17','2025-12-07 02:25:17','2026-03-08 16:23:24'),(12,'2ef49739ca90a5d43977aaed126641af6c4cac3751aec17e7659435e74920469','2131','$2b$10$1WQTM.6Oj87TlombdxWJi.cvF1EbqnYl18nvVerfZPTWpa5PX4/hS',1000000.00,1000000.00,'VND','active',0,1,NULL,'2026-12-31 17:00:00','2026-01-29 14:57:02','2026-03-08 16:23:24'),(13,'e84b13afb5cfae594fc82220524769f84cfff079e2f561426266d1b40863adb1','7788','$2b$10$tlieXhxOfjxnko2qPiVmpu30aBg5WNSFMJaxyKWWnxnSSllFIjpMa',1000000.00,0.00,'VND','used',0,1,NULL,'2027-01-01 03:00:00','2026-01-29 15:13:24','2026-03-08 16:23:24'),(14,'627ad44348dccd623a8fa4a9324c8350e2970b627269596c50b2476c98a45198','6969','$2b$10$RXx/A/yUbhSi6x3FSyA5FujcG7BgNXWQmFkcshyqes75MS7ygA046',100000.00,0.00,'VND','used',0,1,NULL,'2026-09-05 23:09:00','2026-02-14 02:04:53','2026-03-08 16:23:24'),(15,'e5c2b79da69915d0108c687d97457107cc43962f1d88f03052929121e2cd359c','9696','$2b$10$oNt715nLT0kZzKYwSCh7jeDMWCWBwBto/bm9aADbjhDALlHzKpouG',100000.00,100000.00,'VND','active',0,1,NULL,'2026-06-09 02:06:00','2026-02-14 06:16:29','2026-03-08 16:23:24');
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
  `warehouse_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `reserved` int NOT NULL DEFAULT '0' COMMENT 'Items in pending orders',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `low_stock_threshold` int DEFAULT '10',
  `allow_backorder` tinyint DEFAULT '0',
  `expected_restock_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_variant_warehouse` (`product_variant_id`,`warehouse_id`),
  KEY `idx_variant` (`product_variant_id`),
  KEY `idx_quantity` (`quantity`),
  KEY `idx_warehouse_quantity` (`warehouse_id`,`quantity`),
  KEY `idx_quantity_reserved` (`quantity`,`reserved`),
  CONSTRAINT `fk_inventory_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_inventory_backorder_logic` CHECK ((((`allow_backorder` = 0) and (`quantity` >= 0)) or (`allow_backorder` = 1))),
  CONSTRAINT `chk_inventory_quantity_non_negative` CHECK ((`quantity` >= 0)),
  CONSTRAINT `chk_inventory_reserved_non_negative` CHECK ((`reserved` >= 0)),
  CONSTRAINT `chk_inventory_reserved_not_exceed` CHECK ((`reserved` <= `quantity`))
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,1,49,0,'2026-02-13 07:03:50',10,0,NULL),(2,2,1,45,0,'2026-02-13 07:03:50',10,0,NULL),(3,3,1,59,0,'2026-03-02 03:03:17',10,0,NULL),(4,4,1,55,0,'2026-02-13 07:03:50',10,0,NULL),(5,5,1,22,0,'2026-03-02 03:03:17',10,0,NULL),(6,6,1,40,0,'2026-02-13 07:03:50',10,0,NULL),(7,7,1,29,0,'2026-02-14 02:47:45',10,0,NULL),(8,8,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(9,9,1,55,0,'2026-02-13 07:03:50',10,0,NULL),(10,10,1,50,0,'2026-02-13 07:03:50',10,0,NULL),(11,11,1,60,0,'2026-03-02 03:03:17',10,0,NULL),(12,12,1,60,0,'2026-02-13 07:03:50',10,0,NULL),(13,13,1,55,0,'2026-02-13 07:03:50',10,0,NULL),(14,14,1,45,0,'2026-02-13 07:03:50',10,0,NULL),(15,15,1,34,0,'2026-03-02 03:03:17',10,0,NULL),(16,16,1,15,0,'2026-03-02 03:03:17',10,0,NULL),(17,17,1,40,0,'2026-02-13 07:03:50',10,0,NULL),(18,18,1,35,0,'2026-02-13 07:03:50',10,0,NULL),(19,19,1,49,0,'2026-03-18 02:12:42',10,0,NULL),(20,20,1,45,0,'2026-02-13 07:03:50',10,0,NULL),(21,21,1,40,0,'2026-02-13 07:03:50',10,0,NULL),(22,22,1,30,0,'2026-02-13 07:03:50',10,0,NULL),(23,23,1,25,0,'2026-02-13 07:03:50',10,0,NULL),(24,24,1,15,0,'2026-02-13 07:03:50',10,0,NULL),(25,25,1,30,0,'2026-02-13 07:03:50',10,0,NULL),(26,26,1,24,0,'2026-03-02 03:03:17',10,0,NULL),(27,27,1,35,0,'2026-02-13 07:03:50',10,0,NULL),(28,28,1,30,0,'2026-02-13 07:03:50',10,0,NULL),(29,29,1,25,0,'2026-02-13 07:03:50',10,0,NULL),(30,30,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(31,31,1,15,0,'2026-02-13 07:03:50',10,0,NULL),(32,32,1,10,0,'2026-02-13 07:03:50',10,0,NULL),(33,33,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(34,34,1,18,0,'2026-02-13 07:03:50',10,0,NULL),(35,35,1,24,0,'2026-03-02 03:03:17',10,0,NULL),(36,36,1,22,0,'2026-02-13 07:03:50',10,0,NULL),(37,37,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(38,38,1,15,0,'2026-02-13 07:03:50',10,0,NULL),(39,39,1,10,0,'2026-02-13 07:03:50',10,0,NULL),(40,40,1,0,0,'2026-02-13 07:03:50',10,0,NULL),(41,41,1,35,0,'2026-02-13 07:03:50',10,0,NULL),(42,42,1,31,0,'2026-03-02 03:03:17',10,0,NULL),(43,43,1,40,0,'2026-02-13 07:03:50',10,0,NULL),(44,44,1,38,0,'2026-02-13 07:03:50',10,0,NULL),(45,45,1,35,0,'2026-02-13 07:03:50',10,0,NULL),(46,46,1,28,0,'2026-02-13 07:03:50',10,0,NULL),(47,47,1,22,0,'2026-02-13 07:03:50',10,0,NULL),(48,48,1,18,0,'2026-02-13 07:03:50',10,0,NULL),(49,64,1,15,0,'2026-02-13 07:03:50',10,0,NULL),(50,65,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(51,66,1,20,0,'2026-02-13 07:03:50',10,0,NULL),(52,67,1,30,0,'2026-02-13 07:03:50',10,0,NULL),(53,68,1,50,0,'2026-02-13 07:03:50',10,0,NULL),(64,41,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(65,42,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(66,43,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(67,44,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(68,45,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(69,46,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(70,47,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(71,48,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(72,9,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(73,10,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(74,11,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(75,12,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(76,13,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(77,14,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(78,15,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(79,16,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(80,17,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(81,18,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(82,19,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(83,20,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(84,21,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(85,22,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(86,23,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(87,24,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(88,1,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(89,2,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(90,3,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(91,4,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(92,5,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(93,6,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(94,7,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(95,8,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(96,25,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(97,26,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(98,27,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(99,28,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(100,29,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(101,30,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(102,31,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(103,32,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(104,33,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(105,34,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(106,35,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(107,36,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(108,37,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(109,38,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(110,39,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(111,40,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(112,64,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(113,65,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(114,66,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(115,67,2,0,0,'2026-03-08 14:17:00',10,0,NULL),(116,68,2,0,0,'2026-03-08 14:17:00',10,0,NULL);
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
  `admin_id` bigint unsigned DEFAULT NULL,
  `quantity_change` int NOT NULL COMMENT 'Positive for additions, negative for subtractions',
  `reason` varchar(255) DEFAULT NULL COMMENT 'e.g., "order_placed", "order_cancelled", "restock", "damaged"',
  `reference_id` varchar(100) DEFAULT NULL COMMENT 'order_id, purchase_order_id, etc.',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory` (`inventory_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_inventory_logs_time` (`inventory_id`,`created_at` DESC),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES (59,5,NULL,-1,'order_placed','TEST-EMAIL-1770946266829',NULL,'2026-02-13 01:31:06'),(60,7,NULL,-1,'order_reserved','NK1771037108210_9KMI',NULL,'2026-02-14 02:45:08'),(61,5,NULL,-1,'order_reserved','NK1771209986111_U8W9',NULL,'2026-02-16 02:46:26');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transfers`
--

DROP TABLE IF EXISTS `inventory_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `from_warehouse_id` bigint unsigned NOT NULL,
  `to_warehouse_id` bigint unsigned NOT NULL,
  `product_variant_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `status` enum('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
  `requested_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_transfers_requested_by` (`requested_by`),
  KEY `fk_transfers_approved_by` (`approved_by`),
  KEY `fk_transfers_from_warehouse` (`from_warehouse_id`),
  KEY `fk_transfers_to_warehouse` (`to_warehouse_id`),
  KEY `fk_transfers_variant` (`product_variant_id`),
  CONSTRAINT `fk_transfers_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfers_from_warehouse` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_transfers_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfers_to_warehouse` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `fk_transfers_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transfers`
--

LOCK TABLES `inventory_transfers` WRITE;
/*!40000 ALTER TABLE `inventory_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ip_blocklist`
--

DROP TABLE IF EXISTS `ip_blocklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ip_blocklist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_permanent` tinyint DEFAULT '0',
  `blocked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`),
  KEY `idx_blocked_until` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ip_blocklist`
--

LOCK TABLES `ip_blocklist` WRITE;
/*!40000 ALTER TABLE `ip_blocklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `ip_blocklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `folder` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_path` (`file_path`),
  KEY `idx_media_path` (`file_path`),
  KEY `idx_media_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
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
  `author_id` bigint unsigned DEFAULT '1',
  `published_at` timestamp NULL DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `views` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `author_id` (`author_id`),
  KEY `idx_news_published` (`is_published`),
  KEY `idx_news_published_at` (`published_at`),
  CONSTRAINT `fk_news_admin_author` FOREIGN KEY (`author_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES (3,'TOAN','toan','DANG THANH TOAN','TOAN','https://static.nike.com/a/images/q_auto:eco/t_product_v1/f_auto/dpr_1.5/h_381,c_limit/f9f098e2-5a18-4e52-990f-b9cc09357fbc/air-max-dn8-leather-shoes-bYfKK6Qb.png','Sản Phẩm',1,'2026-02-01 05:40:49',1,34,'2026-02-01 12:40:48','2026-03-08 06:16:38');
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_comment_likes`
--

DROP TABLE IF EXISTS `news_comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news_comment_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comment_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_user` (`comment_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `news_comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `news_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comment_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_comment_likes`
--

LOCK TABLES `news_comment_likes` WRITE;
/*!40000 ALTER TABLE `news_comment_likes` DISABLE KEYS */;
INSERT INTO `news_comment_likes` VALUES (2,2,1,'2026-03-01 04:48:59');
/*!40000 ALTER TABLE `news_comment_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_comments`
--

DROP TABLE IF EXISTS `news_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `news_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `comment` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'approved',
  `likes_count` int DEFAULT '0',
  `is_edited` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_news_id` (`news_id`),
  KEY `idx_status` (`status`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `fk_news_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `news_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comments_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE,
  CONSTRAINT `news_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_comments`
--

LOCK TABLES `news_comments` WRITE;
/*!40000 ALTER TABLE `news_comments` DISABLE KEYS */;
INSERT INTO `news_comments` VALUES (2,3,1,NULL,'ok','approved',1,0,'2026-03-01 04:48:55','2026-03-01 04:48:59'),(3,3,1,2,'ko','approved',0,0,'2026-03-01 04:49:04','2026-03-01 04:49:11');
/*!40000 ALTER TABLE `news_comments` ENABLE KEYS */;
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
  `email_hash` varchar(64) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` enum('active','unsubscribed','bounced') DEFAULT 'active',
  `user_id` bigint unsigned DEFAULT NULL,
  `subscribed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_news_email_hash` (`email_hash`),
  KEY `user_id` (`user_id`),
  KEY `idx_email` (`email`),
  CONSTRAINT `newsletter_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscriptions`
--

LOCK TABLES `newsletter_subscriptions` WRITE;
/*!40000 ALTER TABLE `newsletter_subscriptions` DISABLE KEYS */;
INSERT INTO `newsletter_subscriptions` VALUES (1,'***','b4133380ccd33e9fea010c5c961c1b766f4bf70ca30a4026a65c6854c8921fda','Nguyễn Văn A','active',NULL,'2025-12-06 14:11:35',NULL),(2,'***','bc8ff7bc9cbcf078d9e537b9b6098f8d50fe7142086c6aabf6841a7714679c30','Trần Thị B','active',NULL,'2025-12-06 14:11:35',NULL),(3,'***','4c7d03d328bed7e9babb9d5abb9216a1b14d5feeb82890816b090521072a5827','Lê Văn C','active',NULL,'2025-12-06 14:11:35',NULL),(4,'***','d2b50b25bd11b7bb89b77196400c2224b7207e8a7311bb815eee5f4fdc6e84bd','Phạm Thị D','active',NULL,'2025-12-06 14:11:35',NULL),(5,'***','9740b36c2f55f133c73a11133b19db466b2f632aca80d3aef2cb00022f018f15','Hoàng Văn E','active',NULL,'2025-12-06 14:11:35',NULL),(6,'***','0b80a8ac961669c92760e0680cd0b3a2d33218cb4bb0d912a7bda3ec487faa2f','Đặng Thanh Toàn','active',NULL,'2025-12-09 04:45:40',NULL),(7,'***','c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080',NULL,'active',NULL,'2026-01-29 14:05:14',NULL),(8,'***','d02b9739d727ca27f6971aa5d3d6c56fc78284387e9183661e176d2eaf95a9a5','Test','active',NULL,'2026-03-13 14:57:43',NULL);
/*!40000 ALTER TABLE `newsletter_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('order','social','promo','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `link_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_type_read` (`user_id`,`type`,`is_read`),
  KEY `idx_user_unread_created` (`user_id`,`is_read`,`created_at` DESC),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'promo','Bạn vừa nhận được voucher mới!','Chúc mừng! Bạn vừa nhận được mã giảm giá ABCD trị giá 10.000.000 ₫. Hãy sử dụng ngay!','/account/vouchers',0,NULL,'2026-03-01 14:53:56'),(2,1,'order','Đơn hàng đã hủy','Bạn đã hủy đơn hàng #NK1773283433854_8PK9.','/orders/NK1773283433854_8PK9',0,NULL,'2026-03-12 02:53:17'),(3,1,'order','Đơn hàng đã xác nhận','Đơn hàng #NK1773730257531_CTP8 của bạn đã được xác nhận và đang xử lý.',NULL,0,'/orders/NK1773730257531_CTP8','2026-03-18 02:08:26'),(4,1,'order','Đơn hàng đã hủy','Đơn hàng #NK1773730257531_CTP8 của bạn đã bị hủy.',NULL,0,'/orders/NK1773730257531_CTP8','2026-03-18 02:12:42');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `fk_order_items_variant` (`product_variant_id`),
  KEY `flash_sale_item_id` (`flash_sale_item_id`),
  KEY `idx_product_variant` (`product_id`,`product_variant_id`),
  KEY `idx_inventory_order` (`inventory_id`,`order_id`),
  CONSTRAINT `fk_order_items_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`flash_sale_item_id`) REFERENCES `flash_sale_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,3,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(2,4,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'45',10,2929000.00,2050300.00,29290000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(3,5,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(4,6,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(5,6,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'44',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(6,7,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(7,8,2,NULL,NULL,'Nike Air Force 1 \'07',NULL,'40',1,2929000.00,2050300.00,2929000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(8,9,1,NULL,NULL,'Nike Air Max 270',NULL,'40',1,3829000.00,2680300.00,3829000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(10,11,4,NULL,NULL,'Air Jordan 1 Mid',NULL,'39',1,3829000.00,2680300.00,3829000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(11,12,3,NULL,NULL,'Nike Pegasus 40',NULL,'40',1,3519000.00,2463300.00,3519000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(12,13,5,NULL,NULL,'Air Jordan 4 Retro',NULL,'40',1,5589000.00,3912300.00,5589000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(39,40,6,NULL,NULL,'Nike Dunk Low',NULL,'39',1,2829000.00,1980300.00,2829000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(50,53,1,7,7,'Nike Air Max 270','NK-AM270-BLK-44','44',1,4500000.00,3150000.00,4500000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(51,54,1,5,5,'Nike Air Max 270','NK-AM270-BLK-42','42',1,4500000.00,3150000.00,4500000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(52,55,3,19,19,'Nike Pegasus 40','NK-PEG40-40','40',4,3519000.00,0.00,14076000.00,NULL,'2026-03-17 06:47:06','2026-03-17 06:47:06',NULL),(53,57,3,19,19,'Nike Pegasus 40','NK-PEG40-40','40',1,3519000.00,0.00,3519000.00,NULL,'2026-03-17 06:50:57','2026-03-17 06:50:57',NULL);
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
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) DEFAULT '0.00',
  `discount` decimal(12,2) DEFAULT '0.00',
  `promotion_code` varchar(50) DEFAULT NULL,
  `promotion_type` enum('voucher','coupon','none') DEFAULT 'none',
  `coupon_id` bigint unsigned DEFAULT NULL,
  `voucher_id` bigint unsigned DEFAULT NULL,
  `voucher_discount` decimal(12,2) DEFAULT '0.00',
  `giftcard_discount` decimal(12,2) DEFAULT '0.00',
  `giftcard_id` bigint unsigned DEFAULT NULL COMMENT 'FK to gift_cards.id. Replaces plaintext giftcard_number.',
  `membership_discount` decimal(12,2) DEFAULT '0.00',
  `tax` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'VND',
  `shipping_address_snapshot` json DEFAULT NULL,
  `status` enum('pending','pending_payment_confirmation','payment_received','confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `placed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_method` varchar(50) DEFAULT 'cod',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `tracking_number` varchar(100) DEFAULT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp khi đơn hàng bị hủy (status → cancelled)',
  `notes` text,
  `has_gift_wrapping` tinyint(1) DEFAULT '0',
  `gift_wrap_cost` decimal(12,2) DEFAULT '0.00',
  `survey_sent` tinyint(1) DEFAULT '0',
  `is_encrypted` tinyint(1) DEFAULT '0',
  `phone` varchar(20) DEFAULT '***',
  `email` varchar(255) DEFAULT '***',
  `email_hash` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `idx_is_encrypted` (`is_encrypted`),
  KEY `idx_user_status_placed` (`user_id`,`status`,`placed_at` DESC),
  KEY `idx_status_placed` (`status`,`placed_at` DESC),
  KEY `idx_tracking_carrier` (`tracking_number`,`carrier`),
  KEY `idx_orders_voucher_code` (`promotion_code`),
  KEY `idx_orders_payment_method` (`payment_method`),
  KEY `fk_orders_giftcard_id` (`giftcard_id`),
  KEY `idx_orders_placed_at` (`placed_at`),
  KEY `idx_orders_cancelled_at` (`cancelled_at`),
  KEY `idx_orders_coupon_id` (`coupon_id`),
  KEY `idx_orders_voucher_id` (`voucher_id`),
  KEY `idx_order_email_hash` (`email_hash`),
  CONSTRAINT `fk_orders_coupon_id` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_giftcard_id` FOREIGN KEY (`giftcard_id`) REFERENCES `gift_cards` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_voucher_id` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (3,'NK1765037039892',1,2929000.00,0.00,160.00,NULL,'none',NULL,NULL,100.00,50.00,NULL,10.00,0.00,2928840.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2025-12-06 16:03:59','2026-03-09 04:50:31','cod','paid',NULL,NULL,NULL,NULL,NULL,'2026-03-02 03:12:16',NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(4,'NK1765087390746',1,29290000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,0.00,29290000.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2025-12-07 06:03:10','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,'2026-03-02 03:12:16',NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(5,'NK1765088272959',1,2929000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,0.00,2929000.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2025-12-07 06:17:52','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(6,'NK1765089059778',1,5858000.00,0.00,1288760.00,NULL,'none',NULL,NULL,1288760.00,0.00,NULL,0.00,0.00,4569240.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2025-12-07 06:30:59','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(7,'NK1765093418497',1,2929000.00,0.00,1644380.00,NULL,'none',NULL,NULL,644380.00,1000000.00,2,0.00,0.00,1284620.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','cancelled','2025-12-07 07:43:38','2026-03-08 14:17:00','cod','pending',NULL,NULL,NULL,NULL,NULL,'2026-03-08 01:42:56',NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(8,'NK1767443489937',1,2929000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,0.00,2929000.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','cancelled','2026-01-03 12:31:29','2026-03-08 14:17:00','cod','pending',NULL,NULL,NULL,NULL,NULL,'2026-03-02 03:12:16',NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(9,'NK1769773670916',1,3829000.00,0.00,1100000.00,'TOAN','voucher',NULL,4,100000.00,1000000.00,13,0.00,0.00,2729000.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2026-01-30 11:47:50','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(11,'NK1769775001613',1,3829000.00,0.00,1100000.00,'TOAN','voucher',NULL,4,100000.00,1000000.00,13,0.00,382900.00,3111900.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2026-01-30 12:10:01','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(12,'NK1769776162375',1,3519000.00,0.00,1050000.00,NULL,'none',NULL,NULL,50000.00,1000000.00,13,0.00,351900.00,2820900.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2026-01-30 12:29:22','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(13,'NK1769776799944',1,5589000.00,0.00,1500000.00,NULL,'none',NULL,NULL,500000.00,1000000.00,13,0.00,558900.00,4647900.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN (Historical)\", \"ward\": \"700000\", \"phone\": \"***HIDDEN***\", \"address\": \"Hẻm 123, Đường ABC\", \"district\": \"Quận 1\", \"address_line\": \"123 ABC Street, District 1\"}','delivered','2026-01-30 12:39:59','2026-03-09 02:09:58','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(40,'NK1770253823973',1,2829000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,282900.00,2970450.00,'VND',NULL,'delivered','2026-02-05 01:10:24','2026-03-09 04:50:32','cod','paid',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(53,'NK1771037108210_9KMI',1,4500000.00,0.00,521190.00,'TOAN','voucher',NULL,4,421190.00,100000.00,14,0.00,382900.00,4170260.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN\", \"ward\": \"700000\", \"phone\": \"a9f98b18f57a56cff37ff166045ab792:3260be462131d60fcc4fc42184870499:2b2814eb7641c9609553\", \"address\": \"14bd1d5f0f4d5dbba320b85df0fb65e9:021af053ee4f588e6678041b64a974ba:ffe5c4ff9aee66cbb36e8d3a8dfa418cc3d454527f72c819ec7e25\", \"district\": \"Hóc Môn\", \"address_line\": \"fb2f9369ad06e444b3f4f866437de1be:43087caca0661b0a2343817bfe7923f9:3533329219da69f84a412878fd19cba13d3bc611c67719dc4da43b\"}','delivered','2026-02-14 02:45:08','2026-03-09 04:50:32','cod','paid',NULL,NULL,'2026-02-14 02:48:10','2026-02-14 02:48:48','2026-02-14 02:47:45',NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(54,'NK1771209986111_U8W9',NULL,4500000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,0.00,4500000.00,'VND','{\"city\": \"\", \"name\": \"0123456789\", \"ward\": \"\", \"phone\": \"22fc1204e89a0fc1d14cc58ea56b11e0:27fe7aa54961f8e99eb43c0b4cbd9698:34a793e9576885bd8ddb\", \"address\": \"265f1e9b643633abde8cd1dd44560dbc:c2936b87b392dd2f66121361fcfbaae3:ed3291a92143e095f4ad10bce50e723e30d00ff32e12f5cc11512df9ff7441919fb04f2195b85babe24d3ba7ca58406bc15ff6859e\", \"district\": \"\", \"address_line\": \"569f70f943d2aa5b5280d6b534ede8ae:a592dd0c7c568c69b5fb6f5cc4e32735:0f2e2c6941d70e6cfb2a04ad6b61967f30880f79feaa50b178e9810a3075f6e79aec1f47c0a671558e52cdb427d0c619a7ebf4b8b8\"}','pending','2026-02-16 02:46:26','2026-02-28 00:06:02','cod','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0.00,0,1,'***','***',NULL,'2026-03-13 02:09:48'),(55,'NK1773283433854_8PK9',1,14076000.00,0.00,0.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,0.00,0.00,14779800.00,'VND','{\"city\": \"TP. Hồ Chí Minh\", \"name\": \"DANG THANH TOAN\", \"ward\": \"700000\", \"phone\": \"8324dc41914b6d69174184cc4adf9c06:81f69fa8fb19d26b60b4c7d86f770921:1a66e9882f7454bf7f37\", \"address\": \"8e64812b575b797b15929661d20eb318:5e7e9ac68f3fcb03fe8ee9b8b221475d:f5747f7430\", \"district\": \"Hóc Môn\"}','cancelled','2026-03-12 02:43:53','2026-03-12 02:56:08','cod','pending',NULL,NULL,NULL,NULL,NULL,'2026-03-12 02:53:17',NULL,0,0.00,0,1,'***','***','','2026-03-13 02:09:48'),(57,'NK1773730257531_CTP8',1,3519000.00,0.00,175950.00,NULL,'none',NULL,NULL,0.00,0.00,NULL,175950.00,351900.00,3694950.00,'VND','\"{\\\"name\\\":\\\"DANG THANH TOAN\\\",\\\"phone\\\":\\\"f73a682dbd2f25d9cd48fae251df679d:fbb14318c0b0c2ee386168fbec6acf0d:fe688d7bb0bdb6e07755\\\",\\\"address\\\":\\\"9f62ffb2d6d5927cb054f077f5022a68:94eb25cebb9e9bbbcd711520f6dea791:5d6c29a0bc\\\",\\\"city\\\":\\\"TP. Hồ Chí Minh\\\",\\\"district\\\":\\\"Hóc Môn\\\",\\\"ward\\\":\\\"700000\\\",\\\"email\\\":\\\"30fe198df865b6b72f1be7214cd159bb:3c33a94dfcec1fb84326303658415755:622079a9c547fbf7e8b3e0f269b26b00310d78c1e1310033eac03a\\\"}\"','cancelled','2026-03-16 23:50:58','2026-03-18 02:12:42','cod','pending',NULL,NULL,NULL,NULL,'2026-03-18 02:08:26','2026-03-17 19:12:42',NULL,0,0.00,0,1,'***','***','c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080','2026-03-17 06:50:57');
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
INSERT INTO `pages` VALUES (1,'Về TOAN','about','TOAN là đại lý chính thức của Nike tại Việt Nam, mang đến cho khách hàng những sản phẩm chính hãng với chất lượng tốt nhất. Chúng tôi cam kết cung cấp trải nghiệm mua sắm tuyệt vời với dịch vụ khách hàng chuyên nghiệp.','default','Về TOAN Nike Store','Tìm hiểu về TOAN - đại lý chính thức Nike tại Việt Nam','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),(2,'Chính sách bảo mật','privacy-policy','Chúng tôi cam kết bảo vệ thông tin cá nhân của khách hàng...','legal','Chính sách bảo mật','Chính sách bảo mật thông tin khách hàng','published',1,'2025-12-06 14:11:35','2025-12-07 05:16:24'),(3,'Điều khoản sử dụng','terms-of-use','Điều khoản và điều kiện sử dụng website','legal','Điều khoản sử dụng','Điều khoản và điều kiện sử dụng','published',1,'2025-12-06 14:11:35','2026-01-06 08:55:30'),(4,'Hướng dẫn mua hàng','guides','Hướng dẫn chi tiết cách đặt hàng và thanh toán','guide','Hướng dẫn mua hàng','Hướng dẫn mua hàng tại TOAN Nike Store','published',1,'2025-12-06 14:11:35','2026-01-06 08:56:13');
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
  `email_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_reset_email_hash` (`email_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (5,'***','c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080','b5e29c103199c1da2e2f58f68afe1de83661c3d2a6d91e483d9a7ded1596dacd','2026-03-10 16:18:41',0,'2026-03-10 15:18:41'),(6,'***','c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080','7e94c4280c7b4ff759a7a04d9ff1322cad310dc575f7015e4156720eda7a498a','2026-03-10 23:26:43',1,'2026-03-10 15:20:57');
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
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `points` int NOT NULL,
  `type` enum('earn','redeem','expire','refund','adjust') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `balance_after` int NOT NULL DEFAULT '0',
  `source` varchar(50) DEFAULT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pt_user` (`user_id`),
  KEY `idx_pt_type` (`type`),
  KEY `idx_pt_expires` (`expires_at`),
  KEY `idx_pt_user_time` (`user_id`,`created_at` DESC),
  CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_transactions`
--

LOCK TABLES `point_transactions` WRITE;
/*!40000 ALTER TABLE `point_transactions` DISABLE KEYS */;
INSERT INTO `point_transactions` VALUES (1,1,-50,'redeem','Đổi voucher: REDEEM50K','2026-03-06 02:19:07',2397,NULL,NULL,NULL);
/*!40000 ALTER TABLE `point_transactions` ENABLE KEYS */;
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
  `value_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `option_id` (`value_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_attribute` (`attribute_id`),
  CONSTRAINT `product_attribute_values_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attribute_values_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_attribute_values_ibfk_3` FOREIGN KEY (`value_id`) REFERENCES `attribute_values` (`id`) ON DELETE SET NULL
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_colors`
--

LOCK TABLES `product_colors` WRITE;
/*!40000 ALTER TABLE `product_colors` DISABLE KEYS */;
INSERT INTO `product_colors` VALUES (1,1,'Black','#000000',NULL,0),(2,1,'White','#FFFFFF',NULL,0),(3,2,'White','#FFFFFF',NULL,0),(4,2,'Triple White','#FFFFFF',NULL,0),(5,4,'Bred','#000000',NULL,0),(6,6,'Panda','#000000',NULL,0),(7,3,'Grey','#808080',NULL,0),(8,5,'White','#FFFFFF',NULL,0),(9,7,'Volt/Black','#CEFF00',NULL,0);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  KEY `idx_product_images_main` (`product_id`,`is_main`),
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
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  KEY `idx_rating` (`rating`),
  KEY `product_reviews_ibfk_1` (`user_id`),
  KEY `idx_product_approved_created` (`product_id`,`status`,`created_at` DESC),
  KEY `idx_product_rating` (`product_id`,`rating` DESC),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_reviews_deleted` (`deleted_at`),
  KEY `idx_reviews_product_deleted` (`product_id`,`deleted_at`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (2,2,2,1,'OK','xấu','approved',0,4,0,'2026-01-27 07:36:19','2026-03-05 03:10:10','ok',NULL),(3,1,2,5,'hàng ok','ok','approved',1,1,0,'2026-03-01 11:49:23','2026-03-05 03:13:03',NULL,NULL),(4,1,6,5,'ok','okkkkkkk','approved',1,1,0,'2026-03-05 03:21:29','2026-03-05 03:25:05',NULL,NULL);
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
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
  `color_id` bigint unsigned DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `attributes` json DEFAULT NULL COMMENT 'e.g., {"size": "42", "color": "Red", "width": "Standard"}',
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(10,3) DEFAULT '0.000',
  `height` decimal(10,3) DEFAULT '0.000',
  `width` decimal(10,3) DEFAULT '0.000',
  `depth` decimal(10,3) DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_size` (`size`),
  KEY `idx_product_size` (`product_id`,`size`),
  KEY `idx_price` (`price`),
  KEY `product_variants_ibfk_2` (`color_id`),
  KEY `idx_product_color` (`product_id`,`color_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_variants_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `product_colors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_variant_price_non_negative` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'NK-AM270-BLK-38','38',1,NULL,'{\"size\": \"38\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 04:50:30'),(2,1,'NK-AM270-BLK-39','39',1,NULL,'{\"size\": \"39\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(3,1,'NK-AM270-BLK-40','40',1,NULL,'{\"size\": \"40\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(4,1,'NK-AM270-BLK-41','41',1,NULL,'{\"size\": \"41\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(5,1,'NK-AM270-BLK-42','42',1,NULL,'{\"size\": \"42\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(6,1,'NK-AM270-BLK-43','43',1,NULL,'{\"size\": \"43\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(7,1,'NK-AM270-BLK-44','44',1,NULL,'{\"size\": \"44\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(8,1,'NK-AM270-BLK-45','45',1,NULL,'{\"size\": \"45\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(9,2,'NK-AF1-WHT-38','38',3,NULL,'{\"size\": \"38\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(10,2,'NK-AF1-WHT-39','39',3,NULL,'{\"size\": \"39\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(11,2,'NK-AF1-WHT-40','40',3,NULL,'{\"size\": \"40\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(12,2,'NK-AF1-WHT-41','41',3,NULL,'{\"size\": \"41\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(13,2,'NK-AF1-WHT-42','42',3,NULL,'{\"size\": \"42\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(14,2,'NK-AF1-WHT-43','43',3,NULL,'{\"size\": \"43\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(15,2,'NK-AF1-WHT-44','44',3,NULL,'{\"size\": \"44\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(16,2,'NK-AF1-WHT-45','45',3,NULL,'{\"size\": \"45\"}',2929000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(17,3,'NK-PEG40-38','38',7,NULL,'{\"size\": \"38\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(18,3,'NK-PEG40-39','39',7,NULL,'{\"size\": \"39\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(19,3,'NK-PEG40-40','40',7,NULL,'{\"size\": \"40\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(20,3,'NK-PEG40-41','41',7,NULL,'{\"size\": \"41\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(21,3,'NK-PEG40-42','42',7,NULL,'{\"size\": \"42\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(22,3,'NK-PEG40-43','43',7,NULL,'{\"size\": \"43\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(23,3,'NK-PEG40-44','44',7,NULL,'{\"size\": \"44\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(24,3,'NK-PEG40-45','45',7,NULL,'{\"size\": \"45\"}',3519000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(25,4,'JD-J1MID-BRD-38','38',5,NULL,'{\"size\": \"38\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(26,4,'JD-J1MID-BRD-39','39',5,NULL,'{\"size\": \"39\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(27,4,'JD-J1MID-BRD-40','40',5,NULL,'{\"size\": \"40\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(28,4,'JD-J1MID-BRD-41','41',5,NULL,'{\"size\": \"41\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(29,4,'JD-J1MID-BRD-42','42',5,NULL,'{\"size\": \"42\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(30,4,'JD-J1MID-BRD-43','43',5,NULL,'{\"size\": \"43\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(31,4,'JD-J1MID-BRD-44','44',5,NULL,'{\"size\": \"44\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(32,4,'JD-J1MID-BRD-45','45',5,NULL,'{\"size\": \"45\"}',3829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(33,5,'JD-J4-WHT-38','38',8,NULL,'{\"size\": \"38\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(34,5,'JD-J4-WHT-39','39',8,NULL,'{\"size\": \"39\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(35,5,'JD-J4-WHT-40','40',8,NULL,'{\"size\": \"40\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(36,5,'JD-J4-WHT-41','41',8,NULL,'{\"size\": \"41\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(37,5,'JD-J4-WHT-42','42',8,NULL,'{\"size\": \"42\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(38,5,'JD-J4-WHT-43','43',8,NULL,'{\"size\": \"43\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(39,5,'JD-J4-WHT-44','44',8,NULL,'{\"size\": \"44\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(40,5,'JD-J4-WHT-45','45',8,NULL,'{\"size\": \"45\"}',5589000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(41,6,'NK-DUNK-PND-38','38',6,NULL,'{\"size\": \"38\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(42,6,'NK-DUNK-PND-39','39',6,NULL,'{\"size\": \"39\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(43,6,'NK-DUNK-PND-40','40',6,NULL,'{\"size\": \"40\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(44,6,'NK-DUNK-PND-41','41',6,NULL,'{\"size\": \"41\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(45,6,'NK-DUNK-PND-42','42',6,NULL,'{\"size\": \"42\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(46,6,'NK-DUNK-PND-43','43',6,NULL,'{\"size\": \"43\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(47,6,'NK-DUNK-PND-44','44',6,NULL,'{\"size\": \"44\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(48,6,'NK-DUNK-PND-45','45',6,NULL,'{\"size\": \"45\"}',2829000.00,0.000,0.000,0.000,0.000,'2025-12-06 14:11:35','2026-03-09 01:34:05'),(64,7,'NK-MERC-VAP-38','38',9,NULL,'{\"sole\": \"FG\", \"material\": \"Flyknit\", \"speed_type\": \"Vapor\"}',5855000.00,0.000,0.000,0.000,0.000,'2026-02-04 13:58:24','2026-03-09 01:34:05'),(65,7,'NK-MERC-VAP-39','39',9,NULL,'{\"sole\": \"FG\", \"material\": \"Flyknit\", \"speed_type\": \"Vapor\"}',5855000.00,0.000,0.000,0.000,0.000,'2026-02-04 13:59:36','2026-03-09 01:34:05'),(66,7,'NK-MERC-VAP-40','40',9,NULL,'{\"sole\": \"FG\", \"material\": \"Flyknit\", \"speed_type\": \"Vapor\"}',5855000.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:15','2026-03-09 01:34:05'),(67,7,'NK-MERC-VAP-41','41',9,NULL,'{\"sole\": \"FG\", \"material\": \"Flyknit\", \"speed_type\": \"Vapor\"}',5855000.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:32','2026-03-09 01:34:05'),(68,7,'NK-MERC-VAP-42','42',9,NULL,'{\"sole\": \"FG\", \"material\": \"Flyknit\", \"speed_type\": \"Vapor\"}',5855000.00,0.000,0.000,0.000,0.000,'2026-02-04 14:00:45','2026-03-09 01:34:05');
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
  `gender` enum('men','women','kids','unisex') DEFAULT 'unisex',
  `slug` varchar(512) NOT NULL,
  `short_description` text,
  `description` longtext,
  `brand_id` bigint unsigned DEFAULT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `collection_id` bigint unsigned DEFAULT NULL,
  `price_cache` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Denormalized: MIN(product_variants.price). Updated by app on variant change.',
  `msrp_price` decimal(12,2) DEFAULT NULL COMMENT 'Original retail price for display purposes only. Not used in checkout logic.',
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
  KEY `fk_product_sport` (`sport_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_category_active_created` (`category_id`,`is_active`,`created_at` DESC),
  KEY `idx_featured_active` (`is_featured`,`is_active`),
  KEY `idx_brand_active` (`brand_id`,`is_active`),
  KEY `idx_new_arrival_created` (`is_new_arrival`,`created_at` DESC),
  KEY `idx_products_category_active` (`category_id`,`is_active`,`deleted_at`),
  KEY `idx_products_sport_active` (`sport_id`,`is_active`,`deleted_at`),
  KEY `idx_products_created_at` (`created_at` DESC),
  KEY `idx_products_price` (`price_cache`),
  FULLTEXT KEY `idx_fts_product` (`name`,`sku`,`description`),
  FULLTEXT KEY `idx_products_search` (`name`,`sku`,`description`),
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
INSERT INTO `products` VALUES (1,'NK-AM270-BLK','Nike Air Max 270','unisex','nike-air-max-270-black','Comfortable all-day wear','The Nike Air Max 270 is inspired by two icons of big Air: the Air Max 180 and Air Max 93. It features Nike\'s biggest heel Air unit yet for a super-soft ride that feels as impossible as it looks.',1,4,1,3829000.00,4500000.00,0.00,1,0,1,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-03-09 04:50:30',NULL,NULL),(2,'NK-AF1-WHT','Nike Air Force 1 \'07','unisex','nike-air-force-1-07-white','Classic basketball style','The radiance lives on in the Nike Air Force 1 \'07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to make you shine.',1,4,2,2929000.00,3500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),(3,'NK-PEG40','Nike Pegasus 40','unisex','nike-pegasus-40','Running made responsive','A springy ride for every run, the Peg\'s familiar, just-for-you feel returns to help you accomplish your goals. This version has the same responsiveness and neutral support you love but with improved comfort in those sensitive areas of your foot, like the arch and toes.',1,1,4,3519000.00,4200000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-10 08:38:18',1,NULL),(4,'JD-J1MID-BRD','Air Jordan 1 Mid','unisex','air-jordan-1-mid-bred','Iconic basketball style','Inspired by the original AJ1, this mid-top edition maintains the iconic look you love while choice colours and crisp leather give it a distinct identity. With an encapsulated Air-Sole unit for cushioning and a Jumpman logo for heritage, this sneaker delivers on all counts.',2,2,NULL,3829000.00,4500000.00,0.00,1,0,1,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-03-13 01:56:01',NULL,NULL),(5,'JD-J4-WHT','Air Jordan 4 Retro','unisex','air-jordan-4-retro-white-cement','Legendary performance','The Air Jordan 4 Retro brings back the iconic design with premium materials and Air cushioning. Featuring visible Air units and unique mesh panels, this shoe delivers the legendary look with modern comfort.',2,2,NULL,5589000.00,6500000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2025-12-06 14:11:35',NULL,NULL),(6,'NK-DUNK-PND','Nike Dunk Low','unisex','nike-dunk-low-panda','Streetwear classic','Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colours. This basketball icon channels \'80s vibes with premium leather in the upper that looks good and breaks in even better.',1,4,3,2829000.00,3300000.00,0.00,1,0,0,0,0,NULL,NULL,'2025-12-06 14:11:35','2026-02-13 01:09:38',NULL,NULL),(7,'NK-MV16-ELT','Nike Mercurial Vapor 16 Elite','unisex','nike-mercurial-vapor-16-elite','','Obsessed with speed? So are the game\'s biggest stars. That\'s why we made this Elite boot with an improved 3/4-length Air Zoom unit. It gives you and the sport\'s fastest players the propulsive feel needed to break through the back line. The result is the most responsive Mercurial we\'ve ever made, because you demand greatness from yourself and your footwear.',1,6,NULL,5855000.00,7319000.00,0.00,1,0,1,0,0,NULL,NULL,'2026-02-04 11:02:44','2026-02-04 14:04:31',NULL,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
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
  `user_id` bigint unsigned DEFAULT NULL,
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
  CONSTRAINT `refund_requests_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `refund_requests_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
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
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refunds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `request_id` bigint unsigned DEFAULT NULL,
  `refund_amount` decimal(12,2) NOT NULL,
  `status` varchar(50) DEFAULT 'completed',
  `reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `refunds_ibfk_2` (`request_id`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `refund_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores media (images and videos) attached to product reviews';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_media`
--

LOCK TABLES `review_media` WRITE;
/*!40000 ALTER TABLE `review_media` DISABLE KEYS */;
INSERT INTO `review_media` VALUES (1,3,'image','/uploads/reviews/review_3_1772365771897_1bk65q.png',NULL,218648,'image/png',0,'2026-03-01 11:49:31'),(2,4,'image','/uploads/reviews/review_4_1772680921551_lrz3h.png',NULL,218648,'image/png',0,'2026-03-05 03:22:01');
/*!40000 ALTER TABLE `review_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(3,3),(3,4),(3,5),(3,6),(4,7);
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
-- Table structure for table `search_analytics`
--

DROP TABLE IF EXISTS `search_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_analytics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `query` varchar(255) NOT NULL,
  `category_filter` varchar(100) DEFAULT NULL,
  `results_count` int DEFAULT '0',
  `processing_time_ms` int DEFAULT '0',
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query` (`query`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_query_created` (`query`,`created_at` DESC),
  KEY `idx_category_created` (`category_filter`,`created_at` DESC),
  KEY `idx_user_created` (`user_id`,`created_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_analytics`
--

LOCK TABLES `search_analytics` WRITE;
/*!40000 ALTER TABLE `search_analytics` DISABLE KEYS */;
INSERT INTO `search_analytics` VALUES (1,'nike',NULL,5,21,NULL,'127.0.0.1','2026-02-23 10:31:43'),(2,'jordan',NULL,2,4,NULL,'127.0.0.1','2026-02-23 10:31:55'),(3,'Air Max',NULL,5,143,NULL,'127.0.0.1','2026-02-25 13:00:07'),(4,'Running',NULL,1,3,NULL,'127.0.0.1','2026-02-25 13:00:13'),(5,'Jordan',NULL,2,1,NULL,'127.0.0.1','2026-02-25 13:00:15'),(6,'Air Force 1',NULL,5,2,NULL,'127.0.0.1','2026-02-25 13:00:16'),(7,'Air Max',NULL,5,1,NULL,'127.0.0.1','2026-02-25 13:00:18'),(8,'Dunk',NULL,1,0,NULL,'127.0.0.1','2026-02-25 13:00:19'),(9,'nike',NULL,5,72,NULL,'127.0.0.1','2026-02-26 00:04:29'),(10,'nike',NULL,5,96,NULL,'127.0.0.1','2026-02-26 00:09:29'),(11,'Jordan',NULL,2,60,NULL,'127.0.0.1','2026-02-26 00:12:07'),(12,'Dunk',NULL,1,0,NULL,'127.0.0.1','2026-02-26 00:12:10'),(13,'Running',NULL,1,0,NULL,'127.0.0.1','2026-02-26 00:12:13'),(14,'Air Max',NULL,5,41,NULL,'127.0.0.1','2026-02-26 00:28:26'),(15,'nike',NULL,5,110,NULL,'127.0.0.1','2026-02-26 00:37:21'),(16,'sal',NULL,0,60,NULL,'127.0.0.1','2026-02-26 00:38:55'),(17,'sa',NULL,1,210,NULL,'127.0.0.1','2026-02-26 00:38:55'),(18,'sale',NULL,0,17,NULL,'127.0.0.1','2026-02-26 00:38:55'),(19,'nik',NULL,5,137,NULL,'127.0.0.1','2026-02-26 00:39:24'),(20,'nike',NULL,5,513,NULL,'127.0.0.1','2026-02-26 00:41:02'),(21,'Air Max',NULL,5,315,NULL,'127.0.0.1','2026-03-05 03:02:54'),(22,'Running',NULL,1,308,NULL,'127.0.0.1','2026-03-05 03:02:54'),(23,'Air Force 1',NULL,5,6,NULL,'127.0.0.1','2026-03-05 03:02:55'),(24,'Jordan',NULL,2,6,NULL,'127.0.0.1','2026-03-05 03:02:56'),(25,'Dunk',NULL,1,0,NULL,'127.0.0.1','2026-03-05 03:03:01'),(26,'Air Force 1',NULL,5,138,NULL,'127.0.0.1','2026-03-06 02:56:41'),(27,'Air Max',NULL,5,138,NULL,'127.0.0.1','2026-03-06 02:56:42'),(28,'Running',NULL,1,138,NULL,'127.0.0.1','2026-03-06 02:56:42');
/*!40000 ALTER TABLE `search_analytics` ENABLE KEYS */;
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
  KEY `idx_created` (`created_at`),
  KEY `idx_security_event_time` (`event_type`,`created_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_logs`
--

LOCK TABLES `security_logs` WRITE;
/*!40000 ALTER TABLE `security_logs` DISABLE KEYS */;
INSERT INTO `security_logs` VALUES (4,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"nonexistent@example.com\", \"reason\": \"User not found\"}',NULL,'2026-02-16 00:34:27'),(5,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"nonexistent@example.com\", \"reason\": \"User not found\"}',NULL,'2026-02-16 01:16:01'),(15,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"nonexistent@example.com\", \"reason\": \"User not found\"}',NULL,'2026-02-16 02:26:02'),(22,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"nonexistent@example.com\", \"reason\": \"User not found\"}',NULL,'2026-02-16 02:37:16'),(30,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"nonexistent@example.com\", \"reason\": \"User not found\"}',NULL,'2026-02-16 02:49:39'),(40,2,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\", \"reason\": \"Invalid password\"}',NULL,'2026-02-16 03:18:00'),(41,2,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\", \"reason\": \"Invalid password\"}',NULL,'2026-02-16 03:18:04'),(42,2,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\", \"reason\": \"Invalid password\"}',NULL,'2026-02-16 03:18:34'),(43,2,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 03:19:26'),(47,2,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 03:31:09'),(48,2,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 05:16:40'),(49,2,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"dangthanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 05:18:50'),(50,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 05:22:02'),(51,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 05:41:39'),(52,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 06:17:13'),(53,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 11:04:55'),(54,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 11:22:02'),(55,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 11:43:47'),(56,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 12:01:51'),(57,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 12:17:11'),(58,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-16 12:17:26'),(59,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-17 23:27:50'),(60,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-24 03:18:30'),(61,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 03:25:24'),(62,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 03:31:44'),(63,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 05:52:31'),(64,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 12:28:54'),(65,1,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"reason\": \"Invalid OTP for 2FA\"}',NULL,'2026-02-24 12:28:58'),(66,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 14:45:35'),(67,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 14:55:28'),(68,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-24 15:00:49'),(69,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-02-25 00:13:44'),(70,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 00:19:52'),(71,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 01:38:56'),(72,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 01:55:03'),(73,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 07:14:30'),(74,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 08:34:32'),(75,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 11:10:10'),(76,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 11:34:46'),(77,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 11:45:46'),(78,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 12:04:58'),(79,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-25 12:22:09'),(80,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-02-28 16:43:52'),(81,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 02:59:32'),(82,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 04:17:45'),(83,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 10:11:54'),(84,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 10:36:47'),(85,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 10:57:01'),(86,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 11:44:27'),(87,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 13:40:05'),(88,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-01 14:51:04'),(89,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-03 07:28:46'),(90,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-05 02:13:44'),(91,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-06 01:48:22'),(92,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-06 02:06:21'),(93,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-06 02:45:05'),(95,NULL,NULL,'rate_limit_hit','127.0.0.1',NULL,'{\"tag\": \"auth\", \"limit\": 3, \"windowMs\": 60000}',NULL,'2026-03-10 08:05:04'),(97,NULL,NULL,'rate_limit_hit','127.0.0.1',NULL,'{\"tag\": \"auth\", \"limit\": 3, \"windowMs\": 60000}',NULL,'2026-03-10 08:05:37'),(98,NULL,NULL,'rate_limit_hit','127.0.0.1',NULL,'{\"tag\": \"auth\", \"limit\": 3, \"windowMs\": 60000}',NULL,'2026-03-10 08:05:57'),(99,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 12:03:54'),(100,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 12:07:04'),(101,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 12:08:31'),(102,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 12:39:05'),(103,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 13:00:42'),(104,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 13:17:27'),(105,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 15:08:26'),(106,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"method\": \"2fa_email\"}',NULL,'2026-03-10 15:35:18'),(107,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 16:01:58'),(108,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-10 16:17:57'),(109,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-11 00:46:41'),(110,1,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"reason\": \"Invalid password\", \"attempts\": 1}',NULL,'2026-03-12 01:59:43'),(111,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-12 01:59:44'),(112,1,NULL,'login_failed','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\", \"reason\": \"Invalid password\", \"attempts\": 1}',NULL,'2026-03-12 02:37:07'),(113,1,NULL,'login_success','127.0.0.1',NULL,'{\"email\": \"thanhtoan06092004@gmail.com\"}',NULL,'2026-03-12 02:37:07'),(114,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-13 01:41:54'),(115,1,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"Invalid password\", \"attempts\": 1, \"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-13 02:00:54'),(116,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-13 02:00:54'),(117,1,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"Invalid password\", \"attempts\": 1, \"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-13 02:24:19'),(118,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-13 02:24:19'),(119,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"User not found\", \"emailHash\": \"3dbfa5c18ca5a9480fd0bb9a467c01519f1654524c6f252f93651c585307c9ce\"}',NULL,'2026-03-13 14:57:32'),(120,NULL,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"User not found\", \"emailHash\": \"3dbfa5c18ca5a9480fd0bb9a467c01519f1654524c6f252f93651c585307c9ce\"}',NULL,'2026-03-13 14:57:33'),(121,NULL,NULL,'rate_limit_hit','127.0.0.1',NULL,'{\"tag\": \"auth\", \"limit\": 3, \"windowMs\": 60000}',NULL,'2026-03-13 14:57:34'),(122,1,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"Invalid password\", \"attempts\": 1, \"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 06:12:02'),(123,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 06:12:02'),(124,1,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"Invalid password\", \"attempts\": 1, \"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 14:00:02'),(125,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 14:00:02'),(126,1,NULL,'login_failed','127.0.0.1',NULL,'{\"reason\": \"Invalid password\", \"attempts\": 1, \"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 15:18:03'),(127,1,NULL,'login_success','127.0.0.1',NULL,'{\"emailHash\": \"c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080\"}',NULL,'2026-03-17 15:18:04');
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
  `value_type` enum('string','number','boolean','json') DEFAULT 'string',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=290 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'store_name','TOAN STORE','string','2026-01-27 08:06:42'),(2,'store_email','support@toanstore.com','string','2026-01-27 08:06:42'),(3,'store_phone','0123456789','string','2026-01-27 08:06:42'),(4,'store_address','123 Main Street','string','2026-01-27 08:06:42'),(5,'store_city','Hanoi','string','2026-01-27 08:06:42'),(6,'store_country','Vietnam','string','2026-01-27 08:06:42'),(7,'store_currency','VND','string','2026-01-27 08:06:42'),(8,'tax_rate','10','number','2026-03-09 05:42:29'),(9,'shipping_cost_domestic','30000','number','2026-03-09 05:42:29'),(10,'shipping_cost_international','100000','number','2026-03-09 05:42:29'),(11,'maintenance_mode','false','string','2026-02-01 12:38:21'),(281,'shipping_fee','30000','string','2026-03-08 13:34:36'),(282,'free_shipping_threshold','500000','number','2026-03-09 05:42:29'),(283,'order_prefix','TS','string','2026-03-08 13:34:36'),(284,'products_per_page','12','string','2026-03-08 13:34:36'),(285,'facebook_pixel_id','123456789','string','2026-03-08 13:34:36'),(286,'google_analytics_id','UA-123456-1','string','2026-03-08 13:34:36');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_items`
--

LOCK TABLES `shipment_items` WRITE;
/*!40000 ALTER TABLE `shipment_items` DISABLE KEYS */;
INSERT INTO `shipment_items` VALUES (2,2,53,1);
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
  `tracking_number` varchar(100) DEFAULT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'preparing',
  `estimated_delivery` timestamp NULL DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_code` (`tracking_number`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_tracking_code` (`tracking_number`),
  KEY `idx_shipments_status` (`status`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipments`
--

LOCK TABLES `shipments` WRITE;
/*!40000 ALTER TABLE `shipments` DISABLE KEYS */;
INSERT INTO `shipments` VALUES (2,57,NULL,'TRK1773799942278','GHTK','pending',NULL,NULL,NULL,'2026-03-18 09:12:22','2026-03-18 09:12:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
-- Table structure for table `stock_reservation_items`
--

DROP TABLE IF EXISTS `stock_reservation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reservation_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` bigint unsigned NOT NULL,
  `product_variant_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservation_id` (`reservation_id`),
  KEY `idx_variant_id` (`product_variant_id`),
  CONSTRAINT `fk_res_items_parent` FOREIGN KEY (`reservation_id`) REFERENCES `stock_reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_reservation_items`
--

LOCK TABLES `stock_reservation_items` WRITE;
/*!40000 ALTER TABLE `stock_reservation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_reservation_items` ENABLE KEYS */;
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
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` bigint unsigned DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `fk_reservations_user` (`user_id`),
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
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
INSERT INTO `stores` VALUES (1,'TOAN Store Vincom Đồng Khởi','toan-vincom-dong-khoi','HCM-VCM01','72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1','Hồ Chí Minh',NULL,'Vietnam',NULL,'0283822xxxx','dongkhoi@toanstore.vn',10.77688900,106.70245100,'Cửa hàng TOAN Store chính thức tại trung tâm TP.HCM',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),(2,'TOAN Store Vincom Mega Mall','toan-vincom-mega-mall','HN-VCM02','458 Minh Khai, Quận Hai Bà Trưng','Hà Nội',NULL,'Vietnam',NULL,'02466823xxxx','hanoi@toanstore.vn',20.99916700,105.85888900,'Cửa hàng TOAN Store lớn nhất Hà Nội',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:39'),(3,'TOAN Store Vincom Center','toan-vincom-center-danang','DN-VCM01','910-912 Ngô Quyền, Quận Sơn Trà','Đà Nẵng',NULL,'Vietnam',NULL,'02363822xxxx','danang@toanstore.vn',16.06194400,108.22916700,'TOAN Store tại Đà Nẵng',NULL,NULL,1,NULL,'2025-12-06 14:11:35','2025-12-08 03:03:28');
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
  `guest_email_hash` varchar(64) DEFAULT NULL,
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
  KEY `idx_status_last_message` (`status`,`last_message_at` DESC),
  KEY `idx_assigned_status` (`assigned_admin_id`,`status`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_guest_email_hash` (`guest_email_hash`),
  CONSTRAINT `support_chats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `support_chats_ibfk_2` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_chats`
--

LOCK TABLES `support_chats` WRITE;
/*!40000 ALTER TABLE `support_chats` DISABLE KEYS */;
INSERT INTO `support_chats` VALUES (11,1,NULL,NULL,NULL,'resolved',NULL,NULL,'2026-02-07 14:16:44','2026-03-06 06:52:16','2026-02-07 14:19:37'),(14,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-09 00:04:26','2026-02-10 09:17:35','2026-02-10 09:17:28'),(15,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-09 00:04:26','2026-02-10 09:17:46','2026-02-10 09:15:55'),(16,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:24:24','2026-02-10 09:30:34','2026-02-10 09:24:32'),(17,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:24:24','2026-02-10 09:30:44','2026-02-10 09:24:24'),(18,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:30:56','2026-02-10 09:32:01','2026-02-10 09:31:12'),(19,1,NULL,NULL,NULL,'resolved',NULL,1,'2026-02-10 09:32:14','2026-02-10 09:32:37','2026-02-10 09:32:14');
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
INSERT INTO `support_messages` VALUES (15,11,'customer',1,'Xin chào, tôi cần hỗ trợ!',NULL,1,'2026-02-07 14:16:44'),(16,11,'admin',NULL,'ok',NULL,1,'2026-02-07 14:18:55'),(17,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:15'),(18,11,'admin',NULL,'ok',NULL,1,'2026-02-07 14:19:27'),(19,11,'customer',1,'ok',NULL,0,'2026-02-07 14:19:37'),(20,15,'admin',1,'hi',NULL,1,'2026-02-10 09:15:55'),(21,14,'customer',1,'hi',NULL,1,'2026-02-10 09:16:03'),(22,14,'admin',1,'hi',NULL,1,'2026-02-10 09:16:15'),(23,14,'admin',1,'ok',NULL,1,'2026-02-10 09:16:33'),(24,14,'customer',1,'','/uploads/chat/1770715024944-1-Screenshot_2026-02-10_093337.png',0,'2026-02-10 09:17:05'),(25,14,'admin',1,'ok',NULL,1,'2026-02-10 09:17:28'),(26,16,'customer',1,'hi',NULL,1,'2026-02-10 09:24:32'),(27,18,'customer',1,'hi',NULL,1,'2026-02-10 09:30:58'),(28,18,'admin',1,'ok',NULL,1,'2026-02-10 09:31:12');
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
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
  `user_id` bigint unsigned DEFAULT NULL,
  `payment_provider` enum('vnpay','momo','zalopay','bank_transfer','cod') NOT NULL,
  `transaction_code` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `response_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transaction_provider_code` (`payment_provider`,`transaction_code`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_transactions_order_status` (`order_id`,`status`),
  CONSTRAINT `transactions_fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `transactions_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,3,NULL,'momo','TX123',1000.00,'pending',NULL,'2026-03-09 01:34:22','2026-03-09 01:34:22');
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
  `recipient_name_encrypted` text,
  `phone` varchar(255) DEFAULT NULL,
  `phone_encrypted` text,
  `address_line` varchar(255) DEFAULT NULL,
  `address_encrypted` text,
  `ward` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Vietnam',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_encrypted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_is_encrypted` (`is_encrypted`),
  KEY `idx_user_addr_default` (`user_id`,`is_default`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (7,1,'Nhà','DANG THANH TOAN',NULL,'***','c6f1d298e6eda39fa6ddba9fd34b0ed4:ddcbf087e4f95e569947104605bfe024:f55e83b437a0e4d39f6d','***','c7a71b8f694f4906c3a614b9cdaea2cf:022dddc2ddc29fe8337649285df9243a:562856a6b9',NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',1,'2025-12-07 07:43:38',1),(8,1,'Văn Phòng','DANG THANH TOAN',NULL,'***','3586a7313cc9ac770af8bfd459e49c2f:1e2ea923c9a81043d614f2019d86567a:728edf05ac460c490754','***','90f8094757225ef71c3fad03a09e8c9a:1ba4a91a84be96d3ce503d7c481d325b:40ddb15bcb',NULL,NULL,'TP. Hồ Chí Minh','Hóc Môn','700000','Vietnam',0,'2025-12-07 09:49:27',1),(9,2,'Nhà','DANG THANH TOAN',NULL,'***','aee729f3f203d643ec580b4475cbc06d:70c92a4099335887a733f0e839619267:66483ffb17cedad30705','***','a3eb68dcb7ca4152051a771b81815703:612ca8cbb0011e9bf11c84d9302e3a7d:75c010b16e',NULL,NULL,'HO CHI MINH','Thành phố Hồ Chí Minh','700000','Vietnam',1,'2025-12-08 02:05:25',1);
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_consents`
--

DROP TABLE IF EXISTS `user_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `consent_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_granted` tinyint(1) DEFAULT '0',
  `granted_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_consent_type` (`user_id`,`consent_type`),
  CONSTRAINT `user_consents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_consents`
--

LOCK TABLES `user_consents` WRITE;
/*!40000 ALTER TABLE `user_consents` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_consents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notification_preferences`
--

DROP TABLE IF EXISTS `user_notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('email','sms','push','promo','order','sms_order') NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type` (`user_id`,`type`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notification_preferences`
--

LOCK TABLES `user_notification_preferences` WRITE;
/*!40000 ALTER TABLE `user_notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_notification_preferences` ENABLE KEYS */;
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
  `email_hash` varchar(64) DEFAULT NULL,
  `email_encrypted` text COMMENT 'AES-256-GCM encrypted email. Format: IV:AUTH_TAG:CIPHERTEXT',
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `phone_encrypted` text,
  `date_of_birth` date DEFAULT NULL,
  `date_of_birth_encrypted` text,
  `is_encrypted` tinyint(1) DEFAULT '0',
  `gender` enum('male','female','other') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_verified` tinyint(1) DEFAULT '0',
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_banned` tinyint(1) DEFAULT '0' COMMENT 'User banned status: 0 = active, 1 = banned',
  `membership_tier` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(1000) DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL,
  `token_version` int DEFAULT '1',
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `email_notifications` tinyint(1) DEFAULT '1',
  `sms_notifications` tinyint(1) DEFAULT '0',
  `push_notifications` tinyint(1) DEFAULT '1',
  `promo_notifications` tinyint(1) DEFAULT '0',
  `order_notifications` tinyint(1) DEFAULT '1',
  `data_persistence` tinyint(1) DEFAULT '1',
  `public_profile` tinyint(1) DEFAULT '1',
  `sms_order_notifications` tinyint(1) DEFAULT '0',
  `lifetime_points` int NOT NULL DEFAULT '0',
  `available_points` int NOT NULL DEFAULT '0',
  `tier_updated_at` datetime DEFAULT NULL,
  `points_expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `facebook_id` (`facebook_id`),
  UNIQUE KEY `idx_email_hash` (`email_hash`),
  KEY `idx_is_banned` (`is_banned`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_is_encrypted` (`is_encrypted`),
  KEY `idx_email_verified` (`email`,`is_verified`),
  KEY `idx_active_created` (`is_active`,`created_at` DESC),
  KEY `idx_users_tier` (`membership_tier`),
  KEY `idx_users_lifetime` (`lifetime_points`),
  KEY `idx_tier_points` (`membership_tier`,`lifetime_points` DESC),
  KEY `idx_email_masked` (`email`),
  CONSTRAINT `chk_available_points_non_negative` CHECK ((`available_points` >= 0)),
  CONSTRAINT `chk_users_points_consistency` CHECK ((`available_points` <= `lifetime_points`))
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'***','c4a7f12dae8d8202b6e256ec3bb892cc1b007c48f6997ce7e489f32ebaa63080','b06b99857df6df457add5dc80c958d78:cdb336fcd2ba87430dd899b4b6a1548b:efd24066fcdf9760ad0b091ea882b516a51188ae4e087603956f64','$2b$10$FuATxsM2lDBFld6vf92b1.EyMt7/WMv.JomaEP8IngxF2TAAXdwYq','TOAN','DANG','DANG TOAN','***','c8b49914fc767319b8558a33c3f891d0:334b74b832e0f750dca956bfa6219a01:fc4b6cce973e95484553',NULL,'807c293596a82620fe92fef73b75fffc:d7911fbad75abbac3ea09e63e6d9016a:8ab47c62ed667ece4203',1,'male',1,0,'{\"gender\": \"male\", \"dateOfBirth\": \"2004-09-06\"}','2025-12-06 14:42:48','2026-03-17 15:18:03',0,'silver',NULL,NULL,NULL,'https://res.cloudinary.com/dbhfn2hqs/image/upload/v1772334121/nike-clone/products/qs2iayd7nebiv26grp9h.jpg',0,NULL,2,0,1,1,1,1,1,1,1,1,2447,2397,NULL,NULL),(2,'***','93756e653962f56ff0a4fde16bc13b6eeca0c71ca5d308773bd45c0aa0b788dc','63a4f20123029274e274c6ec98686823:27399804aba0effa69598f2079648d80:ad8742f927a9524ce91895b645dbd304ab0a15ce4f95943506abbe009327d0','$2b$10$ckcKXxzPwAkzxq/qhxNeKOMM4MBJbkyBRTe3D.FpPB28Ux4OTbm2S','DANG','TOAN','TOAN DANG','***','1d75fbce47802ae6e58172865e570e4d:f1663a5b955d8f5e8f24d9f8c79dc1a50ef796009453de3b72685186b2fbb9901f0cc6ff264d5a86607ee12f2ee98674a8fb2166ee260b4938cee9541af64f6ccc21698cbb88067335c949ec1bc5c2a0cbb284686d34a02c62f6769ff88a46f4','2004-09-06','a23907ae38e4b138d8739e78a4496df0:87ce800b207ee81cf1bc00968eb1504d3ef42257454217ef24ce299726cc0270',1,'male',1,0,NULL,'2025-12-08 01:37:41','2026-03-09 15:16:35',0,'bronze',NULL,NULL,NULL,NULL,0,NULL,1,0,1,0,1,0,1,1,1,0,0,0,NULL,NULL),(35,'***','6c137895bbefcf10b8bb0f6e7a26b0c3fc33a3338704ec1aa73a596129be2355','41fcfbb80b54167fc88f50fc6d5a71a0:92db3826a2dca27325f2b81ab624b134:1dfcaea471dd2c44d2abbb7f2dcd29da5b7009719cb682c64b','$2b$10$wNuNVBMzvjjptrTaynkYleFldySaaRny4p.zYJUkk4KSgzbkZLXZS',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,1,0,NULL,'2026-03-10 08:05:35','2026-03-10 08:05:35',0,'bronze',NULL,NULL,NULL,NULL,0,NULL,1,0,1,0,1,0,1,1,1,0,0,0,NULL,NULL),(36,'***','9cba261df10c032d2d5444b6de99556cb654e5e2bd7f0d910246de93ff429d96','1d881f35b128be34261446ab38c74a81:92f50156a2eeca1a71c1bfa93677967a:d1c2f14f2f568ca83cc0c0f78a2cd2cf4baabb7d807be95280','$2b$10$8GSh5lakJfj69ufv7fy1nOgKPo9JCwRN4wTYRuEtO5EHulX9wpZwu',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,1,0,NULL,'2026-03-10 08:05:56','2026-03-10 08:05:56',0,'bronze',NULL,NULL,NULL,NULL,0,NULL,1,0,1,0,1,0,1,1,1,0,0,0,NULL,NULL),(37,'***','b6f14daacddcb99fede35fe6d1355e95c0b4f1388b3d394ee1f64fcb8ea8021a','dfd02c2553f4d23013468121d47097f1:59811d2ee8f1757affeb2642f9449c6c:f27c956ebb7538ece19b1cb0f80930f1ade96df7fdbde42c76','$2b$10$71vBnQGBr5c6CjeCZ7PVKu7yZAlR5tREVbBpMQjI4flt.BvVN1nZO',NULL,NULL,NULL,'***',NULL,NULL,NULL,1,NULL,1,0,NULL,'2026-03-13 14:57:28','2026-03-13 14:57:28',0,'bronze',NULL,NULL,NULL,NULL,0,NULL,1,0,1,0,1,0,1,1,1,0,0,0,NULL,NULL);
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
  `code` varchar(100) NOT NULL COMMENT 'One-time personal credit code. Claimed into user wallet, then applied at checkout.',
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
  `usage_limit` int DEFAULT '1' COMMENT '0 = unlimited',
  `usage_limit_per_user` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `recipient_user_id` (`recipient_user_id`),
  KEY `redeemed_by_user_id` (`redeemed_by_user_id`),
  KEY `status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_status_valid` (`status`,`valid_until`),
  KEY `fk_vouchers_issuer` (`issued_by_user_id`),
  CONSTRAINT `fk_vouchers_issuer` FOREIGN KEY (`issued_by_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vouchers_ibfk_2` FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'GIFT2024-001',100000.00,'bronze',0.00,NULL,'fixed','Gift code $100k credits',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-30 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:42:32',NULL,1,1),(2,'REF-SIGN100',50000.00,'bronze',0.00,NULL,'fixed','Referral sign up reward',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-12-26 17:00:00',NULL,'2026-01-27 04:20:51','2026-03-01 13:36:57',NULL,1,1),(3,'WELCOME-NEW',200000.00,'bronze',0.00,NULL,'fixed','Welcome new customer',NULL,1,NULL,'active','2026-01-27 04:20:51','2026-06-29 17:00:00',NULL,'2026-01-27 04:20:51','2026-02-14 06:38:49',NULL,1,1),(4,'TOAN',100000.00,'silver',0.00,NULL,'fixed','Qùa Sinh Nhật',NULL,1,NULL,'active','2026-03-01 13:38:09','2026-10-09 17:00:00',NULL,'2026-03-01 13:38:09','2026-03-01 13:38:09',NULL,1,1),(5,'THANHTOAN',100000.00,'silver',0.00,NULL,'fixed','TEST',NULL,1,NULL,'active','2026-03-01 14:17:46','2026-12-30 17:00:00',NULL,'2026-03-01 14:17:46','2026-03-01 14:20:33','2026-03-01 14:20:33',1,1),(8,'ABCD',10000000.00,'bronze',0.00,NULL,'fixed','test',NULL,1,NULL,'active','2026-03-01 14:53:56','2026-12-30 17:00:00',NULL,'2026-03-01 14:53:56','2026-03-01 14:53:56',NULL,1,1),(9,'REDEEM50K',50000.00,'bronze',0.00,NULL,'fixed','Giảm 50K cho đơn hàng bất kỳ',NULL,1,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:19:07',NULL,1,1),(10,'REDEEM100K',100000.00,'bronze',0.00,NULL,'fixed','Giảm 100K cho đơn hàng bất kỳ',NULL,NULL,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:04:59',NULL,1,1),(11,'REDEEM10',10.00,'bronze',0.00,NULL,'percent','Giảm 10% cho đơn hàng bất kỳ',NULL,NULL,NULL,'active','2026-03-06 02:04:59','2026-04-05 02:04:59',NULL,'2026-03-06 02:04:59','2026-03-06 02:04:59',NULL,1,1);
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'Kho Hà Nội (Main)','Hà Nội',1,'2026-02-13 07:03:50','2026-02-13 07:03:50',0),(2,'Kho TP.HCM','TP. Hồ Chí Minh',1,'2026-02-13 07:03:50','2026-02-13 07:03:50',0);
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
  `price_when_added` decimal(12,2) DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_product` (`wishlist_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (36,1,7,7319000.00,'2026-02-16 02:22:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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

-- Dump completed on 2026-03-18  9:20:30
