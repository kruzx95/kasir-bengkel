-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: irian_motor
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

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

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('3f507947-2bec-48f6-9ec9-c9331bb9aac1','c6b97a2a45eeabe8d80f715bcd5f911b350341637a255820c2009a96954517ec','2026-05-18 15:44:14.294','20260518135817_phase1_customer_sparepart_fields',NULL,NULL,'2026-05-18 15:44:14.200',1),('406fd425-bae9-4f72-ba3f-cedc419682fe','b7ebb197784a533af8ca1d40024b20d5d2b4b1e86839975a1dc4ec12e9578dc7','2026-05-18 03:22:08.541','20260518032207_init',NULL,NULL,'2026-05-18 03:22:07.084',1),('8646fb99-9e2b-4683-a943-95568a197e4d','213ecd7a8ca0e602f4dede2f014306aff4b9567160180648c4c6e23f10f77208','2026-05-19 03:42:51.469','20260519034251_phase4_branch_social_media',NULL,NULL,'2026-05-19 03:42:51.420',1),('da1713ba-6f0f-4a08-9427-0d9e617bf206','1b7e8b0e3ffcd49a6f4b9c2a8ac7c7f5a7a291a648528e9488fa30406f0a6620','2026-05-18 15:44:14.784','20260518144703_phase2_restock_receipt_indent',NULL,NULL,'2026-05-18 15:44:14.297',1),('f10df7f1-9eb9-418e-9a29-a33fbaf0caf4','14b6463deb55018bafb22b2685272a65743f25bfc93ff3e310ff869fa06a9a28','2026-05-18 15:44:15.045','20260518151911_phase3_corporate_customer',NULL,NULL,'2026-05-18 15:44:14.787',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `facebook_page` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_handle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES ('cmpan3j160000vai67dgsiycd','BRG-01','Irian Jaya','Jl. Irian Jaya No. 45, Kota Tasikmalaya','0265-123456',1,'2026-05-18 03:23:46.074','2026-05-18 03:23:46.074',NULL,NULL,NULL),('cmpan3j1r0001vai6zymuizxq','BRG-02','Irian Timur','Jl. Irian Timur No. 78, Kota Tasikmalaya','0265-234567',1,'2026-05-18 03:23:46.095','2026-05-18 03:23:46.095',NULL,NULL,NULL),('cmpan3j230002vai6floxvo5h','BRG-03','Irian Barat','Jl. Irian Barat No. 12, Kota Tasikmalaya','0265-345678',1,'2026-05-18 03:23:46.107','2026-05-18 03:23:46.107',NULL,NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `corporate_customers`
--

DROP TABLE IF EXISTS `corporate_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `corporate_customers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_cycle` enum('WEEKLY','BIWEEKLY','MONTHLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `corporate_customers_branch_id_fkey` (`branch_id`),
  CONSTRAINT `corporate_customers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `corporate_customers`
--

LOCK TABLES `corporate_customers` WRITE;
/*!40000 ALTER TABLE `corporate_customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `corporate_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plate_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_year` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuel_type` enum('GASOLINE','DIESEL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `odometer` int DEFAULT NULL,
  `vehicle_brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `corporate_customer_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_branch_id_fkey` (`branch_id`),
  KEY `customers_corporate_customer_id_fkey` (`corporate_customer_id`),
  CONSTRAINT `customers_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `customers_corporate_customer_id_fkey` FOREIGN KEY (`corporate_customer_id`) REFERENCES `corporate_customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indent_order_items`
--

DROP TABLE IF EXISTS `indent_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `indent_order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `indent_order_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sparepart_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `received_qty` int NOT NULL DEFAULT '0',
  `estimated_price` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `indent_order_items_indent_order_id_fkey` (`indent_order_id`),
  KEY `indent_order_items_sparepart_id_fkey` (`sparepart_id`),
  CONSTRAINT `indent_order_items_indent_order_id_fkey` FOREIGN KEY (`indent_order_id`) REFERENCES `indent_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `indent_order_items_sparepart_id_fkey` FOREIGN KEY (`sparepart_id`) REFERENCES `spareparts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indent_order_items`
--

LOCK TABLES `indent_order_items` WRITE;
/*!40000 ALTER TABLE `indent_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `indent_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indent_orders`
--

DROP TABLE IF EXISTS `indent_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `indent_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_date` date NOT NULL,
  `expected_date` date DEFAULT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PARTIAL','RECEIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `indent_orders_branch_id_fkey` (`branch_id`),
  KEY `indent_orders_user_id_fkey` (`user_id`),
  CONSTRAINT `indent_orders_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `indent_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indent_orders`
--

LOCK TABLES `indent_orders` WRITE;
/*!40000 ALTER TABLE `indent_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `indent_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mechanics`
--

DROP TABLE IF EXISTS `mechanics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mechanics` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mechanics_branch_id_fkey` (`branch_id`),
  CONSTRAINT `mechanics_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mechanics`
--

LOCK TABLES `mechanics` WRITE;
/*!40000 ALTER TABLE `mechanics` DISABLE KEYS */;
/*!40000 ALTER TABLE `mechanics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restock_items`
--

DROP TABLE IF EXISTS `restock_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restock_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `restock_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sparepart_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `buy_price` double NOT NULL,
  `subtotal` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `restock_items_restock_id_fkey` (`restock_id`),
  KEY `restock_items_sparepart_id_fkey` (`sparepart_id`),
  CONSTRAINT `restock_items_restock_id_fkey` FOREIGN KEY (`restock_id`) REFERENCES `restocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `restock_items_sparepart_id_fkey` FOREIGN KEY (`sparepart_id`) REFERENCES `spareparts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restock_items`
--

LOCK TABLES `restock_items` WRITE;
/*!40000 ALTER TABLE `restock_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `restock_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restocks`
--

DROP TABLE IF EXISTS `restocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restocks` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `indent_order_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_image_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restocks_branch_id_fkey` (`branch_id`),
  KEY `restocks_user_id_fkey` (`user_id`),
  KEY `restocks_indent_order_id_fkey` (`indent_order_id`),
  CONSTRAINT `restocks_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restocks_indent_order_id_fkey` FOREIGN KEY (`indent_order_id`) REFERENCES `indent_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `restocks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restocks`
--

LOCK TABLES `restocks` WRITE;
/*!40000 ALTER TABLE `restocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `restocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `services_branch_id_fkey` (`branch_id`),
  CONSTRAINT `services_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('cmpaox4kc0003xei6zjdoqvg6','cmpan3j160000vai67dgsiycd','Service Matic A',50000,'detail meliputi apa saja',1,'2026-05-18 04:14:46.620','2026-05-18 04:14:46.620'),('cmpaox4kc0004xei6re3soq3s','cmpan3j1r0001vai6zymuizxq','Service Matic A',50000,'detail meliputi apa saja',1,'2026-05-18 04:14:46.620','2026-05-18 04:14:46.620'),('cmpaox4kc0005xei6zqymhjwh','cmpan3j230002vai6floxvo5h','Service Matic A',50000,'detail meliputi apa saja',1,'2026-05-18 04:14:46.620','2026-05-18 04:14:46.620');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spareparts`
--

DROP TABLE IF EXISTS `spareparts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spareparts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buy_price` double NOT NULL DEFAULT '0',
  `sell_price` double NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `sparepart_brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sparepart_size` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sparepart_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spareparts_branch_id_fkey` (`branch_id`),
  CONSTRAINT `spareparts_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spareparts`
--

LOCK TABLES `spareparts` WRITE;
/*!40000 ALTER TABLE `spareparts` DISABLE KEYS */;
INSERT INTO `spareparts` VALUES ('cmpaoyhdy0006xei6dts0pk8o','cmpan3j160000vai67dgsiycd','Oli Motul 3100 gold 15w-50',NULL,50000,65000,10,'pcs',1,'2026-05-18 04:15:49.894','2026-05-18 04:15:49.894',NULL,NULL,NULL),('cmpaoyhdy0007xei6mdysv86e','cmpan3j1r0001vai6zymuizxq','Oli Motul 3100 gold 15w-50',NULL,50000,65000,10,'pcs',1,'2026-05-18 04:15:49.894','2026-05-18 04:15:49.894',NULL,NULL,NULL),('cmpaoyhdy0008xei6fmlome6k','cmpan3j230002vai6floxvo5h','Oli Motul 3100 gold 15w-50',NULL,50000,65000,10,'pcs',1,'2026-05-18 04:15:49.894','2026-05-18 04:15:49.894',NULL,NULL,NULL);
/*!40000 ALTER TABLE `spareparts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_items`
--

DROP TABLE IF EXISTS `transaction_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` enum('SERVICE','SPAREPART') COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sparepart_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` double NOT NULL,
  `subtotal` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `transaction_items_transaction_id_fkey` (`transaction_id`),
  KEY `transaction_items_service_id_fkey` (`service_id`),
  KEY `transaction_items_sparepart_id_fkey` (`sparepart_id`),
  CONSTRAINT `transaction_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transaction_items_sparepart_id_fkey` FOREIGN KEY (`sparepart_id`) REFERENCES `spareparts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transaction_items_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_items`
--

LOCK TABLES `transaction_items` WRITE;
/*!40000 ALTER TABLE `transaction_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mechanic_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('SERVICE','SPAREPART','MIXED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('COMPLETED','CANCELLED','PENDING_CORPORATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `subtotal` double NOT NULL DEFAULT '0',
  `discount` double NOT NULL DEFAULT '0',
  `total` double NOT NULL DEFAULT '0',
  `payment_method` enum('CASH','TRANSFER','QRIS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_invoice_number_key` (`invoice_number`),
  KEY `transactions_branch_id_transaction_date_idx` (`branch_id`,`transaction_date`),
  KEY `transactions_customer_id_fkey` (`customer_id`),
  KEY `transactions_user_id_fkey` (`user_id`),
  KEY `transactions_mechanic_id_fkey` (`mechanic_id`),
  CONSTRAINT `transactions_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transactions_mechanic_id_fkey` FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','KASIR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'KASIR',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_branch_id_fkey` (`branch_id`),
  CONSTRAINT `users_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmpan3j6q0003vai6knkbiklv',NULL,'Owner Irian Motor','admin@irianmotor.com','$2b$10$swMmBnXyzLBFO7H9ovHQMOOforUbzhD8axunZ5qVHIqL1xv7aBghC','ADMIN',1,'2026-05-18 03:23:46.274','2026-05-18 03:23:46.274'),('cmpan3jaj0004vai6lx1iuz64','cmpan3j160000vai67dgsiycd','Kasir Irian Jaya','kasir1@irianmotor.com','$2b$10$7N2FOQnm16QwOHPxaFFGBOuzgf5uoTcwkw.8nQSKueoxfm3kmyhne','KASIR',1,'2026-05-18 03:23:46.411','2026-05-18 03:23:46.411'),('cmpan3jay0005vai6eor05dmu','cmpan3j1r0001vai6zymuizxq','Kasir Irian Timur','kasir2@irianmotor.com','$2b$10$7N2FOQnm16QwOHPxaFFGBOuzgf5uoTcwkw.8nQSKueoxfm3kmyhne','KASIR',1,'2026-05-18 03:23:46.426','2026-05-18 03:23:46.426'),('cmpan3jbb0006vai6ul0d9mpg','cmpan3j230002vai6floxvo5h','Kasir Irian Barat','kasir3@irianmotor.com','$2b$10$7N2FOQnm16QwOHPxaFFGBOuzgf5uoTcwkw.8nQSKueoxfm3kmyhne','KASIR',1,'2026-05-18 03:23:46.439','2026-05-18 03:23:46.439');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-20  9:28:54
