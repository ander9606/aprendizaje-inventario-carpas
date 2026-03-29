CREATE DATABASE  IF NOT EXISTS `aprendizaje_inventario` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `aprendizaje_inventario`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: aprendizaje_inventario
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `alertas_alquiler_vistas`
--

DROP TABLE IF EXISTS `alertas_alquiler_vistas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertas_alquiler_vistas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `ignorar_hasta` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_alerta_usuario` (`tipo`,`referencia_id`,`usuario_id`),
  KEY `idx_usuario_vigente` (`usuario_id`,`ignorar_hasta`),
  CONSTRAINT `fk_alertas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de alertas ignoradas temporalmente por usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas_alquiler_vistas`
--

LOCK TABLES `alertas_alquiler_vistas` WRITE;
/*!40000 ALTER TABLE `alertas_alquiler_vistas` DISABLE KEYS */;
INSERT INTO `alertas_alquiler_vistas` VALUES (1,'ALQUILER_NO_INICIADO',2,1,'2026-02-04 10:00:03','2026-02-03 15:00:03'),(2,'ALQUILER_NO_INICIADO',1,1,'2026-02-11 21:47:27','2026-02-05 02:47:27'),(3,'ALQUILER_NO_INICIADO',7,1,'2026-02-05 22:03:07','2026-02-05 03:03:07'),(4,'ORDEN_MONTAJE_VENCIDA',3,1,'2026-02-05 22:03:08','2026-02-05 03:03:08'),(5,'ALQUILER_NO_INICIADO',3,1,'2026-02-05 22:03:09','2026-02-05 03:03:09'),(6,'ORDEN_MONTAJE_VENCIDA',4,1,'2026-02-04 16:04:12','2026-02-03 21:04:11'),(7,'ORDEN_DESMONTAJE_VENCIDA',10,1,'2026-02-04 16:04:12','2026-02-03 21:04:11'),(8,'ALQUILER_NO_INICIADO',4,1,'2026-02-10 22:02:19','2026-02-10 03:02:18'),(9,'ALQUILER_NO_INICIADO',5,1,'2026-02-04 16:04:13','2026-02-03 21:04:12'),(10,'ORDEN_DESMONTAJE_VENCIDA',12,1,'2026-02-04 16:04:13','2026-02-03 21:04:12'),(11,'ORDEN_MONTAJE_VENCIDA',13,1,'2026-02-04 16:04:13','2026-02-03 21:04:12'),(12,'ALQUILER_NO_INICIADO',6,1,'2026-02-04 16:04:13','2026-02-03 21:04:13'),(13,'ORDEN_DESMONTAJE_VENCIDA',16,1,'2026-02-04 16:04:13','2026-02-03 21:04:13'),(14,'ORDEN_DESMONTAJE_VENCIDA',14,1,'2026-02-04 16:04:14','2026-02-03 21:04:13'),(21,'COTIZACION_VENCIDA',7,1,'2026-03-29 17:43:04','2026-03-28 22:43:04');
/*!40000 ALTER TABLE `alertas_alquiler_vistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alertas_operaciones`
--

DROP TABLE IF EXISTS `alertas_operaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertas_operaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int DEFAULT NULL,
  `destinatario_id` int DEFAULT NULL,
  `tipo` enum('conflicto_fecha','conflicto_disponibilidad','conflicto_equipo','conflicto_vehiculo','cambio_fecha','incidencia','novedad','stock_disponible','asignacion','rechazo_asignacion','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severidad` enum('baja','media','alta','critica') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'media',
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendiente','resuelta','descartada','escalada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `resuelta_por` int DEFAULT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `notas_resolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orden_id` (`orden_id`),
  KEY `resuelta_por` (`resuelta_por`),
  KEY `idx_alertas_estado` (`estado`),
  KEY `idx_alertas_severidad` (`severidad`),
  KEY `idx_alertas_destinatario` (`destinatario_id`),
  CONSTRAINT `alertas_operaciones_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alertas_operaciones_ibfk_2` FOREIGN KEY (`resuelta_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alertas_operaciones_ibfk_3` FOREIGN KEY (`destinatario_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas_operaciones`
--

LOCK TABLES `alertas_operaciones` WRITE;
/*!40000 ALTER TABLE `alertas_operaciones` DISABLE KEYS */;
INSERT INTO `alertas_operaciones` VALUES (1,15,5,'asignacion','alta','Asignación de montaje - evento de prueba 2','Se te ha asignado como responsable del montaje para \"evento de prueba 2\" programado para el 31/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 01:32:26','2026-03-29 01:32:26'),(2,17,3,'asignacion','alta','Asignación de montaje - baby Shower','Se te ha asignado como responsable del montaje para \"baby Shower\" programado para el 29/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 01:38:26','2026-03-29 01:38:26'),(3,18,5,'asignacion','alta','Asignación de desmontaje - baby Shower','Se te ha asignado como responsable del desmontaje para \"baby Shower\" programado para el 30/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 01:40:59','2026-03-29 01:40:59'),(4,18,NULL,'novedad','alta','Luisa Bulla - Daño en elemento','luisa lo daño','resuelta',1,'2026-03-29 09:04:36','se envia a mantenimiento','2026-03-29 01:42:33','2026-03-29 14:04:36'),(5,16,7,'asignacion','alta','Asignación de desmontaje - evento de prueba 2','Se te ha asignado como responsable del desmontaje para \"evento de prueba 2\" programado para el 31/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 01:56:50','2026-03-29 01:56:50'),(6,19,5,'asignacion','alta','Asignación de mantenimiento - Orden #19','Se te ha asignado como responsable del mantenimiento para \"Orden #19\" programado para el 29/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 02:47:17','2026-03-29 02:47:17'),(7,19,3,'asignacion','alta','Asignación de mantenimiento - Orden #19','Se te ha asignado como responsable del mantenimiento para \"Orden #19\" programado para el 29/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 03:10:25','2026-03-29 03:10:25'),(8,19,7,'asignacion','alta','Asignación de mantenimiento - Orden #19','Se te ha asignado como responsable del mantenimiento para \"Orden #19\" programado para el 29/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 03:11:26','2026-03-29 03:11:26'),(9,22,5,'asignacion','alta','Asignación de montaje - evento de prueba 2','Se te ha asignado como responsable del montaje para \"evento de prueba 2\" programado para el 31/3/2026. Asignado por: Admin Sistema. Por favor acepta o rechaza esta asignación.','pendiente',NULL,NULL,NULL,'2026-03-29 14:09:24','2026-03-29 14:09:24');
/*!40000 ALTER TABLE `alertas_operaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alquiler_elementos`
--

DROP TABLE IF EXISTS `alquiler_elementos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alquiler_elementos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `elemento_id` int NOT NULL,
  `serie_id` int DEFAULT NULL,
  `lote_id` int DEFAULT NULL,
  `lote_alquilado_id` int DEFAULT NULL,
  `cantidad_lote` int DEFAULT NULL,
  `estado_salida` enum('nuevo','bueno','mantenimiento') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'bueno',
  `estado_retorno` enum('nuevo','bueno','dañado','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costo_dano` decimal(12,2) DEFAULT '0.00',
  `notas_retorno` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ubicacion_original_id` int DEFAULT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_retorno` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alquiler_serie` (`alquiler_id`,`serie_id`),
  KEY `fk_alqelem_ubicacion` (`ubicacion_original_id`),
  KEY `idx_alqelem_alquiler` (`alquiler_id`),
  KEY `idx_alqelem_elemento` (`elemento_id`),
  KEY `idx_alqelem_serie` (`serie_id`),
  KEY `idx_alqelem_lote` (`lote_id`),
  KEY `idx_alqelem_lote_alquilado` (`lote_alquilado_id`),
  CONSTRAINT `fk_alqelem_alquiler` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alqelem_elemento` FOREIGN KEY (`elemento_id`) REFERENCES `elementos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_alqelem_lote` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_alqelem_lote_alquilado` FOREIGN KEY (`lote_alquilado_id`) REFERENCES `lotes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_alqelem_serie` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_alqelem_ubicacion` FOREIGN KEY (`ubicacion_original_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alquiler_elementos`
--

LOCK TABLES `alquiler_elementos` WRITE;
/*!40000 ALTER TABLE `alquiler_elementos` DISABLE KEYS */;
INSERT INTO `alquiler_elementos` VALUES (5,1,45,NULL,48,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-16 03:55:42','2026-02-16 05:22:23','2026-02-16 03:55:42','2026-02-16 05:22:23'),(6,1,44,NULL,38,NULL,6,'bueno','bueno',0.00,NULL,NULL,'2026-02-16 03:55:42','2026-02-16 05:22:23','2026-02-16 03:55:42','2026-02-16 05:22:23'),(7,1,39,NULL,34,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-16 03:55:42','2026-02-16 05:22:23','2026-02-16 03:55:42','2026-02-16 05:22:23'),(8,1,42,NULL,37,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-16 03:55:42','2026-02-16 05:22:23','2026-02-16 03:55:42','2026-02-16 05:22:23'),(13,2,45,NULL,48,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-18 00:25:46','2026-02-18 01:03:41','2026-02-18 00:25:46','2026-02-18 01:03:41'),(14,2,44,NULL,38,NULL,6,'bueno','bueno',0.00,NULL,NULL,'2026-02-18 00:25:46','2026-02-18 01:03:41','2026-02-18 00:25:46','2026-02-18 01:03:41'),(15,2,39,NULL,34,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-18 00:25:46','2026-02-18 01:03:41','2026-02-18 00:25:46','2026-02-18 01:03:41'),(16,2,42,NULL,37,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-02-18 00:25:46','2026-02-18 01:03:41','2026-02-18 00:25:46','2026-02-18 01:03:41'),(21,3,45,NULL,48,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:31:08',NULL,'2026-02-18 01:31:08','2026-02-18 01:31:08'),(22,3,44,NULL,38,NULL,6,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:31:08',NULL,'2026-02-18 01:31:08','2026-02-18 01:31:08'),(23,3,39,NULL,34,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:31:08',NULL,'2026-02-18 01:31:08','2026-02-18 01:31:08'),(24,3,42,NULL,37,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:31:08',NULL,'2026-02-18 01:31:08','2026-02-18 01:31:08'),(29,4,45,NULL,48,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:44:36',NULL,'2026-02-18 01:44:36','2026-02-18 01:44:36'),(30,4,44,NULL,38,NULL,2,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:44:36',NULL,'2026-02-18 01:44:36','2026-02-18 01:44:36'),(31,4,39,NULL,34,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:44:36',NULL,'2026-02-18 01:44:36','2026-02-18 01:44:36'),(32,4,42,NULL,37,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-18 01:44:36',NULL,'2026-02-18 01:44:36','2026-02-18 01:44:36'),(38,5,45,NULL,48,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-20 16:58:55',NULL,'2026-02-20 16:58:55','2026-02-20 16:58:55'),(39,5,44,NULL,50,NULL,5,'bueno',NULL,0.00,NULL,NULL,'2026-02-20 16:58:55',NULL,'2026-02-20 16:58:55','2026-02-20 16:58:55'),(40,5,44,NULL,51,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-20 16:58:55',NULL,'2026-02-20 16:58:55','2026-02-20 16:58:55'),(41,5,39,NULL,34,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-20 16:58:55',NULL,'2026-02-20 16:58:55','2026-02-20 16:58:55'),(42,5,42,NULL,37,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-02-20 16:58:55',NULL,'2026-02-20 16:58:55','2026-02-20 16:58:55'),(47,6,45,NULL,48,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-18 23:22:48',NULL,'2026-03-18 23:22:48','2026-03-18 23:22:48'),(48,6,44,NULL,51,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-18 23:22:48',NULL,'2026-03-18 23:22:48','2026-03-18 23:22:48'),(49,6,39,NULL,34,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-18 23:22:48',NULL,'2026-03-18 23:22:48','2026-03-18 23:22:48'),(50,6,42,NULL,37,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-18 23:22:48',NULL,'2026-03-18 23:22:48','2026-03-18 23:22:48'),(60,7,31,NULL,25,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(61,7,29,NULL,23,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(62,7,35,NULL,29,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(63,7,19,NULL,45,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(64,7,26,NULL,19,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(65,7,27,13,NULL,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(66,7,32,NULL,26,NULL,10,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(67,7,28,NULL,22,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(68,7,30,NULL,52,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-28 22:27:23',NULL,'2026-03-28 22:27:23','2026-03-28 22:27:23'),(77,8,31,NULL,25,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(78,8,29,NULL,23,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(79,8,35,NULL,29,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(80,8,19,NULL,45,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(81,8,26,NULL,19,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(82,8,32,NULL,26,NULL,10,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(83,8,28,NULL,22,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(84,8,30,NULL,52,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:32:57',NULL,'2026-03-29 01:32:57','2026-03-29 01:32:57'),(93,9,31,NULL,25,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:50',NULL,'2026-03-29 01:38:50','2026-03-29 01:38:50'),(94,9,29,NULL,23,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:50',NULL,'2026-03-29 01:38:50','2026-03-29 01:38:50'),(95,9,35,NULL,29,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:50',NULL,'2026-03-29 01:38:50','2026-03-29 01:38:50'),(96,9,19,NULL,45,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:50',NULL,'2026-03-29 01:38:50','2026-03-29 01:38:50'),(97,9,26,NULL,19,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:50',NULL,'2026-03-29 01:38:50','2026-03-29 01:38:50'),(98,9,32,NULL,26,NULL,10,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:51',NULL,'2026-03-29 01:38:51','2026-03-29 01:38:51'),(99,9,28,NULL,22,NULL,11,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:51',NULL,'2026-03-29 01:38:51','2026-03-29 01:38:51'),(100,9,30,NULL,52,NULL,1,'bueno',NULL,0.00,NULL,NULL,'2026-03-29 01:38:51',NULL,'2026-03-29 01:38:51','2026-03-29 01:38:51'),(109,11,45,NULL,48,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:12:49',NULL,'2026-03-29 14:12:49','2026-03-29 14:46:09'),(110,11,44,NULL,55,NULL,6,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:12:49',NULL,'2026-03-29 14:12:49','2026-03-29 14:46:10'),(111,11,39,NULL,34,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:12:49',NULL,'2026-03-29 14:12:49','2026-03-29 14:46:10'),(112,11,42,NULL,37,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:12:49',NULL,'2026-03-29 14:12:49','2026-03-29 14:46:14'),(113,10,45,NULL,48,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:22:02',NULL,'2026-03-29 14:22:02','2026-03-29 14:47:10'),(114,10,44,NULL,55,NULL,6,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:22:02',NULL,'2026-03-29 14:22:02','2026-03-29 14:47:10'),(115,10,39,NULL,34,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:22:02',NULL,'2026-03-29 14:22:02','2026-03-29 14:47:11'),(116,10,42,NULL,37,NULL,1,'bueno','bueno',0.00,NULL,NULL,'2026-03-29 14:22:02',NULL,'2026-03-29 14:22:02','2026-03-29 14:47:12');
/*!40000 ALTER TABLE `alquiler_elementos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alquiler_extensiones`
--

DROP TABLE IF EXISTS `alquiler_extensiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alquiler_extensiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int NOT NULL,
  `fecha_retorno_anterior` datetime NOT NULL,
  `fecha_retorno_nueva` datetime NOT NULL,
  `dias_extension` int NOT NULL,
  `razon` text COLLATE utf8mb4_unicode_ci,
  `costo_extension` decimal(12,2) DEFAULT '0.00',
  `registrado_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ext_alquiler` (`alquiler_id`),
  CONSTRAINT `alquiler_extensiones_ibfk_1` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alquiler_extensiones`
--

LOCK TABLES `alquiler_extensiones` WRITE;
/*!40000 ALTER TABLE `alquiler_extensiones` DISABLE KEYS */;
INSERT INTO `alquiler_extensiones` VALUES (1,7,'2026-03-27 00:00:00','2026-03-30 00:00:00',3,NULL,800000.00,'admin@carpas.com','2026-03-28 22:35:08');
/*!40000 ALTER TABLE `alquiler_extensiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alquileres`
--

DROP TABLE IF EXISTS `alquileres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alquileres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `fecha_salida` datetime DEFAULT NULL,
  `fecha_retorno_esperado` datetime DEFAULT NULL,
  `fecha_retorno_real` datetime DEFAULT NULL,
  `total` decimal(12,2) NOT NULL,
  `deposito_cobrado` decimal(12,2) DEFAULT '0.00',
  `costo_danos` decimal(12,2) DEFAULT '0.00',
  `estado` enum('programado','activo','finalizado','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'programado',
  `notas_salida` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notas_retorno` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `extensiones_count` int DEFAULT '0',
  `fecha_retorno_original` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alquileres_estado` (`estado`),
  KEY `idx_alquileres_fecha_salida` (`fecha_salida`),
  KEY `idx_alquileres_fecha_retorno` (`fecha_retorno_esperado`),
  KEY `idx_alquileres_cotizacion` (`cotizacion_id`),
  KEY `idx_alquileres_estado_fecha` (`estado`,`fecha_salida`),
  CONSTRAINT `alquileres_ibfk_1` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alquileres`
--

LOCK TABLES `alquileres` WRITE;
/*!40000 ALTER TABLE `alquileres` DISABLE KEYS */;
INSERT INTO `alquileres` VALUES (1,1,'2026-02-15 22:55:42','2026-02-17 00:00:00','2026-02-16 00:22:23',950810.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:23'),(2,3,'2026-02-17 19:25:46','2026-02-18 00:00:00','2026-02-17 20:03:41',1118600.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-02-18 00:19:55','2026-02-18 01:03:41'),(3,4,'2026-02-17 20:31:08','2026-02-18 00:00:00',NULL,950810.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:34'),(4,5,'2026-02-17 20:44:36','2026-02-22 00:00:00',NULL,421260.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:29'),(5,6,'2026-02-20 11:58:55','2026-02-22 00:00:00',NULL,242760.00,100000.00,0.00,'finalizado',NULL,'Cancelado por el cliente',0,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:57'),(6,11,'2026-03-18 18:22:48','2026-03-11 00:00:00',NULL,1361399.98,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:49'),(7,12,'2026-03-28 17:27:23','2026-03-30 00:00:00',NULL,4046000.00,1000000.00,0.00,'finalizado',NULL,NULL,1,'2026-03-27 00:00:00','2026-03-27 21:15:56','2026-03-28 22:36:18'),(8,13,'2026-03-28 20:32:57','2026-03-31 00:00:00',NULL,4046000.00,1000000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-03-29 01:31:53','2026-03-29 02:47:02'),(9,14,'2026-03-28 20:38:51','2026-03-30 00:00:00',NULL,3153500.00,1000000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:19'),(10,15,'2026-03-29 09:22:02','2026-03-31 00:00:00',NULL,283220.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-03-29 14:08:47','2026-03-29 14:47:16'),(11,16,'2026-03-29 09:12:49','2026-03-31 00:00:00',NULL,616420.00,100000.00,0.00,'finalizado',NULL,NULL,0,NULL,'2026-03-29 14:08:55','2026-03-29 14:46:17');
/*!40000 ALTER TABLE `alquileres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int DEFAULT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` int DEFAULT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=369 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-19 12:21:10'),(2,1,'CREAR_EMPLEADO','empleados',2,NULL,'{\"email\": \"pepito@vento.com\", \"nombre\": \"pepito\", \"rol_id\": 1, \"apellido\": \"perez\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-19 12:33:45'),(3,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-19 12:41:28'),(4,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 00:20:14'),(5,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 00:38:32'),(6,1,'ACTUALIZAR_EMPLEADO','empleados',1,'{\"email\": \"admin@carpas.com\", \"activo\": 1, \"nombre\": \"Admin\", \"rol_id\": 1, \"apellido\": \"Sistema\"}','{\"email\": \"admin@carpas.com\", \"activo\": 1, \"nombre\": \"Admin\", \"rol_id\": 1, \"apellido\": \"Sistema\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 00:41:11'),(7,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 15:31:14'),(8,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 16:57:51'),(9,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 17:13:18'),(10,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 19:46:08'),(11,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 20:11:37'),(12,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-20 20:32:33'),(13,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 02:00:08'),(14,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 02:17:47'),(15,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 02:39:13'),(16,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 02:59:47'),(17,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 03:21:13'),(18,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 13:55:06'),(19,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:14:04'),(20,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:33:38'),(21,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',5,'{\"estado\": \"pendiente\"}','{\"estado\": \"en_proceso\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:33:46'),(22,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',5,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:47:54'),(23,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:12'),(24,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:14'),(25,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:15'),(26,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:17'),(27,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:18'),(28,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:48:21'),(29,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 14:58:23'),(30,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 16:48:15'),(31,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:29:28'),(32,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:19'),(33,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:22'),(34,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:24'),(35,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:25'),(36,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:27'),(37,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-21 17:32:28'),(38,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-22 01:57:07'),(39,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-25 16:26:56'),(40,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-25 20:48:04'),(41,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-25 21:08:22'),(42,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-26 01:29:51'),(43,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-26 01:46:46'),(44,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-26 12:01:53'),(45,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-26 12:23:37'),(46,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-26 18:33:55'),(47,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-27 15:34:08'),(48,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-27 16:00:07'),(49,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-30 20:53:05'),(50,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-30 21:21:40'),(51,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-31 03:19:11'),(52,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-31 03:36:02'),(53,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-31 15:34:29'),(54,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-31 20:57:02'),(55,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-01-31 21:28:34'),(56,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 00:12:54'),(57,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 00:34:11'),(58,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 00:50:55'),(59,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 01:19:29'),(60,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 02:23:08'),(61,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 14:46:46'),(62,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:03:09'),(63,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',2,'{\"estado\": \"pendiente\"}','{\"estado\": \"cancelado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:08'),(64,1,'ACTUALIZAR_ORDEN','ordenes_trabajo',2,NULL,'{\"notas\": \"Montaje para evento: pachanga (migrado)\", \"prioridad\": \"normal\", \"fecha_programada\": \"2026-01-10T05:00:00\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:21'),(65,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:51'),(66,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:52'),(67,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:53'),(68,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:55'),(69,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:04:58'),(70,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_proceso\"}','{\"estado\": \"cancelado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 15:05:17'),(71,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 16:28:33'),(72,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 17:04:25'),(73,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 17:35:18'),(74,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 18:07:29'),(75,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 18:53:19'),(76,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 19:30:48'),(77,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:02:26'),(78,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',15,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"cancelado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:03:52'),(79,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',9,'{\"estado\": \"pendiente\"}','{\"estado\": \"cancelado\", \"sincronizacion\": {\"mensaje\": \"Alquiler cancelado porque todas las órdenes fueron canceladas\", \"alquiler_id\": 2, \"estado_nuevo\": \"cancelado\", \"sincronizado\": true, \"estado_anterior\": \"programado\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:03:59'),(80,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:05:10'),(81,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:05:11'),(82,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:05:12'),(83,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:05:12'),(84,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:05:13'),(85,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:12:52'),(86,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:12:53'),(87,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:31:40'),(88,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 21:50:51'),(89,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 22:42:48'),(90,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 22:44:17'),(91,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 22:44:18'),(92,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"cancelado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 22:44:28'),(93,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-03 23:32:21'),(94,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-04 01:18:39'),(95,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-05 02:46:53'),(96,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-05 03:02:55'),(97,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-05 03:36:00'),(98,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-06 03:14:00'),(99,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 14:07:34'),(100,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 14:08:27'),(101,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 14:08:33'),(102,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 14:08:37'),(103,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 14:08:38'),(104,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:02:42'),(105,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:04:31'),(106,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:04:34'),(107,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:04:37'),(108,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:04:38'),(109,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 15:58:58'),(110,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-07 16:19:15'),(111,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:37:11'),(112,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:38:01'),(113,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:38:02'),(114,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"cancelado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:38:23'),(115,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:54:45'),(116,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:25'),(117,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:26'),(118,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:28'),(119,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:36'),(120,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:38'),(121,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:40'),(122,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 02:55:41'),(123,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 14:01:26'),(124,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:10:44'),(125,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:25:30'),(126,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:25:31'),(127,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:25:36'),(128,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:25:54'),(129,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:26:16'),(130,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:26:20'),(131,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:26:24'),(132,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:26:26'),(133,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 16:50:59'),(134,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:01:52'),(135,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:01:53'),(136,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:01:56'),(137,1,'ACTUALIZAR_ORDEN','ordenes_trabajo',20,NULL,'{\"notas\": \"Desmontaje para evento: boda para febrero 2\", \"prioridad\": \"normal\", \"fecha_programada\": \"2026-02-12T10:00:00\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:02:16'),(138,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:02:36'),(139,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:02:40'),(140,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:02:42'),(141,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:02:46'),(142,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:07:10'),(143,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 17:51:59'),(144,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-08 19:42:46'),(145,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 00:51:18'),(146,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:13:09'),(147,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:17:11'),(148,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:17:14'),(149,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:17:20'),(150,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:28:37'),(151,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:29:01'),(152,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:29:05'),(153,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:29:08'),(154,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:29:09'),(155,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 01:47:29'),(156,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 11:33:57'),(157,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 12:09:59'),(158,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 12:35:47'),(159,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 12:53:40'),(160,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-09 13:20:43'),(161,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 02:48:07'),(162,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 03:06:07'),(163,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',24,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 03:07:02'),(164,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',24,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 03:07:04'),(165,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 23:27:16'),(166,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 23:28:26'),(167,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 23:28:35'),(168,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 23:28:44'),(169,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-10 23:51:07'),(170,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-12 23:37:35'),(171,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',24,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-12 23:37:58'),(172,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',24,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-12 23:37:59'),(173,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-13 00:19:01'),(174,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-13 01:02:57'),(175,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-13 01:38:05'),(176,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-13 05:18:09'),(177,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 13:19:49'),(178,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 19:07:50'),(179,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 20:52:07'),(180,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 03:34:32'),(181,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 12:19:22'),(182,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 17:56:04'),(183,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 18:18:08'),(184,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 18:44:19'),(185,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 19:38:18'),(186,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-15 19:58:16'),(187,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 02:41:36'),(188,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 03:22:36'),(189,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 03:48:57'),(190,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 03:55:50'),(191,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 03:55:53'),(192,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 04:05:59'),(193,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',1,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 04:06:38'),(194,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 05:20:57'),(195,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',2,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 05:21:46'),(196,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',2,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 05:21:48'),(197,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',2,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 05:21:50'),(198,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',2,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 05:21:52'),(199,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 12:12:57'),(200,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-16 13:42:14'),(201,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 21:59:45'),(202,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 22:37:27'),(203,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 22:52:39'),(204,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 23:12:39'),(205,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:16:17'),(206,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:25:54'),(207,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:26:02'),(208,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',3,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:27:04'),(209,1,'ACTUALIZAR_ORDEN','ordenes_trabajo',4,NULL,'{\"notas\": \"Desmontaje para evento: evento de prueba 1\", \"prioridad\": \"normal\", \"fecha_programada\": \"2026-02-18T09:00:00\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:28:15'),(210,1,'ACTUALIZAR_ORDEN','ordenes_trabajo',4,NULL,'{\"notas\": \"Desmontaje para evento: evento de prueba 1\", \"prioridad\": \"normal\", \"fecha_programada\": \"2026-02-18T09:00:00\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:28:29'),(211,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:46:53'),(212,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:47:13'),(213,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:47:20'),(214,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 00:47:36'),(215,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:02:12'),(216,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',4,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:02:19'),(217,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:27:15'),(218,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',5,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:11'),(219,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',5,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:12'),(220,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',5,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:30'),(221,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:52'),(222,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:53'),(223,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:54'),(224,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:31:55'),(225,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:32:03'),(226,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:32:15'),(227,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:32:20'),(228,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',6,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 3, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:32:34'),(229,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:43:08'),(230,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',7,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:44:45'),(231,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',7,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:44:54'),(232,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',7,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:15'),(233,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:45'),(234,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:46'),(235,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:48'),(236,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:50'),(237,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:45:55'),(238,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:46:12'),(239,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:46:14'),(240,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',8,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 4, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-18 01:46:29'),(241,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-19 21:43:39'),(242,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-19 22:20:54'),(243,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-19 22:42:49'),(244,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-19 22:59:45'),(245,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-19 23:21:17'),(246,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:15:52'),(247,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:41:10'),(248,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:58:40'),(249,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',9,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:59:31'),(250,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',9,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:59:32'),(251,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',9,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 16:59:37'),(252,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-20 17:00:26'),(253,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-21 02:42:56'),(254,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-04 02:12:49'),(255,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-04 22:53:02'),(256,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-04 23:19:33'),(257,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-04 23:39:55'),(258,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-05 01:09:39'),(259,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-05 11:21:37'),(260,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-05 11:39:48'),(261,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-05 12:45:48'),(262,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-06 02:18:19'),(263,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-06 02:49:46'),(264,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-06 03:30:19'),(265,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-06 13:38:00'),(266,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-06 15:03:59'),(267,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 02:56:24'),(268,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:16:18'),(269,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:16:34'),(270,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:16:36'),(271,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:16:38'),(272,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:16:40'),(273,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:17:29'),(274,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:17:35'),(275,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',10,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 5, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:17:57'),(276,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-07 03:31:43'),(277,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-10 00:04:41'),(278,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36','2026-03-10 00:21:48'),(279,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-18 22:35:57'),(280,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-18 23:15:50'),(281,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36','2026-03-18 23:22:52'),(282,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36','2026-03-18 23:22:54'),(283,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-18 23:31:17'),(284,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',11,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-18 23:31:45'),(285,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:58:20'),(286,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:58:58'),(287,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:01'),(288,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:04'),(289,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:07'),(290,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:09'),(291,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:31'),(292,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-19 01:59:33'),(293,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-21 15:10:18'),(294,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',12,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 6, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-21 15:10:49'),(295,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-21 15:31:23'),(296,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-24 01:05:41'),(297,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-24 01:36:14'),(298,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-27 14:47:41'),(299,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:27:57'),(300,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:28:06'),(301,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',13,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-03-28 22:28:58'),(302,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:35:21'),(303,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:35:42'),(304,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:35:44'),(305,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:35:45'),(306,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:35:46'),(307,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:36:02'),(308,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:36:04'),(309,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',14,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 7, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-28 22:36:18'),(310,1,'LOGIN',NULL,NULL,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:26:31'),(311,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',15,NULL,'{\"empleados\": [{\"empleado_id\": 5, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:32:26'),(312,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',15,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:33:00'),(313,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',15,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:33:01'),(314,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',15,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:33:08'),(315,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',17,NULL,'{\"empleados\": [{\"empleado_id\": 3, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:38:26'),(316,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:38:57'),(317,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','2026-03-29 01:39:22'),(318,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',17,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:39:46'),(319,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',18,NULL,'{\"empleados\": [{\"empleado_id\": 5, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:40:59'),(320,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:41:04'),(321,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:41:08'),(322,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:41:10'),(323,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:41:12'),(324,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:41:19'),(325,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:42:57'),(326,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:43:04'),(327,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',18,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 9, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:43:19'),(328,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',16,NULL,'{\"empleados\": [{\"empleado_id\": 7, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 01:56:50'),(329,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:42:52'),(330,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:42:53'),(331,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:42:56'),(332,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:42:59'),(333,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:43:05'),(334,1,'GENERAR_ORDEN_MANTENIMIENTO','ordenes_trabajo',19,NULL,'{\"orden_origen\": 16, \"elementos_danados\": 1}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:46:31'),(335,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:46:37'),(336,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:46:38'),(337,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',16,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 8, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:47:02'),(338,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',19,NULL,'{\"empleados\": [{\"empleado_id\": 5, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:47:17'),(339,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:47:19'),(340,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 02:47:19'),(341,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',19,NULL,'{\"empleados\": [{\"empleado_id\": 3, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 03:10:25'),(342,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',19,NULL,'{\"empleados\": [{\"empleado_id\": 7, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 03:11:26'),(343,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_revision\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 03:15:26'),(344,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',19,'{\"estado\": \"en_revision\"}','{\"estado\": \"en_reparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 03:15:29'),(345,1,'COMPLETAR_MANTENIMIENTO','ordenes_trabajo',19,NULL,'{\"reparados\": 1, \"no_reparables\": 0}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 03:21:00'),(346,1,'ASIGNAR_EQUIPO_ORDEN','orden_trabajo_equipo',22,NULL,'{\"empleados\": [{\"empleado_id\": 5, \"rol_en_orden\": \"responsable\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:09:24'),(347,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:12:52'),(348,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:12:53'),(349,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',22,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:12:56'),(350,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:22:03'),(351,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:22:04'),(352,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',20,'{\"estado\": \"en_proceso\"}','{\"estado\": \"completado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:22:10'),(353,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:45:51'),(354,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:45:52'),(355,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:45:53'),(356,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:45:53'),(357,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:45:54'),(358,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:04'),(359,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:04'),(360,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',23,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 11, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:17'),(361,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"pendiente\"}','{\"estado\": \"confirmado\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:52'),(362,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"confirmado\"}','{\"estado\": \"en_preparacion\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:54'),(363,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_preparacion\"}','{\"estado\": \"en_ruta\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:55'),(364,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_ruta\"}','{\"estado\": \"en_sitio\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:56'),(365,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_sitio\"}','{\"estado\": \"en_proceso\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:46:57'),(366,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_proceso\"}','{\"estado\": \"en_retorno\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:47:06'),(367,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"en_retorno\"}','{\"estado\": \"descargue\", \"sincronizacion\": null}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:47:07'),(368,1,'CAMBIAR_ESTADO_ORDEN','ordenes_trabajo',21,'{\"estado\": \"descargue\"}','{\"estado\": \"completado\", \"sincronizacion\": {\"mensaje\": \"Alquiler finalizado por completar orden de desmontaje\", \"alquiler_id\": 10, \"estado_nuevo\": \"finalizado\", \"sincronizado\": true, \"estado_anterior\": \"activo\"}}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-03-29 14:47:16');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_auth`
--

DROP TABLE IF EXISTS `auditoria_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria_auth` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int DEFAULT NULL,
  `accion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `detalles` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `auditoria_auth_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_auth`
--

LOCK TABLES `auditoria_auth` WRITE;
/*!40000 ALTER TABLE `auditoria_auth` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `emoji` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `padre_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categorias_nombre` (`nombre`),
  KEY `idx_categorias_padre_id` (`padre_id`),
  KEY `idx_categorias_padre_nombre` (`padre_id`,`nombre`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`padre_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Telas','Tent',NULL,'2025-10-14 22:38:24'),(15,'telas sperry','Tent',1,'2025-11-03 02:11:53'),(17,'anclaje','?',NULL,'2025-11-03 14:24:19'),(19,'camiones','?',NULL,'2025-11-10 01:12:12'),(20,'madera','?',NULL,'2025-11-10 01:59:03'),(21,'herramientas','⚒️',NULL,'2025-11-16 01:46:56'),(23,'camion pequeño','?',19,'2025-11-16 03:33:52'),(25,'estaca metalica','?',17,'2025-11-29 02:03:57'),(27,'mastiles octagonales','?',20,'2025-12-13 01:03:24'),(28,'postes perimetrales octagonales 2.30m','?',20,'2025-12-27 18:43:47'),(29,'mazos','?',21,'2025-12-27 21:22:08'),(30,'reata blanca','⛓️',17,'2025-12-28 17:14:23'),(31,'banderas','?️',NULL,'2025-12-28 17:17:48'),(32,'bandera carpa sperry','?️',31,'2025-12-28 17:18:19'),(33,'tubo para bandera','?',31,'2025-12-28 17:18:41'),(34,'bamboos','?',20,'2025-12-28 17:22:29'),(35,'luces','?',NULL,'2025-12-28 17:26:26'),(36,'bombillo ping pong','?',35,'2025-12-28 17:26:43'),(37,'extencion con rosetas e12','?',35,'2025-12-28 17:28:13'),(38,'capuchones','CircleDot',NULL,'2025-12-28 17:32:32'),(39,'capuchon blanco','Landmark',38,'2025-12-28 17:32:45'),(40,'matera','?',17,'2025-12-28 23:31:57'),(43,'estructuras parasoles','☔',NULL,'2026-01-04 19:56:08'),(44,'estructura parasol 2.50','☔',43,'2026-01-04 19:57:01'),(45,'estructura parasol 3.50','☔',43,'2026-01-04 20:03:09'),(46,'telas parasol','☔',NULL,'2026-01-04 20:05:32'),(47,'telas parasol 2.50','☔',46,'2026-01-04 20:06:17'),(48,'cenefa blanca completa 2.50','☔',46,'2026-01-04 20:08:02'),(49,'bases parasol','☔',NULL,'2026-01-04 20:12:57'),(50,'bases parasol 2.50','☔',49,'2026-01-04 20:13:30'),(51,'mesas redondas','?',NULL,'2026-01-04 20:22:28'),(52,'mesa redonda 2.50 con soporte parasol','?',51,'2026-01-04 20:24:40'),(53,'capuchon transparente','Landmark',38,'2026-01-12 15:36:33'),(55,'bloques concreto','?',17,'2026-01-13 14:39:22');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_productos`
--

DROP TABLE IF EXISTS `categorias_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_padre_id` int DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `emoji` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categoria_padre` (`categoria_padre_id`),
  CONSTRAINT `fk_categoria_padre` FOREIGN KEY (`categoria_padre_id`) REFERENCES `categorias_productos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_productos`
--

LOCK TABLES `categorias_productos` WRITE;
/*!40000 ALTER TABLE `categorias_productos` DISABLE KEYS */;
INSERT INTO `categorias_productos` VALUES (1,3,'carpa p10','carpas de 10 m diametro origen americano marca sperry tents','⛺',1,'2025-12-28 18:09:13','2026-01-06 00:04:42'),(2,4,'parasoles','parasoles para alquiler','☔',1,'2026-01-04 20:15:14','2026-01-06 00:06:49'),(3,NULL,'Carpas',NULL,'Tent',1,'2026-01-06 00:04:42','2026-01-06 13:29:45'),(4,NULL,'Parasoles','Parasoles y sombrillas para alquiler','☂️',1,'2026-01-06 00:04:42','2026-01-06 00:04:42'),(5,3,'carpa 6x9','carpa de 6x9 estilo sperry tents','⛺',1,'2026-03-29 03:29:31','2026-03-29 03:29:31');
/*!40000 ALTER TABLE `categorias_productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ciudades`
--

DROP TABLE IF EXISTS `ciudades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciudades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento_id` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ciudad_nombre` (`nombre`),
  KEY `idx_ciudad_departamento_id` (`departamento_id`),
  CONSTRAINT `fk_ciudad_departamento` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciudades`
--

LOCK TABLES `ciudades` WRITE;
/*!40000 ALTER TABLE `ciudades` DISABLE KEYS */;
INSERT INTO `ciudades` VALUES (1,'Tenjo','Cundinamarca',1,1,'2026-01-04 02:54:46','2026-03-24 01:10:28'),(2,'Armenia','Quindio',2,1,'2026-01-04 02:54:46','2026-03-24 01:10:28'),(3,'Pereira','Risaralda',3,1,'2026-01-04 02:54:46','2026-03-24 01:10:28'),(6,'Bogotá','Bogotá',4,1,'2026-01-05 13:05:02','2026-03-24 01:10:28');
/*!40000 ALTER TABLE `ciudades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('CC','NIT','CE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CC',
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_documento` (`tipo_documento`,`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'CC','1234567766','Luisa Bulla','31111122233','lubu@gmail.com','carraquilla','tenjo',NULL,1,'2026-01-02 14:59:13','2026-01-02 14:59:13'),(2,'CC','107837222','Anderson Moreno Rodriguez','3204145566','anchi@gmail.com','hacienda los laureles/ Carrasquilla','Tenjo',NULL,1,'2026-01-12 15:41:54','2026-01-12 15:41:54'),(3,'CC','0254564','pedro perez','0000000000','pedro@gmail.com','calle100#23-45','bogota',NULL,1,'2026-03-27 14:55:01','2026-03-27 14:55:01');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compuesto_componentes`
--

DROP TABLE IF EXISTS `compuesto_componentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compuesto_componentes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compuesto_id` int NOT NULL,
  `elemento_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `tipo` enum('fijo','alternativa','adicional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'fijo',
  `grupo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_default` tinyint(1) DEFAULT '0',
  `precio_adicional` decimal(12,2) DEFAULT '0.00',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `compuesto_id` (`compuesto_id`),
  KEY `elemento_id` (`elemento_id`),
  CONSTRAINT `compuesto_componentes_ibfk_1` FOREIGN KEY (`compuesto_id`) REFERENCES `elementos_compuestos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compuesto_componentes_ibfk_2` FOREIGN KEY (`elemento_id`) REFERENCES `elementos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compuesto_componentes`
--

LOCK TABLES `compuesto_componentes` WRITE;
/*!40000 ALTER TABLE `compuesto_componentes` DISABLE KEYS */;
INSERT INTO `compuesto_componentes` VALUES (64,12,33,180,'fijo',NULL,0,0.00,0,'2026-01-04 19:50:56'),(65,12,34,3,'fijo',NULL,0,0.00,1,'2026-01-04 19:50:56'),(66,13,39,1,'fijo',NULL,0,0.00,0,'2026-01-04 20:30:36'),(67,13,42,1,'fijo',NULL,0,0.00,1,'2026-01-04 20:30:36'),(68,13,46,1,'alternativa','bases parasol',0,100000.00,2,'2026-01-04 20:30:36'),(69,13,45,1,'alternativa','bases parasol',1,0.00,3,'2026-01-04 20:30:36'),(70,13,44,6,'alternativa','cenefas',1,0.00,4,'2026-01-04 20:30:36'),(73,10,31,1,'fijo',NULL,0,0.00,0,'2026-01-13 14:53:58'),(74,10,35,1,'fijo',NULL,0,0.00,1,'2026-01-13 14:53:58'),(75,10,27,1,'fijo',NULL,0,0.00,2,'2026-01-13 14:53:58'),(76,10,32,10,'fijo',NULL,0,0.00,3,'2026-01-13 14:53:58'),(77,10,26,1,'fijo',NULL,0,0.00,4,'2026-01-13 14:53:58'),(78,10,28,11,'fijo',NULL,0,0.00,5,'2026-01-13 14:53:58'),(79,10,30,1,'fijo',NULL,0,0.00,6,'2026-01-13 14:53:58'),(80,10,19,11,'alternativa','anclajes',1,0.00,7,'2026-01-13 14:53:58'),(81,10,21,11,'alternativa','anclajes',0,0.00,8,'2026-01-13 14:53:58'),(82,10,29,1,'alternativa','banderas',1,0.00,9,'2026-01-13 14:53:58'),(83,10,50,1,'alternativa','banderas',0,100000.00,10,'2026-01-13 14:53:58'),(84,10,33,100,'adicional',NULL,0,1000.00,11,'2026-01-13 14:53:58'),(85,10,34,4,'adicional',NULL,0,5000.00,12,'2026-01-13 14:53:58'),(86,14,49,16,'fijo',NULL,0,0.00,0,'2026-01-13 14:54:55'),(87,14,48,1,'fijo',NULL,0,0.00,1,'2026-01-13 14:54:55');
/*!40000 ALTER TABLE `compuesto_componentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_alquileres`
--

DROP TABLE IF EXISTS `configuracion_alquileres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_alquileres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('numero','porcentaje','texto','booleano') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'texto',
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_config_categoria` (`categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_alquileres`
--

LOCK TABLES `configuracion_alquileres` WRITE;
/*!40000 ALTER TABLE `configuracion_alquileres` DISABLE KEYS */;
INSERT INTO `configuracion_alquileres` VALUES (1,'dias_gratis_montaje','2','numero','Días gratis antes del evento para montaje','dias_extra',1,'2026-01-25 20:46:25','2026-01-25 20:46:25'),(2,'dias_gratis_desmontaje','1','numero','Días gratis después del evento para desmontaje','dias_extra',2,'2026-01-25 20:46:25','2026-01-25 20:46:25'),(3,'porcentaje_dias_extra','20','porcentaje','Porcentaje de recargo por día extra sobre productos','dias_extra',3,'2026-01-25 20:46:25','2026-02-09 12:33:19'),(4,'porcentaje_iva','19','porcentaje','Porcentaje de IVA (Colombia)','impuestos',1,'2026-01-25 20:46:25','2026-01-25 20:46:25'),(5,'aplicar_iva','true','booleano','Aplicar IVA a las cotizaciones','impuestos',2,'2026-01-25 20:46:25','2026-01-25 20:46:25'),(6,'vigencia_cotizacion_dias','30','numero','Días de vigencia por defecto para cotizaciones','cotizaciones',1,'2026-01-25 20:46:25','2026-02-20 16:54:50'),(7,'empresa_nombre','carpas vento','texto','Nombre de la empresa para documentos','empresa',1,'2026-01-25 20:46:25','2026-02-20 16:52:54'),(8,'empresa_nit','111222333','texto','NIT de la empresa','empresa',2,'2026-01-25 20:46:25','2026-02-03 17:37:05'),(9,'empresa_direccion','calle falsa # 123','texto','Dirección de la empresa','empresa',3,'2026-01-25 20:46:25','2026-02-03 17:37:05'),(10,'empresa_telefono','3214456697','texto','Teléfono de contacto','empresa',4,'2026-01-25 20:46:25','2026-02-03 17:37:05'),(11,'empresa_email','cotizaciones@alquilerdecarpas.com','texto','Email de contacto','empresa',5,'2026-01-25 20:46:25','2026-02-03 17:37:05'),(13,'empresa_logo','/uploads/logos/logo_empresa.jpg','texto','Logo de la empresa para documentos','empresa',0,'2026-02-03 16:31:53','2026-02-03 17:36:06'),(14,'dias_advertencia_vencimiento_cotizacion','3','numero','Dias antes del vencimiento para mostrar advertencia','seguimiento',1,'2026-02-14 18:54:07','2026-02-14 18:54:07'),(15,'dias_seguimiento_borrador','7','numero','Dias sin actividad en borrador para generar alerta','seguimiento',2,'2026-02-14 18:54:07','2026-02-14 18:54:07'),(16,'dias_seguimiento_pendiente','5','numero','Dias sin atencion en cotizacion pendiente para generar alerta','seguimiento',3,'2026-02-14 18:54:07','2026-02-14 18:54:07'),(17,'habilitar_seguimiento_cotizaciones','true','booleano','Habilitar alertas de seguimiento de cotizaciones','seguimiento',4,'2026-02-14 18:54:07','2026-02-14 18:54:07');
/*!40000 ALTER TABLE `configuracion_alquileres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_descuentos`
--

DROP TABLE IF EXISTS `cotizacion_descuentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_descuentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `descuento_id` int DEFAULT NULL,
  `tipo` enum('porcentaje','fijo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `monto_calculado` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cotizacion_descuentos_cotizacion` (`cotizacion_id`),
  KEY `idx_cotizacion_descuentos_descuento` (`descuento_id`),
  CONSTRAINT `fk_cotizacion_descuentos_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cotizacion_descuentos_descuento` FOREIGN KEY (`descuento_id`) REFERENCES `descuentos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_descuentos`
--

LOCK TABLES `cotizacion_descuentos` WRITE;
/*!40000 ALTER TABLE `cotizacion_descuentos` DISABLE KEYS */;
INSERT INTO `cotizacion_descuentos` VALUES (3,1,2,'porcentaje',15.00,0.00,'Para clientes con más de 3 eventos realizados','2026-02-16 03:40:11'),(4,4,2,'porcentaje',15.00,0.00,'Para clientes con más de 3 eventos realizados','2026-02-18 01:29:06'),(5,5,1,'porcentaje',20.00,118000.00,'Descuento especial para familiares y amigos cercanos','2026-02-18 01:41:55'),(6,6,1,'porcentaje',20.00,68000.00,'Descuento especial para familiares y amigos cercanos','2026-02-20 16:35:56'),(7,15,2,'porcentaje',15.00,51000.00,'Para clientes con más de 3 eventos realizados','2026-03-29 14:01:51'),(8,16,2,'porcentaje',15.00,111000.00,'Para clientes con más de 3 eventos realizados','2026-03-29 14:08:12');
/*!40000 ALTER TABLE `cotizacion_descuentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_detalles`
--

DROP TABLE IF EXISTS `cotizacion_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `cotizacion_producto_id` int DEFAULT NULL,
  `elemento_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `precio_unitario` decimal(12,2) DEFAULT '0.00',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `grupo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('fijo','alternativa','adicional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'fijo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cotizacion_id` (`cotizacion_id`),
  KEY `elemento_id` (`elemento_id`),
  KEY `idx_cotdet_producto` (`cotizacion_producto_id`),
  CONSTRAINT `cotizacion_detalles_ibfk_1` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cotizacion_detalles_ibfk_2` FOREIGN KEY (`elemento_id`) REFERENCES `elementos` (`id`),
  CONSTRAINT `fk_cotdet_producto` FOREIGN KEY (`cotizacion_producto_id`) REFERENCES `cotizacion_productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_detalles`
--

LOCK TABLES `cotizacion_detalles` WRITE;
/*!40000 ALTER TABLE `cotizacion_detalles` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotizacion_detalles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_producto_recargos`
--

DROP TABLE IF EXISTS `cotizacion_producto_recargos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_producto_recargos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_producto_id` int NOT NULL,
  `tipo` enum('adelanto','extension') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dias` int NOT NULL DEFAULT '1',
  `porcentaje` decimal(5,2) NOT NULL DEFAULT '20.00',
  `monto_recargo` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fecha_original` date DEFAULT NULL,
  `fecha_modificada` date DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recargo_producto` (`cotizacion_producto_id`),
  KEY `idx_recargo_tipo` (`tipo`),
  CONSTRAINT `cotizacion_producto_recargos_ibfk_1` FOREIGN KEY (`cotizacion_producto_id`) REFERENCES `cotizacion_productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_producto_recargos`
--

LOCK TABLES `cotizacion_producto_recargos` WRITE;
/*!40000 ALTER TABLE `cotizacion_producto_recargos` DISABLE KEYS */;
INSERT INTO `cotizacion_producto_recargos` VALUES (1,13,'extension',3,20.00,204012.60,'2026-03-11',NULL,NULL,'2026-03-10 00:10:45');
/*!40000 ALTER TABLE `cotizacion_producto_recargos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_productos`
--

DROP TABLE IF EXISTS `cotizacion_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `compuesto_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `precio_base` decimal(12,2) DEFAULT '0.00',
  `deposito` decimal(12,2) DEFAULT '0.00',
  `precio_adicionales` decimal(12,2) DEFAULT '0.00',
  `descuento_porcentaje` decimal(5,2) DEFAULT '0.00',
  `descuento_monto` decimal(12,2) DEFAULT '0.00',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `total_recargos` decimal(12,2) DEFAULT '0.00',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cotprod_cotizacion` (`cotizacion_id`),
  KEY `idx_cotprod_compuesto` (`compuesto_id`),
  KEY `idx_cotprod_cotizacion_compuesto` (`cotizacion_id`,`compuesto_id`),
  CONSTRAINT `fk_cotprod_compuesto` FOREIGN KEY (`compuesto_id`) REFERENCES `elementos_compuestos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cotprod_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_productos`
--

LOCK TABLES `cotizacion_productos` WRITE;
/*!40000 ALTER TABLE `cotizacion_productos` DISABLE KEYS */;
INSERT INTO `cotizacion_productos` VALUES (3,1,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-02-16 03:40:11'),(5,3,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-02-17 23:13:58'),(7,4,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-02-18 01:29:06'),(8,5,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-02-18 01:41:55'),(9,6,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-02-20 16:35:56'),(10,7,13,1,12000.00,100000.00,0.00,0.00,0.00,12000.00,0.00,NULL,'2026-02-20 16:51:19'),(13,11,13,1,340021.00,100000.00,0.00,0.00,0.00,340021.00,204012.60,NULL,'2026-03-10 00:10:45'),(15,12,10,1,3000000.00,1000000.00,0.00,0.00,0.00,3000000.00,0.00,NULL,'2026-03-27 21:15:36'),(16,13,10,1,3000000.00,1000000.00,0.00,0.00,0.00,3000000.00,0.00,NULL,'2026-03-29 01:31:40'),(17,14,10,1,3000000.00,1000000.00,0.00,20.00,600000.00,2400000.00,0.00,NULL,'2026-03-29 01:37:01'),(18,15,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-03-29 14:01:51'),(19,16,13,1,340000.00,100000.00,0.00,0.00,0.00,340000.00,0.00,NULL,'2026-03-29 14:08:12');
/*!40000 ALTER TABLE `cotizacion_productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizacion_transportes`
--

DROP TABLE IF EXISTS `cotizacion_transportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizacion_transportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `tarifa_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cottrans_tarifa` (`tarifa_id`),
  KEY `idx_cottrans_cotizacion` (`cotizacion_id`),
  CONSTRAINT `fk_cottrans_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cottrans_tarifa` FOREIGN KEY (`tarifa_id`) REFERENCES `tarifas_transporte` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizacion_transportes`
--

LOCK TABLES `cotizacion_transportes` WRITE;
/*!40000 ALTER TABLE `cotizacion_transportes` DISABLE KEYS */;
INSERT INTO `cotizacion_transportes` VALUES (3,1,4,1,600000.00,600000.00,NULL,'2026-02-16 03:40:11'),(4,3,4,1,600000.00,600000.00,NULL,'2026-02-17 23:13:58'),(5,4,4,1,600000.00,600000.00,NULL,'2026-02-18 01:29:06'),(6,5,12,1,250000.00,250000.00,NULL,'2026-02-18 01:41:55'),(7,7,4,1,600000.00,600000.00,NULL,'2026-02-20 16:51:19'),(8,11,4,1,600000.00,600000.00,NULL,'2026-03-10 00:10:45'),(10,12,16,1,400000.00,400000.00,NULL,'2026-03-27 21:15:36'),(11,13,16,1,400000.00,400000.00,NULL,'2026-03-29 01:31:40'),(12,14,12,1,250000.00,250000.00,NULL,'2026-03-29 01:37:01'),(13,16,16,1,400000.00,400000.00,NULL,'2026-03-29 14:08:12');
/*!40000 ALTER TABLE `cotizacion_transportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotizaciones`
--

DROP TABLE IF EXISTS `cotizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotizaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `evento_id` int DEFAULT NULL,
  `fecha_evento` date DEFAULT NULL,
  `fecha_desmontaje` date DEFAULT NULL,
  `dias_desmontaje_extra` int DEFAULT '0',
  `porcentaje_dias_extra` decimal(5,2) DEFAULT '15.00',
  `cobro_dias_extra` decimal(12,2) DEFAULT '0.00',
  `evento_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evento_direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ubicacion_id` int DEFAULT NULL,
  `evento_ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_montaje` date DEFAULT NULL,
  `dias_montaje_extra` int DEFAULT '0',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `subtotal_productos` decimal(12,2) DEFAULT '0.00',
  `subtotal_transporte` decimal(12,2) DEFAULT '0.00',
  `descuento` decimal(12,2) DEFAULT '0.00',
  `total_descuentos` decimal(12,2) DEFAULT '0.00',
  `base_gravable` decimal(12,2) DEFAULT '0.00',
  `porcentaje_iva` decimal(5,2) DEFAULT '19.00',
  `valor_iva` decimal(12,2) DEFAULT '0.00',
  `cobrar_deposito` tinyint(1) NOT NULL DEFAULT '1',
  `valor_deposito` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) DEFAULT '0.00',
  `estado` enum('borrador','pendiente','aprobada','rechazada','vencida') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fechas_confirmadas` tinyint(1) DEFAULT '1',
  `ultimo_seguimiento` datetime DEFAULT NULL,
  `notas_seguimiento` text COLLATE utf8mb4_unicode_ci,
  `vigencia_dias` int DEFAULT '15',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cotizaciones_fecha_evento` (`fecha_evento`),
  KEY `idx_cotizaciones_estado` (`estado`),
  KEY `idx_cotizaciones_cliente_estado` (`cliente_id`,`estado`),
  KEY `idx_cotizacion_evento` (`evento_id`),
  KEY `idx_cotizaciones_ubicacion` (`ubicacion_id`),
  CONSTRAINT `cotizaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_cotizacion_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cotizaciones_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotizaciones`
--

LOCK TABLES `cotizaciones` WRITE;
/*!40000 ALTER TABLE `cotizaciones` DISABLE KEYS */;
INSERT INTO `cotizaciones` VALUES (1,2,1,'2026-02-16','2026-02-17',0,20.00,0.00,'evento de prueba 1','Carrera 15 #8-30, Barrio Industrial',NULL,'Armenia','2026-02-16',0,940000.00,340000.00,600000.00,141000.00,141000.00,799000.00,19.00,151810.00,1,100000.00,950810.00,'aprobada',1,NULL,NULL,15,NULL,'2026-02-16 02:56:22','2026-02-16 03:48:17'),(3,2,4,'2026-02-18','2026-02-18',0,20.00,0.00,'evento de prueba 1','Carrera 15 #8-30, Barrio Industrial',NULL,'Armenia','2026-02-18',0,940000.00,340000.00,600000.00,0.00,0.00,940000.00,19.00,178600.00,1,100000.00,1118600.00,'aprobada',1,NULL,NULL,15,'Repetición del evento original #1','2026-02-17 23:13:03','2026-02-18 00:19:55'),(4,2,5,'2026-02-18','2026-02-18',0,20.00,0.00,'evento de prueba 1','Carrera 15 #8-30, Barrio Industrial',NULL,'Armenia','2026-02-18',0,940000.00,340000.00,600000.00,141000.00,141000.00,799000.00,19.00,151810.00,1,100000.00,950810.00,'aprobada',1,NULL,NULL,15,'Repetición del evento original #1','2026-02-18 01:27:58','2026-02-18 01:29:31'),(5,1,6,'2026-02-21','2026-02-22',0,20.00,0.00,'revelacion de genero Nia','Vereda Carrasquilla',NULL,'Tenjo','2026-02-20',0,590000.00,340000.00,250000.00,118000.00,236000.00,354000.00,19.00,67260.00,1,100000.00,421260.00,'aprobada',1,NULL,NULL,15,NULL,'2026-02-18 01:41:55','2026-02-18 01:42:50'),(6,2,8,'2026-02-21','2026-02-22',0,20.00,0.00,'boda de ander','Vereda La Armenia, Km 5 vía a Circasia',NULL,'Armenia','2026-02-21',0,340000.00,340000.00,0.00,68000.00,136000.00,204000.00,19.00,38760.00,1,100000.00,242760.00,'aprobada',1,NULL,NULL,15,NULL,'2026-02-20 16:35:56','2026-02-20 16:38:42'),(7,2,8,'2026-02-21','2026-02-22',0,20.00,0.00,'boda de ander','Vereda La Armenia, Km 5 vía a Circasia',NULL,'Armenia','2026-02-21',0,612000.00,12000.00,600000.00,0.00,0.00,612000.00,19.00,116280.00,1,100000.00,728280.00,'pendiente',1,NULL,NULL,15,NULL,'2026-02-20 16:51:19','2026-02-20 16:51:19'),(11,2,10,'2026-03-11','2026-03-11',0,15.00,0.00,'boda','Vereda La Armenia, Km 5 vía a Circasia',NULL,'Armenia','2026-03-11',0,1144033.60,544033.60,600000.00,0.00,0.00,1144033.60,19.00,217366.38,1,100000.00,1361399.98,'aprobada',1,NULL,NULL,15,NULL,'2026-03-10 00:10:45','2026-03-10 00:11:15'),(12,3,11,'2026-03-27','2026-03-27',0,15.00,0.00,'evento de prueba 1','calle 1 23 40',38,'Bogotá','2026-03-27',0,3400000.00,3000000.00,400000.00,0.00,0.00,3400000.00,19.00,646000.00,1,1000000.00,4046000.00,'aprobada',1,NULL,NULL,15,NULL,'2026-03-27 21:14:23','2026-03-27 21:15:56'),(13,3,12,'2026-03-31','2026-03-31',0,15.00,0.00,'evento de prueba 2','calle 1 23 40',38,'Bogotá','2026-03-31',0,3400000.00,3000000.00,400000.00,0.00,0.00,3400000.00,19.00,646000.00,1,1000000.00,4046000.00,'aprobada',1,NULL,NULL,15,NULL,'2026-03-29 01:31:40','2026-03-29 01:31:53'),(14,1,13,'2026-03-30','2026-03-30',0,15.00,0.00,'baby Shower','Vereda Carrasquilla',39,'Tenjo','2026-03-29',0,2650000.00,2400000.00,250000.00,0.00,0.00,2650000.00,19.00,503500.00,1,1000000.00,3153500.00,'aprobada',1,NULL,NULL,15,NULL,'2026-03-29 01:37:01','2026-03-29 01:38:08'),(15,3,12,'2026-03-31','2026-03-31',0,15.00,0.00,'evento de prueba 2','calle 1 23 40',38,'Bogotá','2026-03-31',0,340000.00,340000.00,0.00,51000.00,102000.00,238000.00,19.00,45220.00,1,100000.00,283220.00,'aprobada',1,NULL,NULL,15,NULL,'2026-03-29 14:01:50','2026-03-29 14:08:47'),(16,3,12,'2026-03-31','2026-03-31',0,15.00,0.00,'evento de prueba 2','calle 1 23 40',38,'Bogotá','2026-03-31',0,740000.00,340000.00,400000.00,111000.00,222000.00,518000.00,19.00,98420.00,1,100000.00,616420.00,'aprobada',1,NULL,NULL,15,NULL,'2026-03-29 14:08:12','2026-03-29 14:08:55');
/*!40000 ALTER TABLE `cotizaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departamento_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
INSERT INTO `departamentos` VALUES (1,'Cundinamarca',1,'2026-03-24 01:08:52','2026-03-24 01:08:52'),(2,'Quindio',1,'2026-03-24 01:08:52','2026-03-24 01:08:52'),(3,'Risaralda',1,'2026-03-24 01:08:52','2026-03-24 01:08:52'),(4,'Bogotá',1,'2026-03-24 01:08:52','2026-03-24 01:08:52'),(9,'Amazonas',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(10,'Antioquia',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(11,'Arauca',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(12,'Atlántico',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(13,'Bogotá D.C.',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(14,'Bolívar',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(15,'Boyacá',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(16,'Caldas',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(17,'Caquetá',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(18,'Casanare',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(19,'Cauca',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(20,'Cesar',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(21,'Chocó',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(22,'Córdoba',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(23,'Guainía',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(24,'Guaviare',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(25,'Huila',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(26,'La Guajira',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(27,'Magdalena',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(28,'Meta',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(29,'Nariño',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(30,'Norte de Santander',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(31,'Putumayo',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(32,'San Andrés y Providencia',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(33,'Santander',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(34,'Sucre',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(35,'Tolima',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(36,'Valle del Cauca',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(37,'Vaupés',1,'2026-03-24 01:16:25','2026-03-24 01:16:25'),(38,'Vichada',1,'2026-03-24 01:16:25','2026-03-24 01:16:25');
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `descuentos`
--

DROP TABLE IF EXISTS `descuentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `descuentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipo` enum('porcentaje','fijo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'porcentaje',
  `valor` decimal(12,2) NOT NULL,
  `valor_minimo_compra` decimal(12,2) DEFAULT '0.00',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_descuentos_activo` (`activo`),
  KEY `idx_descuentos_tipo` (`tipo`),
  KEY `idx_descuentos_vigencia` (`fecha_inicio`,`fecha_fin`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `descuentos`
--

LOCK TABLES `descuentos` WRITE;
/*!40000 ALTER TABLE `descuentos` DISABLE KEYS */;
INSERT INTO `descuentos` VALUES (1,'Familia','Descuento especial para familiares y amigos cercanos','porcentaje',20.00,0.00,NULL,NULL,1,'2026-01-25 18:22:08','2026-01-25 18:22:08'),(2,'Cliente Frecuente','Para clientes con más de 3 eventos realizados','porcentaje',15.00,500000.00,NULL,NULL,1,'2026-01-25 18:22:08','2026-01-25 18:22:08'),(3,'Referido','Descuento por cliente referido por otro cliente','porcentaje',10.00,0.00,NULL,NULL,1,'2026-01-25 18:22:08','2026-01-25 18:22:08'),(4,'Corporativo','Descuento para empresas y eventos corporativos','porcentaje',25.00,1000000.00,NULL,NULL,1,'2026-01-25 18:22:08','2026-01-25 18:22:08'),(5,'Primera Vez','Descuento de bienvenida para nuevos clientes','porcentaje',5.00,0.00,NULL,NULL,1,'2026-01-25 18:22:08','2026-01-25 18:22:08');
/*!40000 ALTER TABLE `descuentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `elemento_incidencias`
--

DROP TABLE IF EXISTS `elemento_incidencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elemento_incidencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_elemento_id` int NOT NULL,
  `tipo` enum('dano_leve','dano_moderado','dano_grave','faltante','error_cantidad','problema_montaje','problema_cliente','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fotos` json DEFAULT NULL,
  `responsable` enum('empresa','cliente','transporte','desconocido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'desconocido',
  `estado` enum('abierta','en_revision','resuelta','cerrada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'abierta',
  `resolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `resuelto_por` int DEFAULT NULL,
  `resuelto_at` datetime DEFAULT NULL,
  `costo_reparacion` decimal(10,2) DEFAULT NULL,
  `cobrar_cliente` tinyint(1) DEFAULT '0',
  `reportado_por` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reportado_por` (`reportado_por`),
  KEY `resuelto_por` (`resuelto_por`),
  KEY `idx_incidencias_orden_elem` (`orden_elemento_id`),
  KEY `idx_incidencias_tipo` (`tipo`),
  KEY `idx_incidencias_estado` (`estado`),
  CONSTRAINT `elemento_incidencias_ibfk_1` FOREIGN KEY (`orden_elemento_id`) REFERENCES `orden_trabajo_elementos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `elemento_incidencias_ibfk_2` FOREIGN KEY (`reportado_por`) REFERENCES `empleados` (`id`),
  CONSTRAINT `elemento_incidencias_ibfk_3` FOREIGN KEY (`resuelto_por`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `elemento_incidencias`
--

LOCK TABLES `elemento_incidencias` WRITE;
/*!40000 ALTER TABLE `elemento_incidencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `elemento_incidencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `elementos`
--

DROP TABLE IF EXISTS `elementos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elementos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text,
  `imagen` varchar(500) DEFAULT NULL,
  `cantidad` int DEFAULT '0',
  `requiere_series` tinyint(1) DEFAULT '0',
  `stock_minimo` int DEFAULT '0',
  `costo_adquisicion` decimal(12,2) DEFAULT NULL,
  `precio_unitario` decimal(12,2) DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `unidad_id` int DEFAULT NULL,
  `estado` enum('nuevo','bueno','mantenimiento','alquilado','dañado','agotado') DEFAULT 'bueno',
  `ubicacion` varchar(200) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_elementos_nombre` (`nombre`),
  KEY `idx_elementos_categoria` (`categoria_id`),
  KEY `idx_elementos_material` (`material_id`),
  KEY `idx_elementos_unidad` (`unidad_id`),
  KEY `idx_elementos_requiere_series` (`requiere_series`),
  KEY `idx_elementos_categoria_nombre` (`categoria_id`,`nombre`),
  CONSTRAINT `elementos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `elementos_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `elementos_ibfk_3` FOREIGN KEY (`unidad_id`) REFERENCES `unidades` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `elementos`
--

LOCK TABLES `elementos` WRITE;
/*!40000 ALTER TABLE `elementos` DISABLE KEYS */;
INSERT INTO `elementos` VALUES (2,'Tubo galvanizado 3m','Tubo de acero galvanizado de 3 metros de longitud',NULL,100,0,0,NULL,NULL,NULL,NULL,NULL,'bueno','Bodega B',NULL,'2025-10-14 22:38:24','2025-10-27 00:17:36'),(10,'Carpa 5x5 Azul','Carpa azul de 5x5 metros',NULL,0,1,0,NULL,NULL,NULL,1,1,'bueno',NULL,NULL,'2025-11-02 00:57:01','2025-11-02 00:57:01'),(12,'camionJACNUY228','Camion doblecabina con capacidad para 3 ton',NULL,0,1,0,NULL,NULL,23,NULL,NULL,'bueno',NULL,NULL,'2025-11-28 23:06:32','2025-11-28 23:06:32'),(19,'estaca 1m','estaca metalica con cabeza doble para anclaje de carpas',NULL,0,0,0,NULL,NULL,25,NULL,NULL,'bueno',NULL,NULL,'2025-11-29 02:28:13','2025-11-29 02:28:13'),(21,'estaca 0.80m',NULL,NULL,0,0,0,NULL,NULL,25,NULL,NULL,'bueno',NULL,NULL,'2025-11-30 15:37:55','2025-11-30 15:37:55'),(24,'estaca 0.50',NULL,NULL,0,0,0,NULL,NULL,25,NULL,NULL,'bueno',NULL,NULL,'2025-12-12 02:40:50','2025-12-12 02:40:50'),(25,'mastil 27','mastil de 27 ft (8.30 m) para el montaje de carpas de tension esperry tents',NULL,0,0,0,NULL,NULL,27,5,NULL,'bueno',NULL,NULL,'2025-12-13 01:04:37','2025-12-13 01:04:37'),(26,'mastil 19','mastil de 19 pies en madera octagonal',NULL,0,0,0,NULL,NULL,27,5,1,'bueno',NULL,NULL,'2025-12-27 18:37:59','2025-12-27 18:37:59'),(27,'p10','carpa en tela nautica de 10 m de diametro',NULL,0,1,0,NULL,NULL,15,1,NULL,'bueno',NULL,NULL,'2025-12-27 21:22:58','2025-12-27 21:22:58'),(28,'reata blanca 3m','reata blanca importada de 2\" con malacate 3 metros de largo',NULL,0,0,0,NULL,NULL,30,4,1,'bueno',NULL,NULL,'2025-12-28 17:15:41','2025-12-28 17:15:41'),(29,'bandera blanca','bandera color blanco con 2 puntos de sujeción para carpas de sperry tents',NULL,0,0,0,NULL,NULL,32,NULL,3,'bueno',NULL,NULL,'2025-12-28 17:20:01','2025-12-28 17:20:01'),(30,'tubo 2\" bandera','tubo en pvc de 2\" / 40 cm ´para la sujecion de la bandera decorativa',NULL,0,0,0,NULL,NULL,33,4,1,'bueno',NULL,NULL,'2025-12-28 17:21:48','2025-12-28 17:21:48'),(31,'bamboo para banderas','bamboo de soporte para poner banderas enla parte superior de la carpa',NULL,0,0,0,NULL,NULL,34,5,NULL,'bueno',NULL,NULL,'2025-12-28 17:23:16','2025-12-28 17:23:16'),(32,'poste perimetral 2.30','poste perimetral para la version baja de las carpas sperry',NULL,0,0,0,NULL,NULL,28,5,1,'bueno',NULL,NULL,'2025-12-28 17:24:45','2025-12-28 17:24:45'),(33,'bombillo ping pong e12','bombillo ping pong de rosca e12',NULL,0,0,0,NULL,NULL,36,4,3,'bueno',NULL,NULL,'2025-12-28 17:27:35','2025-12-28 17:27:35'),(34,'extencion 50 ft','extencion con rosetas e12 (32 rosetas) de 50 pies en color blanco',NULL,0,0,0,NULL,NULL,37,4,NULL,'bueno',NULL,NULL,'2025-12-28 17:29:23','2025-12-28 17:29:23'),(35,'capuchon blanco','capuchon para evitar la entrada de agua a la carpa',NULL,0,0,0,NULL,NULL,39,1,3,'bueno',NULL,NULL,'2025-12-28 17:33:27','2025-12-28 17:33:27'),(37,'matera en madera','matera de 75x75x75 para usar de anclaje en forma de contrapeso',NULL,0,0,0,NULL,NULL,40,5,1,'bueno',NULL,NULL,'2025-12-28 23:34:00','2025-12-28 23:34:00'),(39,'estructura parasol 2.50 herraje metalico','estructura de parasol en madera de herraje metalico y abre por tencion no requiere pin',NULL,0,0,0,NULL,NULL,44,5,3,'bueno',NULL,NULL,'2026-01-04 19:58:36','2026-01-04 19:58:36'),(40,'estructura parasol 2.50 herraje en madera','estructura de parasol 2.50 con her4rajes en madera se abre y sostiene por pin',NULL,0,0,0,NULL,NULL,44,5,3,'bueno',NULL,NULL,'2026-01-04 19:59:49','2026-01-04 19:59:49'),(41,'estructura de parasol 3.50 herraje metalico','estructura de parasol herraje metalico , se sostiene por tension',NULL,0,0,0,NULL,NULL,45,5,3,'bueno',NULL,NULL,'2026-01-04 20:04:54','2026-01-04 20:04:54'),(42,'telas parasol 2.50 blancas','telas de color blanco para parasol 2,50 m',NULL,0,0,0,NULL,NULL,47,6,3,'bueno',NULL,NULL,'2026-01-04 20:07:22','2026-02-15 20:41:45'),(44,'cenefa blanca completa 2.50 - 4m','cenefa completa para parasol de 2.50 m color blanco',NULL,0,0,0,NULL,NULL,48,6,1,'bueno',NULL,NULL,'2026-01-04 20:11:47','2026-01-04 20:11:47'),(45,'bases parasol 2.50 color blanco','base pesada para parasol 2.50 m color blanco',NULL,0,0,0,NULL,NULL,50,2,3,'bueno',NULL,NULL,'2026-01-04 20:14:34','2026-01-04 20:14:34'),(46,'mesa redonda con orificio para parasol de 2.50','mesa redonda con orificio para parasol de 2.50-\nfunciona como base de parasol o base individual',NULL,0,0,0,NULL,NULL,52,5,3,'bueno',NULL,NULL,'2026-01-04 20:26:07','2026-01-04 20:26:07'),(47,'capuchon transparente','capuchon para la punta de las carpas sperry evitan que filtre el agua por la bandera',NULL,20,0,0,NULL,NULL,53,4,6,'bueno',NULL,NULL,'2026-01-12 15:40:10','2026-01-12 15:40:10'),(48,'marco metalico para contrapeso 75x75 cm','marco para el soporte de los bloques de concreto que se usan para contrapeso de las carpas',NULL,32,0,0,NULL,NULL,55,2,3,'bueno',NULL,NULL,'2026-01-13 14:40:56','2026-01-13 14:40:56'),(49,'Bloque concreto 30 kg','Bloque en concreto de 20x20 de 8cm de altura -Peso de 30 kg',NULL,500,0,0,NULL,NULL,55,NULL,NULL,'bueno',NULL,NULL,'2026-01-13 14:42:33','2026-01-13 14:42:33'),(50,'Bandera personalizada',NULL,NULL,12,0,0,NULL,NULL,32,6,3,'bueno',NULL,NULL,'2026-01-13 14:51:27','2026-01-13 14:51:27'),(52,'mastil 21',NULL,NULL,4,0,4,1500000.00,NULL,27,5,NULL,'bueno',NULL,NULL,'2026-03-29 03:26:08','2026-03-29 03:26:08');
/*!40000 ALTER TABLE `elementos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `elementos_compuestos`
--

DROP TABLE IF EXISTS `elementos_compuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elementos_compuestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_id` int NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imagen` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_base` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deposito` decimal(12,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `elementos_compuestos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `elementos_compuestos`
--

LOCK TABLES `elementos_compuestos` WRITE;
/*!40000 ALTER TABLE `elementos_compuestos` DISABLE KEYS */;
INSERT INTO `elementos_compuestos` VALUES (10,1,'carpa p10','carpa-p10',NULL,NULL,3000000.00,1000000.00,1,'2025-12-29 15:36:19','2025-12-29 15:36:19'),(12,1,'iluminacion perimetral p10','perimetrales-p10','iluminacion para el perimetro de carpa p10',NULL,250000.00,0.00,1,'2026-01-04 19:50:56','2026-01-04 19:50:56'),(13,2,'parasol blanco 2.50 m','parasol-2.50','parasol de 2.50 diametro en forma hexagonal color blanco con cenefa intercambiable',NULL,340000.00,100000.00,1,'2026-01-04 20:30:36','2026-01-04 20:30:36'),(14,1,'contrapeso en bloques concreto p10','contrapeso-500kg',NULL,NULL,100000.00,0.00,1,'2026-01-13 14:49:17','2026-01-13 14:54:55');
/*!40000 ALTER TABLE `elementos_compuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleado_notificaciones_config`
--

DROP TABLE IF EXISTS `empleado_notificaciones_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado_notificaciones_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL,
  `conflicto_fecha` tinyint(1) DEFAULT '1',
  `incidencia_elemento` tinyint(1) DEFAULT '1',
  `requiere_aprobacion` tinyint(1) DEFAULT '1',
  `informativa` tinyint(1) DEFAULT '0',
  `push_enabled` tinyint(1) DEFAULT '1',
  `email_enabled` tinyint(1) DEFAULT '1',
  `sms_enabled` tinyint(1) DEFAULT '0',
  `dnd_inicio` time DEFAULT NULL,
  `dnd_fin` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_empleado_config` (`empleado_id`),
  CONSTRAINT `empleado_notificaciones_config_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado_notificaciones_config`
--

LOCK TABLES `empleado_notificaciones_config` WRITE;
/*!40000 ALTER TABLE `empleado_notificaciones_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `empleado_notificaciones_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol_id` int DEFAULT NULL,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `intentos_fallidos` int DEFAULT '0',
  `bloqueado_hasta` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `estado` enum('pendiente','activo','inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `rol_solicitado_id` int DEFAULT NULL,
  `motivo_rechazo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `rol_id` (`rol_id`),
  KEY `rol_solicitado_id` (`rol_solicitado_id`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `empleados_ibfk_2` FOREIGN KEY (`rol_solicitado_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
INSERT INTO `empleados` VALUES (1,'Admin','Sistema','admin@carpas.com','0000000000','$2b$10$a8EcLQ5FzvKXmyb5A3Dv9.p2MGQjtaBmLxwzJ52/LDDnl/6gBPFea',1,'2026-03-29 01:26:31',0,NULL,'2026-01-19 12:20:07','2026-03-29 01:26:31','activo',NULL,NULL),(2,'pepito','perez','pepito@vento.com','3001111111','$2b$10$g0PgHQRhyfN9qMTGnuxOJOLi6b7SEBnX0yjbmzm5NdQEymptzj43S',1,NULL,0,NULL,'2026-01-19 12:33:45','2026-01-19 12:33:45','activo',NULL,NULL),(3,'Carlos','Ramirez','carlos.ramirez@carpas.com','3101234567','$2b$10$etmn.pytTJTcSMDcT/4O.OCqSZa3EuwPP0HnLP/tWIvqRe3n1d36.',4,NULL,0,NULL,'2026-03-28 23:50:31','2026-03-28 23:50:31','activo',NULL,NULL),(4,'Miguel','Torres','miguel.torres@carpas.com','3209876543','$2b$10$Tk2EwkDEzBRgfkBQml1z5OOwbhcj6VLpjmBtxp7kNychTuqq5GAlW',4,NULL,0,NULL,'2026-03-28 23:50:31','2026-03-28 23:50:31','activo',NULL,NULL),(5,'Andres','Lopez','andres.lopez@carpas.com','3154567890','$2b$10$lsGSPNJ3670Ihw4yO9RWkerY2x.ysxu2ME6M1AR.mw8A6hu8/wZGq',4,NULL,0,NULL,'2026-03-28 23:50:31','2026-03-28 23:50:31','activo',NULL,NULL),(6,'Jorge','Martinez','jorge.martinez@carpas.com','3187654321','$2b$10$Bb9VDygqbE0C2WczWdGC0uCC26wueoWENKitWwbX3vIXT5gZJYuUa',5,NULL,0,NULL,'2026-03-28 23:50:31','2026-03-28 23:50:31','activo',NULL,NULL),(7,'Luis','Hernandez','luis.hernandez@carpas.com','3161112233','$2b$10$Z7IQ72gDZrWnCfDa8kOj6eoa8SrK81Ccz2GXO/jn0eVlVRzXQf9n2',5,NULL,0,NULL,'2026-03-28 23:50:31','2026-03-28 23:50:31','activo',NULL,NULL);
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ciudad_id` int DEFAULT NULL,
  `estado` enum('activo','completado','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ciudad_id` (`ciudad_id`),
  KEY `idx_eventos_cliente` (`cliente_id`),
  KEY `idx_eventos_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_eventos_estado` (`estado`),
  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (1,2,'evento de prueba 1','evento para realizar pruebas de funcionamiento el dia 15 de feb','2026-02-16','2026-02-16','Carrera 15 #8-30, Barrio Industrial',2,'completado',NULL,'2026-02-15 18:45:35','2026-02-16 13:42:47'),(4,2,'evento de prueba 1','evento para realizar pruebas de funcionamiento el dia 15 de feb','2026-02-18','2026-02-18','Carrera 15 #8-30, Barrio Industrial',2,'completado',NULL,'2026-02-17 23:13:03','2026-02-18 01:27:35'),(5,2,'evento de prueba 1','evento para realizar pruebas de funcionamiento el dia 15 de feb','2026-02-18','2026-02-18','Carrera 15 #8-30, Barrio Industrial',2,'completado',NULL,'2026-02-18 01:27:58','2026-02-18 01:40:40'),(6,1,'revelacion de genero Nia',NULL,'2026-02-18','2026-02-18','Vereda Carrasquilla',1,'completado',NULL,'2026-02-18 01:38:14','2026-02-18 01:47:38'),(8,2,'boda de ander',NULL,'2026-02-21','2026-02-22','Vereda La Armenia, Km 5 vía a Circasia',2,'completado',NULL,'2026-02-20 16:31:29','2026-03-04 02:13:08'),(10,2,'boda',NULL,'2026-03-11','2026-03-11','Vereda La Armenia, Km 5 vía a Circasia',2,'cancelado',NULL,'2026-03-10 00:06:49','2026-03-21 15:16:28'),(11,3,'evento de prueba 1',NULL,'2026-03-27','2026-03-27',NULL,NULL,'completado',NULL,'2026-03-27 16:44:37','2026-03-29 01:27:43'),(12,3,'evento de prueba 2',NULL,'2026-03-31','2026-03-31',NULL,NULL,'activo',NULL,'2026-03-29 01:28:05','2026-03-29 01:28:05'),(13,1,'baby Shower',NULL,'2026-03-30','2026-03-30','vereda carrasquilla camellon san carlos',1,'completado',NULL,'2026-03-29 01:35:45','2026-03-29 14:21:29');
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes`
--

DROP TABLE IF EXISTS `lotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `elemento_id` int NOT NULL,
  `lote_numero` varchar(50) DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '0',
  `estado` enum('nuevo','bueno','mantenimiento','alquilado','dañado') DEFAULT 'bueno',
  `ubicacion` varchar(200) DEFAULT NULL,
  `ubicacion_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lotes_elemento` (`elemento_id`),
  KEY `idx_lotes_estado` (`estado`),
  KEY `idx_lotes_ubicacion_id` (`ubicacion_id`),
  KEY `idx_lotes_estado_ubicacion` (`estado`,`ubicacion_id`),
  KEY `idx_lotes_ubicacion` (`ubicacion`),
  KEY `idx_lotes_numero` (`lote_numero`),
  KEY `idx_lotes_elemento_estado` (`elemento_id`,`estado`),
  KEY `idx_lotes_elemento_estado_ubicacion` (`elemento_id`,`estado`,`ubicacion`),
  CONSTRAINT `fk_lotes_elemento` FOREIGN KEY (`elemento_id`) REFERENCES `elementos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lotes_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lotes_chk_1` CHECK ((`cantidad` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes`
--

LOCK TABLES `lotes` WRITE;
/*!40000 ALTER TABLE `lotes` DISABLE KEYS */;
INSERT INTO `lotes` VALUES (1,2,'REATAS-001',40,'bueno','Bodega A',21,'2025-10-15 17:33:05','2025-11-20 17:26:43'),(8,2,'LOTE-1760837579058',30,'mantenimiento','Taller',22,'2025-10-19 01:32:59','2025-11-20 17:26:43'),(9,2,'LOTE-1762045139336',30,'alquilado',NULL,NULL,'2025-11-02 00:58:59','2025-11-02 00:58:59'),(12,24,'LOTE-1765512338680',116,'bueno','Bodega A',NULL,'2025-12-12 04:05:38','2025-12-21 03:40:10'),(13,21,'001',12,'bueno','Bodega A',NULL,'2025-12-12 22:16:13','2025-12-12 22:16:13'),(16,25,'LOTE-25-001',20,'bueno','Bodega A',NULL,'2025-12-13 01:04:37','2025-12-13 01:05:21'),(17,25,'LOTE-1765587921038',4,'mantenimiento','Taller',NULL,'2025-12-13 01:05:21','2025-12-13 01:05:21'),(18,24,'LOTE-1766288410917',14,'mantenimiento','Taller',NULL,'2025-12-21 03:40:10','2025-12-21 03:40:10'),(19,26,'LOTE-26-001',5,'bueno',NULL,NULL,'2025-12-27 18:37:59','2026-03-29 01:38:51'),(22,28,'LOTE-28-001',300,'bueno','Bodega A',NULL,'2025-12-28 17:15:41','2026-03-29 01:38:51'),(23,29,'LOTE-29-001',49,'bueno',NULL,NULL,'2025-12-28 17:20:01','2026-03-29 01:38:50'),(25,31,'LOTE-31-001',28,'mantenimiento',NULL,NULL,'2025-12-28 17:23:16','2026-03-29 03:21:00'),(26,32,'001',156,'bueno','Bodega A',NULL,'2025-12-28 17:25:11','2026-03-29 01:38:51'),(27,33,'LOTE-33-001',500,'bueno',NULL,NULL,'2025-12-28 17:27:35','2025-12-28 17:27:35'),(28,34,'LOTE-34-001',40,'nuevo','Bodega A',NULL,'2025-12-28 17:29:23','2025-12-28 17:29:23'),(29,35,'001',1,'bueno','Bodega A',NULL,'2025-12-28 17:33:43','2026-03-29 01:38:50'),(30,37,'LOTE-37-001',8,'bueno',NULL,NULL,'2025-12-28 23:34:00','2025-12-28 23:34:00'),(31,29,'LOTE-1767100659868',1,'alquilado',NULL,NULL,'2025-12-30 13:17:39','2025-12-30 13:17:39'),(34,39,'LOTE-39-001',14,'bueno','Bodega A',NULL,'2026-01-04 19:58:36','2026-03-29 14:22:02'),(35,40,'LOTE-40-001',10,'bueno','Bodega A',NULL,'2026-01-04 19:59:49','2026-01-04 19:59:49'),(36,41,'LOTE-41-001',2,'bueno','Bodega A',NULL,'2026-01-04 20:04:54','2026-01-04 20:04:54'),(37,42,'LOTE-42-001',4,'bueno','Bodega A',NULL,'2026-01-04 20:07:22','2026-03-29 14:22:02'),(38,44,'001',0,'bueno','Bodega A',NULL,'2026-01-04 20:12:08','2026-02-18 01:44:36'),(40,46,'LOTE-46-001',2,'bueno','Bodega A',NULL,'2026-01-04 20:26:07','2026-01-04 20:26:07'),(41,47,'LOTE-47-001',20,'bueno','Bodega A',NULL,'2026-01-12 15:40:10','2026-01-12 15:40:10'),(42,48,'LOTE-48-001',37,'bueno','Bodega A',NULL,'2026-01-13 14:40:56','2026-02-08 02:38:36'),(44,50,'LOTE-50-001',12,'nuevo',NULL,NULL,'2026-01-13 14:51:27','2026-01-13 14:51:27'),(45,19,'001',109,'bueno','Bodega A',NULL,'2026-01-17 19:19:56','2026-03-29 01:38:50'),(48,45,'LOTE-20260215-92E0',2,'bueno','Bodega A',NULL,'2026-02-16 02:54:23','2026-03-29 14:22:02'),(49,49,'LOTE-20260219-VK7H',580,'bueno','Bodega A',NULL,'2026-02-19 23:12:14','2026-02-19 23:12:14'),(50,44,'LOTE-20260220-ET58',0,'bueno','Bodega A',NULL,'2026-02-20 16:25:27','2026-02-20 16:58:55'),(51,44,'LOTE-20260220-X2WT',0,'bueno','Bodega A',NULL,'2026-02-20 16:27:10','2026-03-18 23:22:48'),(52,30,'LOTE-20260306-17Y5',50,'bueno','Bodega A',NULL,'2026-03-06 15:07:11','2026-03-29 01:38:51'),(53,26,'LOTE-20260328-VWJ5',1,'bueno','Bodega A',NULL,'2026-03-29 03:23:20','2026-03-29 03:23:20'),(54,52,'LOTE-52-001',4,'bueno','Bodega A',NULL,'2026-03-29 03:26:08','2026-03-29 03:26:08'),(55,44,'LOTE-20260328-DSXH',4,'bueno','Bodega A',NULL,'2026-03-29 03:28:03','2026-03-29 14:22:02');
/*!40000 ALTER TABLE `lotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes_movimientos`
--

DROP TABLE IF EXISTS `lotes_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes_movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lote_origen_id` int DEFAULT NULL,
  `lote_destino_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `motivo` varchar(50) DEFAULT NULL,
  `descripcion` text,
  `estado_origen` varchar(20) DEFAULT NULL,
  `estado_destino` varchar(20) DEFAULT NULL,
  `ubicacion_origen` varchar(200) DEFAULT NULL,
  `ubicacion_destino` varchar(200) DEFAULT NULL,
  `costo_reparacion` decimal(10,2) DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lote_origen_id` (`lote_origen_id`),
  KEY `lote_destino_id` (`lote_destino_id`),
  CONSTRAINT `lotes_movimientos_ibfk_1` FOREIGN KEY (`lote_origen_id`) REFERENCES `lotes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lotes_movimientos_ibfk_2` FOREIGN KEY (`lote_destino_id`) REFERENCES `lotes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes_movimientos`
--

LOCK TABLES `lotes_movimientos` WRITE;
/*!40000 ALTER TABLE `lotes_movimientos` DISABLE KEYS */;
INSERT INTO `lotes_movimientos` VALUES (1,1,NULL,30,'alquiler','Cliente ABC - Evento Boda en Parque Central - 18/Oct/2025','bueno','alquilado','Bodega A',NULL,NULL,NULL,'2025-10-19 01:23:37'),(2,1,NULL,20,'alquiler','Cliente XYZ - Evento Corporativo - 19/Oct/2025','bueno','alquilado','Bodega A',NULL,NULL,NULL,'2025-10-19 01:31:11'),(3,NULL,8,30,'devolucion','Cliente ABC - Devolución después de evento - Requieren limpieza','alquilado','mantenimiento',NULL,'Taller',NULL,NULL,'2025-10-19 01:32:59'),(4,NULL,1,20,'limpieza','Limpieza completada - Listas para alquilar','alquilado','bueno',NULL,'Bodega A',NULL,NULL,'2025-10-19 01:39:41'),(5,1,9,30,'alquiler','Cliente XYZ - Evento corporativo','bueno','alquilado','Bodega A',NULL,NULL,NULL,'2025-11-02 00:58:59'),(6,NULL,NULL,38,'reparacion',NULL,'dañado','mantenimiento','Bodega B','Taller',NULL,NULL,'2025-12-12 22:41:10'),(7,NULL,12,38,NULL,'Devolución completa desde Taller','mantenimiento','bueno','Taller','Bodega A',NULL,NULL,'2025-12-13 00:06:49'),(8,16,17,4,'reparacion','se debe corregir pintura','bueno','mantenimiento','Bodega A','Taller',NULL,NULL,'2025-12-13 01:05:21'),(9,12,18,14,'reparacion','estacas dobladas','bueno','mantenimiento','Bodega A','Taller',NULL,NULL,'2025-12-21 03:40:10'),(10,NULL,NULL,1,'reparacion',NULL,'bueno','mantenimiento','Bodega A','Taller',NULL,NULL,'2025-12-27 23:05:54'),(11,23,31,1,'alquiler',NULL,'bueno','alquilado',NULL,NULL,NULL,NULL,'2025-12-30 13:17:39'),(12,NULL,NULL,4,'traslado',NULL,'nuevo','nuevo','Bodega A','Taller',NULL,NULL,'2026-01-21 16:50:53'),(13,NULL,38,6,'ajuste',NULL,'nuevo','bueno','Bodega A','Bodega A',NULL,NULL,'2026-02-16 02:51:52'),(14,NULL,48,4,'ajuste',NULL,'nuevo','bueno','Bodega A','Bodega A',NULL,NULL,'2026-02-16 02:54:23'),(15,NULL,48,4,NULL,'Devolución completa desde Taller','nuevo','bueno','Taller','Bodega A',NULL,NULL,'2026-02-16 02:54:36'),(16,NULL,49,580,'ajuste',NULL,'nuevo','bueno','Bodega A','Bodega A',NULL,NULL,'2026-02-19 23:12:14'),(17,NULL,52,53,'traslado','organizacion','bueno','bueno',NULL,'Bodega A',NULL,NULL,'2026-03-06 15:07:11'),(18,NULL,53,1,NULL,'Devolución completa desde Taller','mantenimiento','bueno','Taller','Bodega A',NULL,NULL,'2026-03-29 03:23:20');
/*!40000 ALTER TABLE `lotes_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materiales`
--

DROP TABLE IF EXISTS `materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_materiales_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materiales`
--

LOCK TABLES `materiales` WRITE;
/*!40000 ALTER TABLE `materiales` DISABLE KEYS */;
INSERT INTO `materiales` VALUES (1,'Tela Nautica','Lona de tela nautica resistente al agua y rayos UV','2025-10-14 22:38:24'),(2,'Acero galvanizado','Acero recubierto con zinc anti-corrosión','2025-10-14 22:38:24'),(3,'Aluminio','Material ligero y resistente','2025-10-14 22:38:24'),(4,'Plástico','Plástico durable para conectores','2025-10-14 22:38:24'),(5,'Madera','Madera tratada para estructuras','2025-10-14 22:38:24'),(6,'Algodon','Algodon Hindu con recubrimiento','2025-10-14 22:38:24'),(7,'Cobre','Material ligero y conductor','2025-11-02 01:01:20');
/*!40000 ALTER TABLE `materiales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_elemento_fotos`
--

DROP TABLE IF EXISTS `orden_elemento_fotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_elemento_fotos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_elemento_id` int NOT NULL,
  `momento` enum('carga','montaje','desmontaje','retorno','incidencia') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tomada_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tomada_por` (`tomada_por`),
  KEY `idx_elem_fotos_orden` (`orden_elemento_id`),
  KEY `idx_elem_fotos_momento` (`momento`),
  CONSTRAINT `orden_elemento_fotos_ibfk_1` FOREIGN KEY (`orden_elemento_id`) REFERENCES `orden_trabajo_elementos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_elemento_fotos_ibfk_2` FOREIGN KEY (`tomada_por`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_elemento_fotos`
--

LOCK TABLES `orden_elemento_fotos` WRITE;
/*!40000 ALTER TABLE `orden_elemento_fotos` DISABLE KEYS */;
/*!40000 ALTER TABLE `orden_elemento_fotos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_cambios_fecha`
--

DROP TABLE IF EXISTS `orden_trabajo_cambios_fecha`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_cambios_fecha` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `fecha_anterior` datetime NOT NULL,
  `fecha_nueva` datetime NOT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aprobado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orden_id` (`orden_id`),
  KEY `aprobado_por` (`aprobado_por`),
  CONSTRAINT `orden_trabajo_cambios_fecha_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_cambios_fecha_ibfk_2` FOREIGN KEY (`aprobado_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_cambios_fecha`
--

LOCK TABLES `orden_trabajo_cambios_fecha` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_cambios_fecha` DISABLE KEYS */;
/*!40000 ALTER TABLE `orden_trabajo_cambios_fecha` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_elementos`
--

DROP TABLE IF EXISTS `orden_trabajo_elementos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_elementos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `elemento_id` int NOT NULL,
  `serie_id` int DEFAULT NULL,
  `lote_id` int DEFAULT NULL,
  `cantidad` int DEFAULT '1',
  `estado` enum('pendiente','cargado','descargado','instalado','verificado','con_problema') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `verificado_salida` tinyint(1) DEFAULT '0',
  `verificado_retorno` tinyint(1) DEFAULT '0',
  `verificado_bodega` tinyint(1) DEFAULT '0',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `marcado_dano` tinyint(1) DEFAULT '0',
  `descripcion_dano` text COLLATE utf8mb4_unicode_ci,
  `cantidad_danada` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orden_id` (`orden_id`),
  KEY `elemento_id` (`elemento_id`),
  KEY `serie_id` (`serie_id`),
  CONSTRAINT `orden_trabajo_elementos_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_elementos_ibfk_2` FOREIGN KEY (`elemento_id`) REFERENCES `elementos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_elementos_ibfk_3` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_elementos`
--

LOCK TABLES `orden_trabajo_elementos` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_elementos` DISABLE KEYS */;
INSERT INTO `orden_trabajo_elementos` VALUES (1,1,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-02-16 03:48:17','2026-02-16 03:55:15',0,NULL,NULL),(2,2,45,NULL,48,1,'descargado',0,1,0,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:05',0,NULL,NULL),(3,1,44,NULL,38,6,'cargado',1,0,0,NULL,'2026-02-16 03:48:17','2026-02-16 03:55:15',0,NULL,NULL),(4,2,44,NULL,38,6,'descargado',0,1,0,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:06',0,NULL,NULL),(5,1,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-02-16 03:48:17','2026-02-16 03:55:15',0,NULL,NULL),(6,2,39,NULL,34,1,'descargado',0,1,0,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:07',0,NULL,NULL),(7,1,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-02-16 03:48:17','2026-02-16 03:55:15',0,NULL,NULL),(8,2,42,NULL,37,1,'descargado',0,1,0,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:09',0,NULL,NULL),(9,3,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-02-18 00:19:55','2026-02-18 00:25:27',0,NULL,NULL),(10,4,45,NULL,48,1,'pendiente',0,0,1,NULL,'2026-02-18 00:19:55','2026-02-18 01:04:27',0,NULL,NULL),(11,3,44,NULL,38,6,'cargado',1,0,0,NULL,'2026-02-18 00:19:55','2026-02-18 00:25:27',0,NULL,NULL),(12,4,44,NULL,38,6,'pendiente',0,0,1,NULL,'2026-02-18 00:19:55','2026-02-18 01:04:28',0,NULL,NULL),(13,3,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-02-18 00:19:55','2026-02-18 00:25:28',0,NULL,NULL),(14,4,39,NULL,34,1,'pendiente',0,0,1,NULL,'2026-02-18 00:19:55','2026-02-18 01:04:29',0,NULL,NULL),(15,3,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-02-18 00:19:55','2026-02-18 00:25:29',0,NULL,NULL),(16,4,42,NULL,37,1,'pendiente',0,0,1,NULL,'2026-02-18 00:19:55','2026-02-18 01:04:31',0,NULL,NULL),(17,5,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-02-18 01:29:31','2026-02-18 01:30:43',0,NULL,NULL),(18,6,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:26',0,NULL,NULL),(19,5,44,NULL,38,6,'cargado',1,0,0,NULL,'2026-02-18 01:29:31','2026-02-18 01:30:44',0,NULL,NULL),(20,6,44,NULL,38,6,'descargado',0,1,1,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:27',0,NULL,NULL),(21,5,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-02-18 01:29:31','2026-02-18 01:30:45',0,NULL,NULL),(22,6,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:29',0,NULL,NULL),(23,5,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-02-18 01:29:31','2026-02-18 01:30:47',0,NULL,NULL),(24,6,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:30',0,NULL,NULL),(25,7,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-02-18 01:42:50','2026-02-18 01:44:04',0,NULL,NULL),(26,8,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:19',0,NULL,NULL),(27,7,44,NULL,38,2,'cargado',1,0,0,NULL,'2026-02-18 01:42:50','2026-02-18 01:44:06',0,NULL,NULL),(28,8,44,NULL,38,2,'descargado',0,1,1,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:20',0,NULL,NULL),(29,7,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-02-18 01:42:50','2026-02-18 01:44:07',0,NULL,NULL),(30,8,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:21',0,NULL,NULL),(31,7,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-02-18 01:42:50','2026-02-18 01:44:12',0,NULL,NULL),(32,8,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:22',0,NULL,NULL),(33,9,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-02-20 16:38:42','2026-02-20 16:42:46',0,NULL,NULL),(34,10,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:44',0,NULL,NULL),(35,9,44,NULL,50,5,'cargado',1,0,0,NULL,'2026-02-20 16:38:42','2026-02-20 16:42:47',0,NULL,NULL),(36,10,44,NULL,50,5,'descargado',0,1,1,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:45',0,NULL,NULL),(37,9,44,NULL,51,1,'cargado',1,0,0,NULL,'2026-02-20 16:38:42','2026-02-20 16:42:48',0,NULL,NULL),(38,10,44,NULL,51,1,'descargado',0,1,1,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:47',0,NULL,NULL),(39,9,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-02-20 16:38:42','2026-02-20 16:42:49',0,NULL,NULL),(40,10,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:48',0,NULL,NULL),(41,9,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-02-20 16:38:42','2026-02-20 16:42:50',0,NULL,NULL),(42,10,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:49',0,NULL,NULL),(43,11,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-03-10 00:11:15','2026-03-18 23:22:48',0,NULL,NULL),(44,12,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:37',0,NULL,NULL),(45,11,44,NULL,51,1,'cargado',1,0,0,NULL,'2026-03-10 00:11:15','2026-03-18 23:22:48',0,NULL,NULL),(46,12,44,NULL,51,1,'descargado',0,1,1,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:38',0,NULL,NULL),(47,11,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-03-10 00:11:15','2026-03-18 23:22:48',0,NULL,NULL),(48,12,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:39',0,NULL,NULL),(49,11,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-03-10 00:11:15','2026-03-18 23:22:48',0,NULL,NULL),(50,12,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:41',0,NULL,NULL),(51,13,31,NULL,25,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:06',0,NULL,NULL),(52,14,31,NULL,25,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:07',0,NULL,NULL),(53,13,29,NULL,23,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:08',0,NULL,NULL),(54,14,29,NULL,23,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:08',0,NULL,NULL),(55,13,35,NULL,29,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:08',0,NULL,NULL),(56,14,35,NULL,29,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:09',0,NULL,NULL),(57,13,19,NULL,45,11,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:09',0,NULL,NULL),(58,14,19,NULL,45,11,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:10',0,NULL,NULL),(59,13,26,NULL,19,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:10',0,NULL,NULL),(60,14,26,NULL,19,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:11',0,NULL,NULL),(61,13,27,13,NULL,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:12',0,NULL,NULL),(62,14,27,13,NULL,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:12',0,NULL,NULL),(63,13,32,NULL,26,10,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:12',0,NULL,NULL),(64,14,32,NULL,26,10,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:13',0,NULL,NULL),(65,13,28,NULL,22,11,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:13',0,NULL,NULL),(66,14,28,NULL,22,11,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:14',0,NULL,NULL),(67,13,30,NULL,52,1,'cargado',1,0,0,NULL,'2026-03-27 21:15:56','2026-03-28 22:27:14',0,NULL,NULL),(68,14,30,NULL,52,1,'descargado',0,1,1,NULL,'2026-03-27 21:15:56','2026-03-28 22:36:16',0,NULL,NULL),(69,15,31,NULL,25,1,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:13',0,NULL,NULL),(70,16,31,NULL,25,1,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:44',1,'se partio',NULL),(71,15,29,NULL,23,1,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:14',0,NULL,NULL),(72,16,29,NULL,23,1,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:46',0,NULL,NULL),(73,15,35,NULL,29,1,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:16',0,NULL,NULL),(74,16,35,NULL,29,1,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:48',0,NULL,NULL),(75,15,19,NULL,45,11,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:18',0,NULL,NULL),(76,16,19,NULL,45,11,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:49',0,NULL,NULL),(77,15,26,NULL,19,1,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:19',0,NULL,NULL),(78,16,26,NULL,19,1,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:49',0,NULL,NULL),(79,15,32,NULL,26,10,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:47',0,NULL,NULL),(80,16,32,NULL,26,10,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:51',0,NULL,NULL),(81,15,28,NULL,22,11,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:48',0,NULL,NULL),(82,16,28,NULL,22,11,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:51',0,NULL,NULL),(83,15,30,NULL,52,1,'cargado',1,0,0,NULL,'2026-03-29 01:31:53','2026-03-29 01:32:49',0,NULL,NULL),(84,16,30,NULL,52,1,'descargado',0,1,1,NULL,'2026-03-29 01:31:53','2026-03-29 02:46:52',0,NULL,NULL),(85,17,31,NULL,25,1,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:39',0,NULL,NULL),(86,18,31,NULL,25,1,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:10',0,NULL,NULL),(87,17,29,NULL,23,1,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:40',0,NULL,NULL),(88,18,29,NULL,23,1,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:11',0,NULL,NULL),(89,17,35,NULL,29,1,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:41',0,NULL,NULL),(90,18,35,NULL,29,1,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:11',0,NULL,NULL),(91,17,19,NULL,45,11,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:42',0,NULL,NULL),(92,18,19,NULL,45,11,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:13',0,NULL,NULL),(93,17,26,NULL,19,1,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:43',0,NULL,NULL),(94,18,26,NULL,19,1,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:13',0,NULL,NULL),(95,17,32,NULL,26,10,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:44',0,NULL,NULL),(96,18,32,NULL,26,10,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:14',0,NULL,NULL),(97,17,28,NULL,22,11,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:45',0,NULL,NULL),(98,18,28,NULL,22,11,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:16',0,NULL,NULL),(99,17,30,NULL,52,1,'cargado',1,0,0,NULL,'2026-03-29 01:38:08','2026-03-29 01:38:46',0,NULL,NULL),(100,18,30,NULL,52,1,'descargado',0,1,1,NULL,'2026-03-29 01:38:08','2026-03-29 01:43:16',0,NULL,NULL),(101,19,31,NULL,25,1,'verificado',0,0,0,'se partio','2026-03-29 02:46:31','2026-03-29 03:21:00',0,NULL,NULL),(102,20,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:48','2026-03-29 14:21:51',0,NULL,NULL),(103,21,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:48','2026-03-29 14:47:10',0,NULL,NULL),(104,20,44,NULL,55,6,'cargado',1,0,0,NULL,'2026-03-29 14:08:48','2026-03-29 14:21:52',0,NULL,NULL),(105,21,44,NULL,55,6,'descargado',0,1,1,NULL,'2026-03-29 14:08:48','2026-03-29 14:47:10',0,NULL,NULL),(106,20,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:48','2026-03-29 14:21:56',0,NULL,NULL),(107,21,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:48','2026-03-29 14:47:11',0,NULL,NULL),(108,20,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:48','2026-03-29 14:21:55',0,NULL,NULL),(109,21,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:48','2026-03-29 14:47:12',0,NULL,NULL),(110,22,45,NULL,48,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:55','2026-03-29 14:12:40',0,NULL,NULL),(111,23,45,NULL,48,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:55','2026-03-29 14:46:09',0,NULL,NULL),(112,22,44,NULL,55,6,'cargado',1,0,0,NULL,'2026-03-29 14:08:55','2026-03-29 14:12:42',0,NULL,NULL),(113,23,44,NULL,55,6,'descargado',0,1,1,NULL,'2026-03-29 14:08:55','2026-03-29 14:46:10',0,NULL,NULL),(114,22,39,NULL,34,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:55','2026-03-29 14:12:43',0,NULL,NULL),(115,23,39,NULL,34,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:55','2026-03-29 14:46:10',0,NULL,NULL),(116,22,42,NULL,37,1,'cargado',1,0,0,NULL,'2026-03-29 14:08:55','2026-03-29 14:12:44',0,NULL,NULL),(117,23,42,NULL,37,1,'descargado',0,1,1,NULL,'2026-03-29 14:08:55','2026-03-29 14:46:14',0,NULL,NULL);
/*!40000 ALTER TABLE `orden_trabajo_elementos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_equipo`
--

DROP TABLE IF EXISTS `orden_trabajo_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `rol_en_orden` enum('responsable','operario','conductor','auxiliar') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'operario',
  `estado_asignacion` enum('pendiente','aceptada','rechazada') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `fecha_respuesta` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orden_empleado` (`orden_id`,`empleado_id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `orden_trabajo_equipo_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_equipo_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_equipo`
--

LOCK TABLES `orden_trabajo_equipo` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_equipo` DISABLE KEYS */;
INSERT INTO `orden_trabajo_equipo` VALUES (1,15,5,'responsable','pendiente',NULL,NULL,'2026-03-29 01:32:26'),(2,17,3,'responsable','pendiente',NULL,NULL,'2026-03-29 01:38:26'),(3,18,5,'responsable','pendiente',NULL,NULL,'2026-03-29 01:40:59'),(4,16,7,'responsable','pendiente',NULL,NULL,'2026-03-29 01:56:50'),(7,19,7,'responsable','pendiente',NULL,NULL,'2026-03-29 03:11:26'),(8,22,5,'responsable','pendiente',NULL,NULL,'2026-03-29 14:09:24');
/*!40000 ALTER TABLE `orden_trabajo_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_fotos`
--

DROP TABLE IF EXISTS `orden_trabajo_fotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_fotos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `etapa` enum('cargue','llegada_sitio','montaje_terminado','antes_desmontaje','desmontaje_terminado','retorno') COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `subido_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subido_por` (`subido_por`),
  KEY `idx_fotos_orden` (`orden_id`),
  KEY `idx_fotos_etapa` (`etapa`),
  CONSTRAINT `orden_trabajo_fotos_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_fotos_ibfk_2` FOREIGN KEY (`subido_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_fotos`
--

LOCK TABLES `orden_trabajo_fotos` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_fotos` DISABLE KEYS */;
/*!40000 ALTER TABLE `orden_trabajo_fotos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_historial_estados`
--

DROP TABLE IF EXISTS `orden_trabajo_historial_estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_historial_estados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `estado_anterior` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cambiado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cambiado_por` (`cambiado_por`),
  KEY `idx_historial_estados_orden` (`orden_id`),
  KEY `idx_historial_estados_estado` (`estado_nuevo`),
  KEY `idx_historial_estados_fecha` (`created_at`),
  CONSTRAINT `orden_trabajo_historial_estados_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_historial_estados_ibfk_2` FOREIGN KEY (`cambiado_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_historial_estados`
--

LOCK TABLES `orden_trabajo_historial_estados` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_historial_estados` DISABLE KEYS */;
INSERT INTO `orden_trabajo_historial_estados` VALUES (1,4,'en_ruta','en_sitio',1,'2026-02-18 01:02:19'),(2,4,'en_sitio','completado',1,'2026-02-18 01:03:41'),(3,5,'en_preparacion','en_ruta',1,'2026-02-18 01:31:08'),(4,5,'en_ruta','en_sitio',1,'2026-02-18 01:31:11'),(5,5,'en_sitio','en_proceso',1,'2026-02-18 01:31:12'),(6,5,'en_proceso','completado',1,'2026-02-18 01:31:30'),(7,6,'pendiente','confirmado',1,'2026-02-18 01:31:52'),(8,6,'confirmado','en_preparacion',1,'2026-02-18 01:31:53'),(9,6,'en_preparacion','en_ruta',1,'2026-02-18 01:31:54'),(10,6,'en_ruta','en_sitio',1,'2026-02-18 01:31:55'),(11,6,'en_sitio','en_proceso',1,'2026-02-18 01:32:03'),(12,6,'en_proceso','en_retorno',1,'2026-02-18 01:32:15'),(13,6,'en_retorno','descargue',1,'2026-02-18 01:32:20'),(14,6,'descargue','completado',1,'2026-02-18 01:32:34'),(15,7,'en_preparacion','en_ruta',1,'2026-02-18 01:44:36'),(16,7,'en_ruta','en_sitio',1,'2026-02-18 01:44:45'),(17,7,'en_sitio','en_proceso',1,'2026-02-18 01:44:54'),(18,7,'en_proceso','completado',1,'2026-02-18 01:45:15'),(19,8,'pendiente','confirmado',1,'2026-02-18 01:45:45'),(20,8,'confirmado','en_preparacion',1,'2026-02-18 01:45:46'),(21,8,'en_preparacion','en_ruta',1,'2026-02-18 01:45:48'),(22,8,'en_ruta','en_sitio',1,'2026-02-18 01:45:50'),(23,8,'en_sitio','en_proceso',1,'2026-02-18 01:45:55'),(24,8,'en_proceso','en_retorno',1,'2026-02-18 01:46:12'),(25,8,'en_retorno','descargue',1,'2026-02-18 01:46:14'),(26,8,'descargue','completado',1,'2026-02-18 01:46:29'),(27,9,'en_preparacion','en_ruta',1,'2026-02-20 16:58:55'),(28,9,'en_ruta','en_sitio',1,'2026-02-20 16:59:31'),(29,9,'en_sitio','en_proceso',1,'2026-02-20 16:59:32'),(30,9,'en_proceso','completado',1,'2026-02-20 16:59:37'),(31,10,'pendiente','confirmado',1,'2026-02-20 17:00:26'),(32,10,'confirmado','en_preparacion',1,'2026-03-07 03:16:34'),(33,10,'en_preparacion','en_ruta',1,'2026-03-07 03:16:36'),(34,10,'en_ruta','en_sitio',1,'2026-03-07 03:16:38'),(35,10,'en_sitio','en_proceso',1,'2026-03-07 03:16:40'),(36,10,'en_proceso','en_retorno',1,'2026-03-07 03:17:29'),(37,10,'en_retorno','descargue',1,'2026-03-07 03:17:35'),(38,10,'descargue','completado',1,'2026-03-07 03:17:57'),(39,11,'en_preparacion','en_ruta',1,'2026-03-18 23:22:48'),(40,11,'en_ruta','en_sitio',1,'2026-03-18 23:22:52'),(41,11,'en_sitio','en_proceso',1,'2026-03-18 23:22:54'),(42,11,'en_proceso','completado',1,'2026-03-18 23:31:45'),(43,12,'pendiente','confirmado',1,'2026-03-19 01:58:58'),(44,12,'confirmado','en_preparacion',1,'2026-03-19 01:59:01'),(45,12,'en_preparacion','en_ruta',1,'2026-03-19 01:59:04'),(46,12,'en_ruta','en_sitio',1,'2026-03-19 01:59:07'),(47,12,'en_sitio','en_proceso',1,'2026-03-19 01:59:09'),(48,12,'en_proceso','en_retorno',1,'2026-03-19 01:59:31'),(49,12,'en_retorno','descargue',1,'2026-03-19 01:59:33'),(50,12,'descargue','completado',1,'2026-03-21 15:10:49'),(51,13,'en_preparacion','en_ruta',1,'2026-03-28 22:27:23'),(52,13,'en_ruta','en_sitio',1,'2026-03-28 22:27:57'),(53,13,'en_sitio','en_proceso',1,'2026-03-28 22:28:06'),(54,13,'en_proceso','completado',1,'2026-03-28 22:28:58'),(55,14,'pendiente','confirmado',1,'2026-03-28 22:35:20'),(56,14,'confirmado','en_preparacion',1,'2026-03-28 22:35:42'),(57,14,'en_preparacion','en_ruta',1,'2026-03-28 22:35:44'),(58,14,'en_ruta','en_sitio',1,'2026-03-28 22:35:45'),(59,14,'en_sitio','en_proceso',1,'2026-03-28 22:35:46'),(60,14,'en_proceso','en_retorno',1,'2026-03-28 22:36:02'),(61,14,'en_retorno','descargue',1,'2026-03-28 22:36:04'),(62,14,'descargue','completado',1,'2026-03-28 22:36:18'),(63,15,'en_preparacion','en_ruta',1,'2026-03-29 01:32:57'),(64,15,'en_ruta','en_sitio',1,'2026-03-29 01:33:00'),(65,15,'en_sitio','en_proceso',1,'2026-03-29 01:33:01'),(66,15,'en_proceso','completado',1,'2026-03-29 01:33:08'),(67,17,'en_preparacion','en_ruta',1,'2026-03-29 01:38:51'),(68,17,'en_ruta','en_sitio',1,'2026-03-29 01:38:57'),(69,17,'en_sitio','en_proceso',1,'2026-03-29 01:39:22'),(70,17,'en_proceso','completado',1,'2026-03-29 01:39:46'),(71,18,'pendiente','confirmado',1,'2026-03-29 01:41:04'),(72,18,'confirmado','en_preparacion',1,'2026-03-29 01:41:08'),(73,18,'en_preparacion','en_ruta',1,'2026-03-29 01:41:10'),(74,18,'en_ruta','en_sitio',1,'2026-03-29 01:41:12'),(75,18,'en_sitio','en_proceso',1,'2026-03-29 01:41:19'),(76,18,'en_proceso','en_retorno',1,'2026-03-29 01:42:57'),(77,18,'en_retorno','descargue',1,'2026-03-29 01:43:04'),(78,18,'descargue','completado',1,'2026-03-29 01:43:19'),(79,16,'pendiente','confirmado',1,'2026-03-29 02:42:52'),(80,16,'confirmado','en_preparacion',1,'2026-03-29 02:42:53'),(81,16,'en_preparacion','en_ruta',1,'2026-03-29 02:42:56'),(82,16,'en_ruta','en_sitio',1,'2026-03-29 02:42:59'),(83,16,'en_sitio','en_proceso',1,'2026-03-29 02:43:05'),(84,16,'en_proceso','en_retorno',1,'2026-03-29 02:46:37'),(85,16,'en_retorno','descargue',1,'2026-03-29 02:46:38'),(86,16,'descargue','completado',1,'2026-03-29 02:47:02'),(87,19,'pendiente','confirmado',1,'2026-03-29 02:47:19'),(88,19,'confirmado','en_preparacion',1,'2026-03-29 02:47:19'),(89,19,'en_preparacion','en_revision',1,'2026-03-29 03:15:26'),(90,19,'en_revision','en_reparacion',1,'2026-03-29 03:15:29'),(91,19,'en_reparacion','completado',1,'2026-03-29 03:21:00'),(92,22,'en_preparacion','en_ruta',1,'2026-03-29 14:12:49'),(93,22,'en_ruta','en_sitio',1,'2026-03-29 14:12:52'),(94,22,'en_sitio','en_proceso',1,'2026-03-29 14:12:53'),(95,22,'en_proceso','completado',1,'2026-03-29 14:12:56'),(96,20,'en_preparacion','en_ruta',1,'2026-03-29 14:22:02'),(97,20,'en_ruta','en_sitio',1,'2026-03-29 14:22:03'),(98,20,'en_sitio','en_proceso',1,'2026-03-29 14:22:04'),(99,20,'en_proceso','completado',1,'2026-03-29 14:22:10'),(100,23,'pendiente','confirmado',1,'2026-03-29 14:45:51'),(101,23,'confirmado','en_preparacion',1,'2026-03-29 14:45:52'),(102,23,'en_preparacion','en_ruta',1,'2026-03-29 14:45:53'),(103,23,'en_ruta','en_sitio',1,'2026-03-29 14:45:53'),(104,23,'en_sitio','en_proceso',1,'2026-03-29 14:45:54'),(105,23,'en_proceso','en_retorno',1,'2026-03-29 14:46:04'),(106,23,'en_retorno','descargue',1,'2026-03-29 14:46:04'),(107,23,'descargue','completado',1,'2026-03-29 14:46:17'),(108,21,'pendiente','confirmado',1,'2026-03-29 14:46:52'),(109,21,'confirmado','en_preparacion',1,'2026-03-29 14:46:54'),(110,21,'en_preparacion','en_ruta',1,'2026-03-29 14:46:55'),(111,21,'en_ruta','en_sitio',1,'2026-03-29 14:46:56'),(112,21,'en_sitio','en_proceso',1,'2026-03-29 14:46:57'),(113,21,'en_proceso','en_retorno',1,'2026-03-29 14:47:06'),(114,21,'en_retorno','descargue',1,'2026-03-29 14:47:07'),(115,21,'descargue','completado',1,'2026-03-29 14:47:16');
/*!40000 ALTER TABLE `orden_trabajo_historial_estados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_novedades`
--

DROP TABLE IF EXISTS `orden_trabajo_novedades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_novedades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `alerta_id` int DEFAULT NULL,
  `tipo_novedad` enum('cancelacion_producto','solicitud_adicional','cambio_ubicacion','dano_elemento','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `producto_id` int DEFAULT NULL,
  `elemento_orden_id` int DEFAULT NULL,
  `cantidad_afectada` int DEFAULT '1',
  `imagen_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','en_revision','resuelta','rechazada') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `resolucion` text COLLATE utf8mb4_unicode_ci,
  `resuelta_por` int DEFAULT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `reportada_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `alerta_id` (`alerta_id`),
  KEY `reportada_por` (`reportada_por`),
  KEY `resuelta_por` (`resuelta_por`),
  KEY `idx_novedades_orden` (`orden_id`),
  KEY `idx_novedades_estado` (`estado`),
  KEY `idx_novedades_tipo` (`tipo_novedad`),
  CONSTRAINT `orden_trabajo_novedades_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orden_trabajo_novedades_ibfk_2` FOREIGN KEY (`alerta_id`) REFERENCES `alertas_operaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orden_trabajo_novedades_ibfk_3` FOREIGN KEY (`reportada_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orden_trabajo_novedades_ibfk_4` FOREIGN KEY (`resuelta_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_novedades`
--

LOCK TABLES `orden_trabajo_novedades` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_novedades` DISABLE KEYS */;
INSERT INTO `orden_trabajo_novedades` VALUES (1,18,4,'dano_elemento','luisa lo daño',17,NULL,1,'/uploads/operaciones/operacione_18_1774748553468.png','resuelta','se envia a mantenimiento',1,'2026-03-29 09:04:36',1,'2026-03-29 01:42:33','2026-03-29 14:04:36');
/*!40000 ALTER TABLE `orden_trabajo_novedades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_trabajo`
--

DROP TABLE IF EXISTS `ordenes_trabajo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_trabajo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alquiler_id` int DEFAULT NULL,
  `tipo` enum('montaje','desmontaje','mantenimiento','traslado','revision','inventario','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','confirmado','en_preparacion','en_ruta','en_sitio','en_proceso','en_retorno','descargue','en_revision','en_reparacion','completado','cancelado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fecha_programada` datetime NOT NULL,
  `direccion_evento` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad_evento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prioridad` enum('baja','normal','alta','urgente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `vehiculo_id` int DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notas_internas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `creado_por` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `firma_cliente_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firma_cliente_fecha` datetime DEFAULT NULL,
  `firma_cliente_nombre` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehiculo_id` (`vehiculo_id`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_ordenes_fecha` (`fecha_programada`),
  KEY `idx_ordenes_estado` (`estado`),
  KEY `idx_ordenes_tipo` (`tipo`),
  KEY `idx_ordenes_alquiler` (`alquiler_id`),
  CONSTRAINT `ordenes_trabajo_ibfk_1` FOREIGN KEY (`alquiler_id`) REFERENCES `alquileres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ordenes_trabajo_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ordenes_trabajo_ibfk_3` FOREIGN KEY (`creado_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_trabajo`
--

LOCK TABLES `ordenes_trabajo` WRITE;
/*!40000 ALTER TABLE `ordenes_trabajo` DISABLE KEYS */;
INSERT INTO `ordenes_trabajo` VALUES (1,1,'montaje','completado','2026-02-16 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Montaje para evento: evento de prueba 1',NULL,NULL,'2026-02-16 03:48:17','2026-02-16 04:06:38',NULL,NULL,NULL),(2,1,'desmontaje','completado','2026-02-17 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Desmontaje para evento: evento de prueba 1',NULL,NULL,'2026-02-16 03:48:17','2026-02-16 05:22:23',NULL,NULL,NULL),(3,2,'montaje','completado','2026-02-18 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Montaje para evento: evento de prueba 1',NULL,NULL,'2026-02-18 00:19:55','2026-02-18 00:27:04',NULL,NULL,NULL),(4,2,'desmontaje','completado','2026-02-18 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Desmontaje para evento: evento de prueba 1',NULL,NULL,'2026-02-18 00:19:55','2026-02-18 01:03:41',NULL,NULL,NULL),(5,3,'montaje','completado','2026-02-18 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Montaje para evento: evento de prueba 1',NULL,NULL,'2026-02-18 01:29:31','2026-02-18 01:31:30',NULL,NULL,NULL),(6,3,'desmontaje','completado','2026-02-18 00:00:00','Carrera 15 #8-30, Barrio Industrial','Armenia','normal',NULL,'Desmontaje para evento: evento de prueba 1',NULL,NULL,'2026-02-18 01:29:31','2026-02-18 01:32:34',NULL,NULL,NULL),(7,4,'montaje','completado','2026-02-20 00:00:00','Vereda Carrasquilla','Tenjo','normal',NULL,'Montaje para evento: revelacion de genero Nia',NULL,NULL,'2026-02-18 01:42:50','2026-02-18 01:45:15',NULL,NULL,NULL),(8,4,'desmontaje','completado','2026-02-22 00:00:00','Vereda Carrasquilla','Tenjo','normal',NULL,'Desmontaje para evento: revelacion de genero Nia',NULL,NULL,'2026-02-18 01:42:50','2026-02-18 01:46:29',NULL,NULL,NULL),(9,5,'montaje','completado','2026-02-21 00:00:00','Vereda La Armenia, Km 5 vía a Circasia','Armenia','normal',NULL,'Montaje para evento: boda de ander',NULL,NULL,'2026-02-20 16:38:42','2026-02-20 16:59:37',NULL,NULL,NULL),(10,5,'desmontaje','completado','2026-02-22 00:00:00','Vereda La Armenia, Km 5 vía a Circasia','Armenia','normal',NULL,'Desmontaje para evento: boda de ander',NULL,NULL,'2026-02-20 16:38:42','2026-03-07 03:17:57',NULL,NULL,NULL),(11,6,'montaje','completado','2026-03-11 00:00:00','Vereda La Armenia, Km 5 vía a Circasia','Armenia','normal',NULL,'Montaje para evento: boda',NULL,NULL,'2026-03-10 00:11:15','2026-03-18 23:33:49','/uploads/operaciones/firmas/firma_11_1773876829175.png','2026-03-18 18:33:49','pepe'),(12,6,'desmontaje','completado','2026-03-11 00:00:00','Vereda La Armenia, Km 5 vía a Circasia','Armenia','normal',NULL,'Desmontaje para evento: boda',NULL,NULL,'2026-03-10 00:11:15','2026-03-21 15:10:49',NULL,NULL,NULL),(13,7,'montaje','completado','2026-03-27 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Montaje para evento: evento de prueba 1',NULL,1,'2026-03-27 21:15:56','2026-03-28 22:28:58',NULL,NULL,NULL),(14,7,'desmontaje','completado','2026-03-27 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Desmontaje para evento: evento de prueba 1',NULL,1,'2026-03-27 21:15:56','2026-03-28 22:36:18',NULL,NULL,NULL),(15,8,'montaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Montaje para evento: evento de prueba 2',NULL,1,'2026-03-29 01:31:53','2026-03-29 01:33:08',NULL,NULL,NULL),(16,8,'desmontaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Desmontaje para evento: evento de prueba 2',NULL,1,'2026-03-29 01:31:53','2026-03-29 02:47:02',NULL,NULL,NULL),(17,9,'montaje','completado','2026-03-29 00:00:00','Vereda Carrasquilla','Tenjo','normal',NULL,'Montaje para evento: baby Shower',NULL,1,'2026-03-29 01:38:08','2026-03-29 01:40:33','/uploads/operaciones/firmas/firma_17_1774748433642.png','2026-03-28 20:40:33','luisa b'),(18,9,'desmontaje','completado','2026-03-30 00:00:00','Vereda Carrasquilla','Tenjo','normal',NULL,'Desmontaje para evento: baby Shower',NULL,1,'2026-03-29 01:38:08','2026-03-29 01:43:19',NULL,NULL,NULL),(19,NULL,'mantenimiento','completado','2026-03-29 00:00:00',NULL,NULL,'alta',NULL,'Generada desde orden #16 (desmontaje). Elementos con daños detectados durante checklist.',NULL,1,'2026-03-29 02:46:31','2026-03-29 03:21:00',NULL,NULL,NULL),(20,10,'montaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Montaje para evento: evento de prueba 2',NULL,1,'2026-03-29 14:08:48','2026-03-29 14:22:10',NULL,NULL,NULL),(21,10,'desmontaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Desmontaje para evento: evento de prueba 2',NULL,1,'2026-03-29 14:08:48','2026-03-29 14:47:16',NULL,NULL,NULL),(22,11,'montaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Montaje para evento: evento de prueba 2',NULL,1,'2026-03-29 14:08:55','2026-03-29 14:12:56',NULL,NULL,NULL),(23,11,'desmontaje','completado','2026-03-31 00:00:00','calle 1 23 40','Bogotá','normal',NULL,'Desmontaje para evento: evento de prueba 2',NULL,1,'2026-03-29 14:08:55','2026-03-29 14:46:17',NULL,NULL,NULL);
/*!40000 ALTER TABLE `ordenes_trabajo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL,
  `token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked` tinyint(1) DEFAULT '0',
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,1,'7f281b37fd409fce1ad27a129d55f4ad26ec0113634af03cc82415300da0911b29f94d3567b892dcd70056230f494237c3202cde30df7c97b6e712aafe8eed6c','2026-01-26 12:21:10',0,NULL,'2026-01-19 12:21:10'),(2,1,'85c6dbdf50f3fc3ca1d75793410ad5662859765808b9b869417a41de26ea0b31365a194cc70474793fbcfc2087848d8af7c533fe06170cef31feb943f73cb753','2026-01-26 12:41:28',0,NULL,'2026-01-19 12:41:28'),(3,1,'19949ec1a1417f80d3a69ad7b68dfff3199b84c0b1ff5aad211c56b1f043969efb9d304ad03dba3b8430b9e53701b72afc94e038e38cd8efb18b1d43cc618d4c','2026-01-27 00:20:14',0,NULL,'2026-01-20 00:20:14'),(4,1,'0aada4a2f3aa8677c0833ca068d3ed6a5ae450fbcb19ae8d362d5f7c10bf106132f68a36c693145668641104e9bc16a4d479d95bf6ef4b3eef35ae2f3614d150','2026-01-27 00:38:33',0,NULL,'2026-01-20 00:38:32'),(5,1,'256417e14a91b2be9afd41b7091b1189f7876ea6dd3c0d94d0dea77926d070e615a3cb52e18749b194cd9ec335f2bb9f68e49e864120427cc86461d953d250d1','2026-01-27 15:31:15',0,NULL,'2026-01-20 15:31:14'),(6,1,'fea0eb804caa30bcc005405c513f9851ff210414779e4e5e1ce5f8af8dd94a357b5e46ce6d1aa78b976b70fee4cc964ad3415922c7366af5b6ed9a68def5bf68','2026-01-27 16:57:51',0,NULL,'2026-01-20 16:57:51'),(7,1,'c40c3c1e62a41b82bed179ebbe70befb31fd1a3ac2fae84057eaaace0ef7bafca4fc8736cdf0e15aeb96018e6ffb501be03595858c1b75e8de4473089277c4f3','2026-01-27 17:13:19',0,NULL,'2026-01-20 17:13:18'),(8,1,'bd25f8d811a9a5d03bba6927350eb0dbdf59053a8635636e01d9e1f90ce88125079b9416016706de685c18c0629acd54e151b208b6b9cff08c746482db7c29de','2026-01-27 19:46:08',0,NULL,'2026-01-20 19:46:08'),(9,1,'261c05ab46eb9893cb5f3a7df57d973b577a5c6ea3c4b1f2c5ce48505bb4637fd83d792a144f83574927f53a0153b5df0811e2b6bd182c17e952f6e706d80f6e','2026-01-27 20:11:38',0,NULL,'2026-01-20 20:11:37'),(10,1,'80cde37a64d8d5efac0b90d7cbf6e7b03d731addeeda41c157a767d412e937f08a59ed6899c330fe39d80ea40badbe3721862b0ddad86a637c42122e54993ace','2026-01-27 20:32:33',0,NULL,'2026-01-20 20:32:33'),(11,1,'07617d016596aa4ea2c053073796c15431dbbe576df6ba51b8354f906d20088889dbd3431488ade9497b821caa9397137fda8644931ca00ffdae6f4ccff9cfd6','2026-01-28 02:00:09',0,NULL,'2026-01-21 02:00:08'),(12,1,'e7763154e06ca8577d62895f65512d187902834a5171d94db907609fce4bd4c3024274511b6be9cbe545d5d3afb093364aaa7b9e42372e7cd0abebd4e3455f97','2026-01-28 02:17:48',0,NULL,'2026-01-21 02:17:47'),(13,1,'fddf8db7869fcf909405377d72f4b86ee23ac3553446edfa076c13af6cf428ba168ca8ddc624467b01eb211f11c89fbc7e1324ff36f25b40226a30267f2288f5','2026-01-28 02:39:14',0,NULL,'2026-01-21 02:39:13'),(14,1,'7b4db1b7f74a70806bdd34e74e722397bf0c36c22f0edb3fd6c2bf721d584a1a87becc5ceb90258f5383d75c052151a26d674262dbc642837f5f023ecad9a91a','2026-01-28 02:59:48',0,NULL,'2026-01-21 02:59:47'),(15,1,'16ff012c6f31780f2453f3dae2903a20eeb3366b4d87d8a6f43cb1df96b8159309e71572fc382457fa7fcaff62a99c9aab8967b73c271affaf2eda26070ea067','2026-01-28 03:21:13',0,NULL,'2026-01-21 03:21:13'),(16,1,'ce1e3387ec3e170e68c5b26334ad735a4df67429a117fabdaee951dd3c9e583cf9ca8a24028c3277360d83ea750b8160b02006f4f3908c9265d03f3ad3e6fba7','2026-01-28 13:55:06',0,NULL,'2026-01-21 13:55:06'),(17,1,'cef80cc32135d3e4fd1293ae53a61da8e1fe12a010e75aa4b69ffa9eee7cb0a2ee5d36125d4a3c2f6e8c832afc12c997deffd37db16cb2c8bbcb309c4005b117','2026-01-28 14:14:05',0,NULL,'2026-01-21 14:14:04'),(18,1,'3bbfd2a9a2a4f9eca56229329be3819a99217cd5304dfa88b4b7914a7edd3566a00d184fc0d9cc453101367de017a24f9953cb0293f6cf6f078c3d6cbd6a24a2','2026-01-28 14:33:39',0,NULL,'2026-01-21 14:33:38'),(19,1,'78eedf10f9e856f024b2ab38c63c9ba63e5bf2e096471c2b0e62dbe29761b45bb98b4d985cf4153e473a53d6f375fa0fa16e19b6404c6701ebd522b979392f0c','2026-01-28 14:58:23',0,NULL,'2026-01-21 14:58:23'),(20,1,'2af521814b52dd7d7885167d6c35834cefb2898ac396f1aa12d5bd5c9b286cf5677fa7d90cef3978e5347010499cb27a210760ad5c48574d828c50f17a87af83','2026-01-28 16:48:15',0,NULL,'2026-01-21 16:48:14'),(21,1,'b5bd70a32b01e68255b5138840d8f1997914078a6892e6c53dd075b3cbfb2934c1f8be2d5d42e162ca8f44417cf199ddf5278920dbd983be1c1a4a4820453802','2026-01-28 17:29:28',0,NULL,'2026-01-21 17:29:28'),(22,1,'3a5f627ed409d0b5e70fbada61773a550198dd955e122a998d30e556769a9a25dc9721b9a0fcb5bd49915f48d391d37deab2c81ac273abaf16a14024184dd844','2026-01-29 01:57:08',0,NULL,'2026-01-22 01:57:07'),(23,1,'a8ae3b7ea53e30cca47c9200c6443f6b0f47fb8e81752400dd75d2af8cf50ff0bda843547eca678c1fba11f9b85975fdc63948e6893606e4fe0eaf2f599a838c','2026-02-01 16:26:56',0,NULL,'2026-01-25 16:26:56'),(24,1,'fbc1420000d2ed55d7f3475f29f10d4346ed775951bc3a57a87a60dec3e8aecd54ccaafe9c1ef7d361341a85729c78d66760bc5f3edc000c5658b922dc271754','2026-02-01 20:48:05',0,NULL,'2026-01-25 20:48:04'),(25,1,'5f8e188a43cd4264fe127d4c669ba0d45914c43c73410cb89f5248c78726ec7c4347194487761488f31b3217b2d5e6b859865f9d36b6290d394610e7fb83ff9c','2026-02-01 21:08:22',0,NULL,'2026-01-25 21:08:22'),(26,1,'eb18619588329c65457d6e49988a40a1387317b8e8044e5ef4f05112b3b594e1776c6bbcfa4aeeed325e81d2125665a46d3de1684c633d9ae11ee9149870e463','2026-02-02 01:29:51',0,NULL,'2026-01-26 01:29:51'),(27,1,'fc203e90f72a9483ab6f3674850924edb1e0f9b5b7ac68fa4b5db557ea8aff0268338aaac28e56f5fa2ce65aafc9313f85620f49ef2fa4112d3a4a59ae4b86c6','2026-02-02 01:46:46',0,NULL,'2026-01-26 01:46:46'),(28,1,'b2d77c119635e77965899a0363fe202c13cb16b67d9d4563e049518202a65d5c70e8c6ae39669195abdc9cd7762ea7d846da4e9212ed04d38b06697f913460ae','2026-02-02 12:01:53',0,NULL,'2026-01-26 12:01:53'),(29,1,'dfe5eaacaf17bb38b4b6ef14da762bd88d416ccd33808c41b6afe611c951a39433921cb4f6d83d4fdc34f8cc42702e5a23d244fb02516fc40e7e6e6d69be2347','2026-02-02 12:23:38',0,NULL,'2026-01-26 12:23:37'),(30,1,'bc589759c47b8453175c009eb055f687df8df0f0952e359bf88becfcaf42ebd2ef30015226b5246c89f4916044fc35da6704507ab5347af33d5b9ca7a4bb67d7','2026-02-02 18:33:56',0,NULL,'2026-01-26 18:33:55'),(31,1,'6828f814334dc6f02c2e4295a05fc5a0dc5322f68264a4dd77f914c246814ad1ce8fd3200ccbd81dfbf7c39977d75ae89525599f2e301541d5d3c8ed80504bef','2026-02-03 15:34:08',0,NULL,'2026-01-27 15:34:08'),(32,1,'3d4e43d6a6a175d90fd3db8ebf81a51352cbe4fe7442adc4226384d86351668a39b6868f9644dcab60e68e32b40ff1f4497c81ac4351ce69f99dca85970f0d62','2026-02-03 16:00:07',0,NULL,'2026-01-27 16:00:07'),(33,1,'73ed02cc82040a261c32eaa8452707f731e528d20ef416d4d57862e3a16ff666b8078b10b771e91d8118f5e6a69fc9c1173413be06b1719ab21cd97bb55b44d0','2026-02-06 20:53:05',0,NULL,'2026-01-30 20:53:05'),(34,1,'979a232ab9187f4d01da19ed88160894b856b4392f91cdd603be69935d52acfaa4c6fce75b353f63f68738abb6adca2bd100b5813f36112358bd5285ed6c34f6','2026-02-06 21:21:41',0,NULL,'2026-01-30 21:21:40'),(35,1,'4a21fbd266a649932633a324f23233dc65fbfe36e53d697393457789129225042cc1d207ef0ffe265174bd615bd4f1b4950449af33455573ff351ce277f7f88b','2026-02-07 03:19:12',0,NULL,'2026-01-31 03:19:11'),(36,1,'09b77c1c459c1893381e997b135ca0c4e926fe17139b78c12c23a2ccb4e5bc26fc6b1df3c725d181f528902078446e9f23d132010b1e472c2e6695109bf789ad','2026-02-07 03:36:02',0,NULL,'2026-01-31 03:36:02'),(37,1,'6c3225db0e4546ea1b004cde2b2df78bf6bad9d97b9163b4f87438234b6f293cf76b0bb5d0161677d89b3c780d4a3af046cfcecb7d3c27751783b25e27eaffc0','2026-02-07 15:34:29',0,NULL,'2026-01-31 15:34:29'),(38,1,'5729d9d94ae369b999899ce5a1512d299f7a9114d6f2faa393d434736734240ef8090adac86b0895fa6a07cd746dd428588410318d45f6b12b50dc91ca8e72f6','2026-02-07 20:57:02',0,NULL,'2026-01-31 20:57:02'),(39,1,'02ed0ad7bb32b04a4a609f77130b7b6386dabcbb7481b67705750e13a41157df83404d426308d8942a40fa60a00339ca7beccff718548b9f13ffcada80cf45dc','2026-02-07 21:28:34',0,NULL,'2026-01-31 21:28:34'),(40,1,'c46384e2df170868c5f4668a853958a8813fd476c1da7c46614d43658e2d79af756d03f0dd6de9253473db65446455daa9ff0f0eeb66066488817d20f3c2d74e','2026-02-10 00:12:55',0,NULL,'2026-02-03 00:12:54'),(41,1,'30a086932cff9245bafd98fb64147f10426d2846a1953f4235a1beb965760ba696b7b6c3daa868ff72519c90a5b059803b3197184499c4256be90d74c512bdb3','2026-02-10 00:34:12',0,NULL,'2026-02-03 00:34:11'),(42,1,'cca19eb5e08c7c8c80c634d81ddd2857a11cbf9c842e97618dfd0d96f49fe48cd70de85c01adeedfe62889b200eed8c19e016c348b77b3591fc8c76dc71df303','2026-02-10 00:50:55',0,NULL,'2026-02-03 00:50:55'),(43,1,'81b241185f251d5bd9d6f428e1f6f5701ecf6d2f286885a29030d2c0764a831a4a73467f9dcd7be403019f5f5b4b12a8a7391a0e7eb0cd0d21170de8b9913cc0','2026-02-10 01:19:29',0,NULL,'2026-02-03 01:19:29'),(44,1,'2d27a3882cb044676276c28c3d0eef93624301e02080f1bd1a3024ab22b04d89517e210609dccc47ba6085d1b6f744eaca0bf348320a9653bb48c5cc798667a5','2026-02-10 02:23:09',0,NULL,'2026-02-03 02:23:08'),(45,1,'0b5a6e16ee85fddfddbad68054ac3291f3a6bc5c0d0d3f04780c9c4961760089fea2da9d70ea7b1d99d6ca3a157a786bb670110e3c709da766eeb55c1c05e498','2026-02-10 14:46:46',0,NULL,'2026-02-03 14:46:46'),(46,1,'91cb9fc29045a33e87dc3793e825b5d1cd4c7e16f986d6b0e8dc89df22e73a688f502385670d25470fb704ca38569de5f85066911f7e19dab86e4eaaef2f751c','2026-02-10 15:03:10',0,NULL,'2026-02-03 15:03:09'),(47,1,'2ddf04e34e914804e13406dadba3ed079a47924d21ec8069fd85ec30a7e980e70ff32aab63d56326d39cc058e148aaaef08c5e7a482663a3f8ae7c48866f5ba8','2026-02-10 16:28:33',0,NULL,'2026-02-03 16:28:33'),(48,1,'71508144660c0158389954ec6c2ab9859fc90cde447e92b11b1d65b78e9dff31bde77503e4192b57a11d310c71e642fada86de3513a44241e07cbec74a70b9df','2026-02-10 17:04:26',0,NULL,'2026-02-03 17:04:25'),(49,1,'d6f2939167b73849c165e76391c91f4e1b67bf044aa47acef25baa7609cb1ab91dbfb1a3889aeb76b19728d81aea9fc20b5dd08e8638fe18f6a65a93279eb3a2','2026-02-10 17:35:18',0,NULL,'2026-02-03 17:35:18'),(50,1,'ed0a51f8af50b472b0919e75c13d3bacb6ae82910d05c408d5c242bafa0d11a87992b9bf1c9fee3e1667a549c1b6d4ea0af0845d81d48c2706a74974308fcaf7','2026-02-10 18:07:30',0,NULL,'2026-02-03 18:07:29'),(51,1,'77f02767c03f948694fac970f52689358fa3744c766b25dc919e266c99c7abbc0f8509fee2ba7554c6e1fd9d04940e7529dac0ce0e507d884ed208f18d441226','2026-02-10 18:53:19',0,NULL,'2026-02-03 18:53:19'),(52,1,'671fcf927014b201a016e8841ccaa84a5fc4511159226e53e03d1db0af4b61b8813c80cd3cde1c0a0b518ddf49b20d0bcc84809a04e84c8b3395b5287116afd1','2026-02-10 19:30:49',0,NULL,'2026-02-03 19:30:48'),(53,1,'27f7a4f64f47181d216950fecaf936b572288d44a70b67d51a29bd31bcbf50080941e1afdbd511e0f0dfc108a338a1b30681eb38243de6746b99f6008ce7d676','2026-02-10 21:02:27',0,NULL,'2026-02-03 21:02:26'),(54,1,'55d8bb474985c4a3e4eb6dc6a02fbbf403e991d4a55e3abb6a67f4b55cbcf9d1cfe0ae1e458ab6ccff9e7e8f209aade28b541dd3a50795b4b8362628e0838c47','2026-02-10 21:31:41',0,NULL,'2026-02-03 21:31:40'),(55,1,'6ea12722348135681006ec40d9080cce0c26f086d32db11a620660556c8779d39082699765f3d0b17528bfd8863e37d165ec97885cb8ac0aa35d992b52abf751','2026-02-10 21:50:51',0,NULL,'2026-02-03 21:50:51'),(56,1,'275f248c8397c131f808b0320e3c25af5b55899b73a98057a5f9cbe44571a3ffb25d0acbf206f81ad77fcf3f02d0daa352e64554e02a3ce0615bbfed1dde138d','2026-02-10 22:42:48',0,NULL,'2026-02-03 22:42:48'),(57,1,'fe1c2e7b1f526244e711f26aa45c876d76ec1b7cff0d1fcd6bd0e97e501d16e4a2d1466fadd8c8d4fe33a522219a806c957898f0eedcc71366ab5d16f43d5a0b','2026-02-10 23:32:21',0,NULL,'2026-02-03 23:32:21'),(58,1,'d518aece679151a742442d2349a8cfc4de8cdd8bb6bc247b886c08c3d9bf40dd3b6cf5ba24c12a09f750333880d65380f5f65ff403e739aadc6e6a41320c9a80','2026-02-11 01:18:39',0,NULL,'2026-02-04 01:18:39'),(59,1,'f6137b9c19545436db657440f932b4b111cc377aa9eb396642cfc5b9d7bfad5df458d7d1281f580015935a3607dc5847a854ba3b80c4ca0bbaa225f871e40bed','2026-02-12 02:46:54',0,NULL,'2026-02-05 02:46:53'),(60,1,'185eb72a00761435c71cdb1e76326acad335ade52813e7f9c008d2741d3c00bd9c57613aa24d78494fe45441b1d7fabb3b8842b37bd867d02ba1335441f98076','2026-02-12 03:02:56',0,NULL,'2026-02-05 03:02:55'),(61,1,'277c3a5e47017339697c2bf36c42e93a4cdd95a9da98052b797aa0bea66a969bffca8d53e90d3490afa99ac50f367d81a60ab54cf25cc24de900182f1bc014d7','2026-02-12 03:36:00',0,NULL,'2026-02-05 03:36:00'),(62,1,'ddce21f22f567883f715f22c261c4164ddd2e1ba2ac88f0f497ba2c521de96fcb634fbaa65ed5e88b768b7e93270a228c6b7f62e8a237c0ff8b80ce8e1aae309','2026-02-13 03:14:01',0,NULL,'2026-02-06 03:14:00'),(63,1,'55ae4fbcaaee0e4f32e41d7a283a1e317ba517a2bda30e3a4ef051b112c7467d3dfaf1790217455e2817de8b4b93d2f3799e7c91b350e0267b1d214a1965427e','2026-02-14 14:07:35',0,NULL,'2026-02-07 14:07:34'),(64,1,'35e8cc13f3aeac86717b9042d5ccd20ea7407482a939507ac85a3074dd00a9d0cca508a0fa4c6bdd64da261135eb60ffabb102b8402471b7db013438da03904c','2026-02-14 15:02:43',0,NULL,'2026-02-07 15:02:42'),(65,1,'5542edccb7ab69e3ac7fc5d495bfbce84a3dd978081513ddd458e8d39fd0043e8031fa3a47125f43d1e19b7307856e1e9a714e271f37a7e7d6f0f5ec6db98e34','2026-02-14 15:58:58',0,NULL,'2026-02-07 15:58:58'),(66,1,'1be58ba9f5e5e9ba38569ef33f03892bfab2addd117134c9bb2d9d6006adbe6a762abc3aae87293390d6d1773b2c8f683e2e34c9a25cd93be3ec6b96ab1e792a','2026-02-14 16:19:15',0,NULL,'2026-02-07 16:19:15'),(67,1,'e76a7ee6c0bca8aa62713c5ab121e842be41ed78b885aafc19b45a48b08855cac163abbc4f8ada0b09db7520fa6b9480bddcc0eb654cf098fa2df4ead6d2d17c','2026-02-15 02:37:12',0,NULL,'2026-02-08 02:37:11'),(68,1,'e012f3d7d4ea42a7aef69e7edb2cf7b1835e494de81e4d5d3d4f2eb6f2d6f6cf6f0d362ecf89ca8c4e48a8fef395751ca1ac3d4e5025e08695bf910583d6aa37','2026-02-15 02:54:46',0,NULL,'2026-02-08 02:54:45'),(69,1,'8b53933270e1f18dd669d36e248877ed5938f1b29bcddc6f5ed8bbbd474e5e48c42e0f792055f8419af66d20ebb172a9057fefa5b53ed37ccf9bcf8b907cd8f6','2026-02-15 14:01:27',0,NULL,'2026-02-08 14:01:26'),(70,1,'209a23c86c30fda818967156480bc80b85a8fc148a67bf7ff3d41272945df47650482592125e1231666fc0b130a5ae4717c9baa20ed3766329755f2db5d84cbe','2026-02-15 16:10:45',0,NULL,'2026-02-08 16:10:44'),(71,1,'d0c4b34690cfff9d98fa6e7ec52d89c496266cbf75fb36ed1978b2a919429eb76dc2894c03a06be0730730f4b99a161e4d40051bd78784192a9ab7af6e2db8ee','2026-02-15 16:25:54',0,NULL,'2026-02-08 16:25:54'),(72,1,'c1394e1eed94550e7741816667b55de4bbf869ea02904c78660ee59a6ec21d4f42f2d78c847b995145d73e748f3ddadf0f448d74b5cf61187935b11bce218a66','2026-02-15 16:51:00',0,NULL,'2026-02-08 16:50:59'),(73,1,'6adfe4333136343b9e222e5e550f111fd62d1f7f1be8d856126f3b277a5dde6c31c90b6a61bc5aa030903948578bd14fbc5d30ba279487c2c6d3032d87dce867','2026-02-15 17:07:10',0,NULL,'2026-02-08 17:07:10'),(74,1,'224d49415355ed91994e279cc592738d32aca9c4a3e90a8bd63073d315cd26b161824153ecb10b1dabba24613a49a1dfbe390484cb9698ebee36bc881334a55a','2026-02-15 17:52:00',0,NULL,'2026-02-08 17:51:59'),(75,1,'efc41de79a38c9bba943fbb5a17a18e13c4b951f88ce9efe207cbabb8720548dce80e2681089b40ae64b1275151d946531c73e5b97f5c58be32cadf32730b582','2026-02-15 19:42:47',0,NULL,'2026-02-08 19:42:46'),(76,1,'a63cb30b54b6c5a1d803d870cd2b12fc9700b43ec2423844d796b1d1bba3bb6ee16da311cb19d29bd31718b3cb26477f6ba5bbba7fde493c7741dd1bca86155a','2026-02-16 00:51:18',0,NULL,'2026-02-09 00:51:18'),(77,1,'2dfedfa14690d83332327dfd99a21f55e4a54a12cab140fd3506453764762d195ff16c32bb542728ef5e6d9bb4562397cb96107cefc33765ead1507797ece4a4','2026-02-16 01:13:10',0,NULL,'2026-02-09 01:13:09'),(78,1,'0f068085f376f2da203441bce2134e24e1d779b02d297654855dc84ac5e4c43aca1b0bfac0a943d56441b771ab08be0cdf7018ab5a53f764025281654c3f471c','2026-02-16 01:28:37',0,NULL,'2026-02-09 01:28:37'),(79,1,'d502ca3199109cce82d7baaa5f5f0e166976ffd01f71dd44bae1c0be1865d42611a53767336d242ed856cdea86a52f84a737c09fe8ef824f261a7a11fc1ef677','2026-02-16 01:47:29',0,NULL,'2026-02-09 01:47:29'),(80,1,'b07fac9c5975adc9203304c6f3a96a357a7ce43ea7df7a0e59c4db71a1998484fc1055ed187619bbd2a1c0c621d8a50b9b37fbc4ab74bc3dea8a0e7616fffb7c','2026-02-16 11:33:58',0,NULL,'2026-02-09 11:33:57'),(81,1,'8b2230788943fa69e67ae80b13ef3a6152e07c39e6bc5399e7fea157c5f4de864c261b29e6d0057ae48865eecc35c605b5caf00e7c0724ce6c13c13d5808bb3f','2026-02-16 12:10:00',0,NULL,'2026-02-09 12:09:59'),(82,1,'091c11b9a8bf677a6e72634efb5727f15bb088286a9045e18d800d3ea22d5e1aa91e306d734ed1f8161108836fcf0e4564a107ebfc7874cc40f5fc5bacf83bca','2026-02-16 12:35:47',0,NULL,'2026-02-09 12:35:47'),(83,1,'0117157699318b683d8e9b0f72e8798f4cad8e39db3d3f7ff1f63f84ff4091df01aab4e5412f104aa9963fd3c6649f7b20859ba1802007be7920710b6a5c5331','2026-02-16 12:53:41',0,NULL,'2026-02-09 12:53:40'),(84,1,'4e4ac4c780b3e8164297375a1bd1ba3e380cd96ef411ca3ed9bb161d8366ce0fe844c9c84370801a2e7a15bbc879839bc5318c51726181bf00c4f67148dca4d7','2026-02-16 13:20:44',0,NULL,'2026-02-09 13:20:43'),(85,1,'1620087e03f693277ecd3cec79181fe3f2130af2ea52661e1c9cc1c571d328beca00744c99b53afa505e1388882bac987b6717a57ba5685292dd30e84701b14a','2026-02-17 02:48:07',0,NULL,'2026-02-10 02:48:07'),(86,1,'f3eba82cd248a7426e895edb4620e6f50a608b1d0bbedbf00605a5799712d9fd3f819930209c636ee27b0c40d7082da9c2b2cbfa75626271d8ee1d12c550b517','2026-02-17 03:06:07',0,NULL,'2026-02-10 03:06:07'),(87,1,'2ba8d74058b58ea28cfaceab42c314ad796884e2e8903a7495b09644eaba88673134bd4d7b4716a698dd08aa0ddfe7e613bba5fc11484d74af306c5e2fc00768','2026-02-17 23:27:16',0,NULL,'2026-02-10 23:27:16'),(88,1,'ce542db8059367e0302e9d690fba0d535867aac958cd5bade994c012166b585d7643cc42e25686fe9f143584db5feed68c413e551cbf15215ef72aa8d77c9586','2026-02-17 23:51:07',0,NULL,'2026-02-10 23:51:07'),(89,1,'640e0e9b238c3ff342a9befc9104b179898151d57f5f8854b1621a4287bea256d362d1c357e1a6d1d4bb6ab3d18ca73c2e78b8870486df1c4e5a49df28d91a80','2026-02-19 23:37:35',0,NULL,'2026-02-12 23:37:35'),(90,1,'1856d4c7c8ba7bf525a40b63aac4a55c4d164caec78449e35de5ad4f93f894c2ec61e661fd1972184554c90da4b2a86498977e5d21bdafe626b57bfef7f252bf','2026-02-20 00:19:02',0,NULL,'2026-02-13 00:19:01'),(91,1,'e36ea7ca16ac5060f74dbaa93b7c07baf7d044ba191baf620ac37135793f8601cefcebc62f69d55cc2ae2933f90277610ef17a3a02f696cdf8b3fa740f1b1454','2026-02-20 01:02:57',0,NULL,'2026-02-13 01:02:57'),(92,1,'f171b540b87e54b5f611301f8316d555374ede7aa066ee7f7bc13ca3b9f7f78726ec2b68292b147f8e912910568f15c6e59f3bb3044b817f72c6dd8e2dc0d7af','2026-02-20 01:38:05',0,NULL,'2026-02-13 01:38:05'),(93,1,'8d90111d350e528886fa7d4c7816402acd45c298269ad81719d914decf3d4d98e81469ae9c5571d1e027400ba060d512adc3d42536a9405ea63d789150c39012','2026-02-20 05:18:09',0,NULL,'2026-02-13 05:18:09'),(94,1,'cc31bee6bfbfbf2427032447c628dab6f74f702cccbeae05a9e8cf3f933e71569dca5b171d033376c94dc62f3e8eeb4bb2f55d2720e901d901d5b9d4c576a4fb','2026-02-21 13:19:50',0,NULL,'2026-02-14 13:19:49'),(95,1,'a9c376e8db86f0057de5f4379f52045d98e2dec1a9b65aba30b12a10838f203686832a2f82c18a63fa1e093f34298a16a2fce8e494110e0f556be123c9fc197f','2026-02-21 19:07:50',0,NULL,'2026-02-14 19:07:50'),(96,1,'68043a572eb1527c7e573ab5ef650c4bf361c3ace5fb6a8a8a811b5d53dcb392affd8a0ad3bb5438d25947ad01e96ae510cb5c5f99d1ec60a342ab17bd2ab19b','2026-02-21 20:52:08',0,NULL,'2026-02-14 20:52:07'),(97,1,'b70fd4cf25006aceedee125bbec3f6010dad9fb9f2438f84d3d679b4cece7c640d277a65c23cbd4661735b8209752ecc32d05efb1fa2b83a25ce76e7756df90c','2026-02-22 03:34:33',0,NULL,'2026-02-15 03:34:32'),(98,1,'f2bef63b62fb98d41e4beea7d67b311fed1af0caac589e46095cdff07e094806d03f6d1b5c4b0d8e929de443e1cc2b9b5e26dda79d07e413d722ea126b73ca8d','2026-02-22 12:19:23',0,NULL,'2026-02-15 12:19:22'),(99,1,'e6ff3a9bed1843ff71778268be157d5cc7d11d2a8bb565e0c28f044c4d0e5f419dcb7ddc3dfedafc7178e33507c60bb86a041c4481f3d0f1141e644f84ccc934','2026-02-22 17:56:04',0,NULL,'2026-02-15 17:56:04'),(100,1,'8d66217b8b77790161b35c0605f1d7202eb4726e1d601ceb1b421a2b8c2ad41deb9e8c40d9ffb6cb1467df4ba3c1e545355f2bd4dd49d30b93be1e579838b782','2026-02-22 18:18:09',0,NULL,'2026-02-15 18:18:08'),(101,1,'b6c41cbceb21669d4ebdad91eb212f63577fa9684f558186604c3b3b4a899b03a2bfdec9dcd40672da3f97a99e5dbf4e776b091a41a4899c96e7f856b4ae4e95','2026-02-22 18:44:20',0,NULL,'2026-02-15 18:44:19'),(102,1,'3e7dc86c700ce73b60fd8e3ddf50d4901b071d87a1e38e9981224c1352ec1b4dcc470c6fa6aabd6e0b8d0517a5db5e2dd8773c6f4700aecdf33e21514e1d2d11','2026-02-22 19:38:18',0,NULL,'2026-02-15 19:38:18'),(103,1,'bedf4c4b814faf5322e8e55966f1fb1a7ae25e0408428f02508693b2221179eaf158aeba166d86c4c07898abc0ed7a6015d1f1f7d9ac5eb2ee2d43d700038de4','2026-02-22 19:58:16',0,NULL,'2026-02-15 19:58:16'),(104,1,'90d798755a5601d6b36b285e2757149c7922ccfbfe97699ab0c137674b2b6dc1f5df85f52b32af17a7cf7c07eda7103a5fa0581bd02e9d580867364fd45a55f9','2026-02-23 02:41:37',0,NULL,'2026-02-16 02:41:36'),(105,1,'e2223612d02da925f8283761c53317f64a3b7a4fbc0b79d7587973560d35e70f9f6cab5c1476facd79e33a9297807aec04297e1d3403ced0f289692875a88191','2026-02-23 03:22:36',0,NULL,'2026-02-16 03:22:36'),(106,1,'aad60eedf3b64a05dcc3f39557b07d3e861a2887dc5b960b8fd8e5c48b5bd7c6b208bcf384f4d070c6dc442927e7e931367509654f122940d7bfded4972bb128','2026-02-23 03:48:57',0,NULL,'2026-02-16 03:48:57'),(107,1,'e543e34754f5f37af60836d26a6bb8fd01cee8324fc4b28caa017fcd03f6dca0948ef5d20839d5c604c24ca012522c13a5a6c72b260999eda989903329c1234d','2026-02-23 04:06:00',0,NULL,'2026-02-16 04:05:59'),(108,1,'439f766a9d7b4284be19c24397a46cf36b8b87e6d58c8fec595eee0edd66736770e0301592d311509481ce449b97276a5fae1c4fccbbf32d0062cb1d0b49a5d3','2026-02-23 05:20:57',0,NULL,'2026-02-16 05:20:57'),(109,1,'14d5e017911813bda719d12cd87378d902b17225384b25dc0ed79f703195171d4f0e4f1a31d8ca02a3ac941af40184d9ba4ef6eb795bbf850e4f9b10b2e7dd24','2026-02-23 12:12:57',0,NULL,'2026-02-16 12:12:57'),(110,1,'8e07e1d956e5b06206424566ea8752a5004678ad89f4786995be54e7e57d7245a8008708ac3d054c83c6b54b20d31df2300f42f457a236a278b285f890cc708c','2026-02-23 13:42:14',0,NULL,'2026-02-16 13:42:14'),(111,1,'9c25f2ff8400acf4057b0fa88ecea9f84d01e342fc62da2ef04e9eca6b7722a70f76f8eebfd49bb00ffb794c4593241bb6eae9b1bb923022aed7ee88c8f1cab4','2026-02-24 21:59:46',0,NULL,'2026-02-17 21:59:45'),(112,1,'472dfa2b73b3992761b2721d55a837cf7ef84a3fa8e12c1962f8d230d8e9f13a63b1419b8b243ebc0f1c90881d7ba27388a04d9ff84d3afb9b845dd60fde374c','2026-02-24 22:37:27',0,NULL,'2026-02-17 22:37:27'),(113,1,'54554087a84bc018b9fb150592e6d77375db969e60fa9e93007b30e07b46a59ecc405a8a255789b9c5cada5bbd8f2c6f2871c711bf561cc2406990654850edf1','2026-02-24 22:52:39',0,NULL,'2026-02-17 22:52:39'),(114,1,'a1080ef4e4f5690cafef377f32c369ca5a3a9cef91ebb1d8aa78ab1de46f933de669d2e0436a42e24bd9335a81dd30c65d70162b28f3ac8a136e5e922d5ab706','2026-02-24 23:12:39',0,NULL,'2026-02-17 23:12:39'),(115,1,'ffd4ce3a8fc7048d57fbc55849f08fc7c3c38edaaac1ca8954303a0024e87c91d17526d76fc224f993c82f03616964d78bdce349b84da34422e966b1967a7418','2026-02-25 00:16:17',0,NULL,'2026-02-18 00:16:17'),(116,1,'acc6eefe1f821bc7e93ea3544c157d81c75cd7b0fb8432165af36bad54ef0ee2dc43adf457a3dff35b0dd89807a9506efe4bfd3d3854af94188356ed221e937b','2026-02-25 00:46:53',0,NULL,'2026-02-18 00:46:53'),(117,1,'fda063d9515e87ff8ca584a77adf9d52837706c8dc2c538d952b2f5232749d2e13b2827a9a1201800fd2bb667dd4e99c7cd577ef94d49e732feb02dbceea70cb','2026-02-25 01:02:13',0,NULL,'2026-02-18 01:02:12'),(118,1,'c4fad1ffad1de288aff9faa3eb5ffa2e319e5554288c917edbe76f4e4ec09311183b4ec4c2e86a9efa334f5b660bc41e5371dcc4d303fabe901ef1d645951c7e','2026-02-25 01:27:15',0,NULL,'2026-02-18 01:27:15'),(119,1,'b78a8c4b3e18471d104249f33c79b29abce8b5803d185971d8c6cdcf152f6cea8146ed47170d821d5454c007695edcc593388d2e10a0bb0ca7bf034052b703f3','2026-02-25 01:43:08',0,NULL,'2026-02-18 01:43:08'),(120,1,'7b08888fbb79bed4df0dd0880cc82a49ce5ec0225c7de856a474739c969a76f6d8f59ef3c536fb08b9d45e9a7e39e1387c2c749db4a127bac7d88b7b8e706c3a','2026-02-26 21:43:40',0,NULL,'2026-02-19 21:43:39'),(121,1,'f86ab7e2719e9d6e41956b934aa96be4c018d6017798b82d4ecbe2e6880973acf4d960ed360940be08c0d7860af18b4b9d3d9ac5459cb2d4a102f0615fce34e2','2026-02-26 22:20:54',0,NULL,'2026-02-19 22:20:54'),(122,1,'d37f74d0a1dc151cbbb5a8e30600dd8c46236ff16292353490acfe3fc945cf9b5f5cd108448e883c2c966235bb52ad39c0b84290a9808ff66a4207a2fca38da7','2026-02-26 22:42:49',0,NULL,'2026-02-19 22:42:49'),(123,1,'5ca56dee3777712d58bd6bad92278a6b693269f6dd49c236c5882980e576c09a51c5fa39271cb3a32eba3b5e8798cfab55aff13dc9fc3c752e41edb10113efef','2026-02-26 22:59:46',0,NULL,'2026-02-19 22:59:45'),(124,1,'423f91765488e564fc36632fbfbe70a3d1177577d657b360655a70351e3d2e7bdbbfaf392f87e0eeab0b20eca33f438521079631b567b631c8cf1b4f1c6c129e','2026-02-26 23:21:17',0,NULL,'2026-02-19 23:21:17'),(125,1,'2f87ab693ef4398b140c2ddf4057ffd30d2f99a4e6a77340173d812070ed6574366df9a5257dfd75a5974ad86a4babc3016ffeaf405dcd9aa716bf98765b9e0d','2026-02-27 16:15:53',0,NULL,'2026-02-20 16:15:52'),(126,1,'63e5426894d384ea17a94b7c89c56d0d7c3b4d8ae78083d5ef96e5539e363af376fd228a183f93c456feb5fd8b681704e354a416673a2a56433bd7282aa6d296','2026-02-27 16:41:11',0,NULL,'2026-02-20 16:41:10'),(127,1,'d47519494ba461427965b1fbc5978e1878c2b15b4e8576d75f7cc9586765a27c87fe488608b64d266662b890a6b1f8e28a6cc38229ba202e42d7528eeb8c753f','2026-02-27 16:58:41',0,NULL,'2026-02-20 16:58:40'),(128,1,'9cfbe40ca0be31da8a658222b2a4496595327cca1be9286d3f0a2a940c6e6f5c3e32e4077294bb768623400c832010fb95249bfec4555de2aa4fc70d79709d7f','2026-02-28 02:42:56',0,NULL,'2026-02-21 02:42:56'),(129,1,'0cd64427c8316fdee6daa5c424f5273574b827c1fa17f528707104c235aa7cedcfd92eedc59252fb253538aeaaeb2463f23589b4e6f04246d2c5b1b7d92afb0f','2026-03-11 02:12:50',0,NULL,'2026-03-04 02:12:49'),(130,1,'7c4c1772b576d564811b9e4afa4fd1db65dcb924344615b329d5e5175ec0fb77995821e8b1c83e3d7b74d91d3d5a9f676c247fa872fad18c2988718ceb3aa33a','2026-03-11 22:53:02',0,NULL,'2026-03-04 22:53:02'),(131,1,'3a1f025aab2f1f20b309ea8ee1d144d3a8c8e40e6fcf205b61445d285f741d3548876929b6e15edc62d52169d87c5ab6ce5fe8f9cf617843030ea9fa0c11a432','2026-03-11 23:19:34',0,NULL,'2026-03-04 23:19:33'),(132,1,'1b4244614d2045f307d4a381655ed19fe5ad4e1950225c3fd11038e3fd7249fb468674ae7bbb7b7739e29ccf047698c01bf8a1ebb5127b9fd4a2f7c59643151d','2026-03-11 23:39:55',0,NULL,'2026-03-04 23:39:55'),(133,1,'7df648249e65b165093f7bd4a75eb8c81418fbc1fe9cb0ffd925686422ae3c082d7576957b53bd2f34b76978b37beda6a317f0328d0ada787d462e61bf18e21b','2026-03-12 01:09:40',0,NULL,'2026-03-05 01:09:39'),(134,1,'884a7118b6f4ff4a5aeab209768e086734ce6739a9597b6a85d4d81069a61703be05e76989776bfe8463b03f7f20db62cdbbf406f48b686186c123a5999bb038','2026-03-12 11:21:37',0,NULL,'2026-03-05 11:21:37'),(135,1,'3afaba21ceaa3cffc93587988fd30652ba077e3188917d8048dcd46e77596103b85d203564a178d9b128b8798c083d5a574fd85053f8365862856b59e698b933','2026-03-12 11:39:49',0,NULL,'2026-03-05 11:39:48'),(136,1,'41143fcf002242a8a70a07f72323e15905a714840ee275cd405879f52a88751674eac6dd2cd0e4e217003ea36df47e7289784c49cd30f8753e8f39afcd6a8c21','2026-03-12 12:45:48',0,NULL,'2026-03-05 12:45:48'),(137,1,'835e8557c06b7e84860d08f9acb124de1ab66a63f8a35e006a7d90eaff4fa517ac04f33067f491baebb32e2afdcd89510b2dffd5dcda55c0c90ee0f51ccffb3d','2026-03-13 02:18:19',0,NULL,'2026-03-06 02:18:19'),(138,1,'b23c56ec05131d62afd5ae2ecac5b27ef2ca2e2c84c5ee0541ba6352aaa050e0bdcc996af9ef2914f5314888b7e608bdb3bdf4e7856dfbdd83b8a433e1c77b5c','2026-03-13 02:49:47',0,NULL,'2026-03-06 02:49:46'),(139,1,'f34432c36e2064f4fc7f0dfad734c6e5df50c207ced939d0d7940dcdb7b2a88ceed037520fb540f0e1993b811d4f4e7b185c69ca0b4b2346924976da3a57857b','2026-03-13 03:30:20',0,NULL,'2026-03-06 03:30:19'),(140,1,'927bfc3b3b675ad9593bd3e5db24abba6f505e935cbf140f83acd4566e79e0cf9779539a62baf8c19f95d59d6ef5476938e59307820359b20fe2f74b0dad9076','2026-03-13 13:38:01',0,NULL,'2026-03-06 13:38:00'),(141,1,'3a800ec2cc0ec597eea4830683f5ff0c9b2462bf223f09ca8afa29fffe279304f6c7fc08f95caa04ed1eb6d657d7f88d38e47bfd7f4f6e953f949bb588aee70e','2026-03-13 15:04:00',0,NULL,'2026-03-06 15:03:59'),(142,1,'6bc8bc31bec67c30001a5af8ff3c5b083f7d81392b798d8879cd817b40ba13796ec9c598a83dcbbf90c9ac96a611f320ab877f64f8a07a09dd51e4b122bec830','2026-03-14 02:56:25',0,NULL,'2026-03-07 02:56:24'),(143,1,'98d05007fc7a7f417bef12abf18fcfb75e28bc42aad6b246b6566efb9e7cd3c46be64b9416c25728bce95a898417e5b5285b87c1347986b0f0da468ee91d560f','2026-03-14 03:16:18',0,NULL,'2026-03-07 03:16:18'),(144,1,'59748607f594fba2caff4c3c8a3dcb6e3c12115215da6f4edf824fe9ae9629e530c1710cc992fa7fdedbf277744179ac7fbaa3ace54282541f797bf039a4e359','2026-03-14 03:31:43',0,NULL,'2026-03-07 03:31:43'),(145,1,'ae3d255574019e81d43178b3dfb4e66259866404fa972142d3562b44ff3c80f7055fb018c44a109d3733abe689c5f1ffa33e2c86c31ca727013ce9854a57589f','2026-03-17 00:04:42',0,NULL,'2026-03-10 00:04:41'),(146,1,'2ec1d0b3f2c7e5ba79cd9804615e5bb2457fe0dd6fabd6b9c234af7405c4fb79022ec6f8863291b10cb0728d1145afa210c3a55a193c16feccc7f2398c902df8','2026-03-17 00:21:49',0,NULL,'2026-03-10 00:21:48'),(147,1,'8da3864fd599fdcabfd841d1b2d545938957c8ae818581f02fadb9d6c9606ec792f2cc99f3921118a98b51e734f6bc5fecf47a3a5a4dae90e85edbc2def39486','2026-03-25 22:35:57',0,NULL,'2026-03-18 22:35:57'),(148,1,'02afec7ce8d23d0528f50320252a351a512c625ce1c8bb1914f5de1e7bc211715545b2161d7a4d76acc400d38aa97424008c73c127a282d445c60b11dc2f2bd6','2026-03-25 23:15:51',0,NULL,'2026-03-18 23:15:50'),(149,1,'cbf85bd9d8df89f9eda2fd2905518aba31841a6c03a85a6d4d15c8039cab463ceb74d4b5cd3e6ed3ade36c45309c3924a867b18bec4264dbd0a0559e708eacbb','2026-03-25 23:31:17',0,NULL,'2026-03-18 23:31:17'),(150,1,'a68fa25349f09a02d7c705b1ec2a3886366e5bd65b70b49cd835b3128bf2cd3e1fdaaed1b3ea0ad1e7d09e9b393b3c227bc1ff50a61ade3092bda8d84d3e0be9','2026-03-26 01:58:21',0,NULL,'2026-03-19 01:58:20'),(151,1,'c22cab002d5f7a62ff46c69515c07649c3b4e53fc40a68710c6f00b3a5ff76f387046c6864fde99108a6f39d84d3e81d96253afef3faa0ae5ed1ccc0d7b42506','2026-03-28 15:10:18',0,NULL,'2026-03-21 15:10:18'),(152,1,'29204d699b3afa7cacb9dbad6f4d29a0ba2ede9cda636d07a8c4ac9420b41882728670fef5c8a2ad2415097285c2e1a84a8d37e2d506db3c05b783a4331e4f5f','2026-03-28 15:31:23',0,NULL,'2026-03-21 15:31:23'),(153,1,'d90d05f967f3566eab3a49cd12e3bbfde7ea50414efeffa1fadc33a61c47dae3afd591dc2f9c3d1de77fb62759f4a8659b8e30ffd60b598724c3c7edcd9cdd8c','2026-03-31 01:05:42',0,NULL,'2026-03-24 01:05:41'),(154,1,'5fae41930371b624cccd9bebaf3780bd2243d8fcd380795074d9706ce147da64bb7ec228376dfcdfbbf3e323430280acde1c70755087b300fa0b58d708b7a883','2026-03-31 01:36:14',0,NULL,'2026-03-24 01:36:14'),(155,1,'96b454bca61eeac23cd8605b915e6efd9dea1a346488810b9557c2f617eacde3d3ae9089355645f9c31b417606becf4f80b306e553ae7c1ae446c361b57186c8','2026-04-03 14:47:41',0,NULL,'2026-03-27 14:47:41'),(156,1,'8d84805eb9cc4509a65d002a2ba9957fd1539f8ba5a82fe7c5efe1107c509d39e536e6bda86c1f993121e06a4bff77e4849ecbf6877ac6169394d7b6a709d361','2026-04-05 01:26:31',0,NULL,'2026-03-29 01:26:31');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permisos` json DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','Administrador del sistema con acceso total','{\"reportes\": {\"ver\": true, \"exportar\": true}, \"empleados\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}, \"productos\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}, \"alquileres\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}, \"inventario\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}, \"operaciones\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}, \"configuracion\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": true}}',1,'2026-01-19 12:20:07','2026-01-19 12:20:07'),(2,'gerente','Gerente con acceso a reportes y aprobaciones','{\"reportes\": {\"ver\": true, \"exportar\": true}, \"empleados\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"productos\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"alquileres\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"inventario\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"operaciones\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"configuracion\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}}',1,'2026-01-19 12:20:07','2026-01-19 12:20:07'),(3,'ventas','Equipo de ventas - cotizaciones y clientes','{\"reportes\": {\"ver\": true, \"exportar\": false}, \"empleados\": {\"ver\": false}, \"productos\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"alquileres\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"inventario\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"operaciones\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"configuracion\": {\"ver\": false}}',1,'2026-01-19 12:20:07','2026-01-19 12:20:07'),(4,'operaciones','Equipo de operaciones - montaje y desmontaje','{\"reportes\": {\"ver\": false}, \"empleados\": {\"ver\": false}, \"productos\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"alquileres\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"inventario\": {\"ver\": true, \"crear\": false, \"editar\": true, \"eliminar\": false}, \"operaciones\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"configuracion\": {\"ver\": false}}',1,'2026-01-19 12:20:07','2026-01-19 12:20:07'),(5,'bodega','Personal de bodega - inventario','{\"reportes\": {\"ver\": false}, \"empleados\": {\"ver\": false}, \"productos\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"alquileres\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"inventario\": {\"ver\": true, \"crear\": true, \"editar\": true, \"eliminar\": false}, \"operaciones\": {\"ver\": true, \"crear\": false, \"editar\": false, \"eliminar\": false}, \"configuracion\": {\"ver\": false}}',1,'2026-01-19 12:20:07','2026-01-19 12:20:07');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `series`
--

DROP TABLE IF EXISTS `series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_elemento` int NOT NULL,
  `numero_serie` varchar(100) NOT NULL,
  `estado` enum('nuevo','bueno','mantenimiento','alquilado','dañado') DEFAULT 'bueno',
  `fecha_ingreso` date DEFAULT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  `ubicacion_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  KEY `idx_series_numero` (`numero_serie`),
  KEY `idx_series_ubicacion_id` (`ubicacion_id`),
  KEY `idx_series_estado_ubicacion` (`estado`,`ubicacion_id`),
  KEY `idx_series_elemento` (`id_elemento`),
  KEY `idx_series_ubicacion` (`ubicacion_id`),
  KEY `idx_series_estado` (`estado`),
  KEY `idx_series_elemento_estado` (`id_elemento`,`estado`),
  KEY `idx_series_elemento_ubicacion` (`id_elemento`,`ubicacion_id`),
  CONSTRAINT `fk_series_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `series_ibfk_1` FOREIGN KEY (`id_elemento`) REFERENCES `elementos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `series`
--

LOCK TABLES `series` WRITE;
/*!40000 ALTER TABLE `series` DISABLE KEYS */;
INSERT INTO `series` VALUES (11,12,'NUY228','nuevo',NULL,'Bodega A',NULL,'2025-11-28 23:07:08','2025-11-28 23:07:08'),(12,12,'camionJACSXC520','bueno',NULL,'Bodega A',NULL,'2025-12-13 04:29:09','2025-12-13 13:27:58'),(13,27,'p102024','alquilado',NULL,'Bodega A',NULL,'2025-12-28 14:58:48','2026-03-28 22:27:23');
/*!40000 ALTER TABLE `series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tarifas_transporte`
--

DROP TABLE IF EXISTS `tarifas_transporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarifas_transporte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_camion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad_id` int DEFAULT NULL,
  `precio` decimal(12,2) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipo_ciudad_id` (`tipo_camion`,`ciudad_id`),
  KEY `idx_tarifa_tipo` (`tipo_camion`),
  KEY `fk_tarifa_ciudad` (`ciudad_id`),
  CONSTRAINT `fk_tarifa_ciudad` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tarifas_transporte`
--

LOCK TABLES `tarifas_transporte` WRITE;
/*!40000 ALTER TABLE `tarifas_transporte` DISABLE KEYS */;
INSERT INTO `tarifas_transporte` VALUES (1,'Pequeño',NULL,200000.00,1,'2026-01-03 15:26:30','2026-01-03 15:26:30'),(2,'Mediano',NULL,280000.00,1,'2026-01-03 15:26:55','2026-01-03 15:26:55'),(3,'Grande',NULL,380000.00,1,'2026-01-03 15:27:29','2026-01-03 15:27:29'),(4,'Pequeño',2,600000.00,1,'2026-01-04 14:55:13','2026-01-04 14:55:13'),(5,'Mediano',2,720000.00,1,'2026-01-04 14:55:13','2026-01-04 14:55:13'),(6,'Grande',2,1000000.00,1,'2026-01-04 14:55:13','2026-01-04 14:55:13'),(7,'Extragrande',2,3000000.00,1,'2026-01-04 14:55:13','2026-01-04 14:55:13'),(8,'Pequeño',3,700000.00,1,'2026-01-04 15:02:05','2026-01-04 15:02:05'),(9,'Mediano',3,900000.00,1,'2026-01-04 15:02:05','2026-01-04 15:02:05'),(10,'Grande',3,1300000.00,1,'2026-01-04 15:02:05','2026-01-04 15:02:05'),(11,'Extragrande',3,3200000.00,1,'2026-01-04 15:02:05','2026-01-04 15:02:05'),(12,'Pequeño',1,250000.00,1,'2026-01-04 15:02:45','2026-01-04 15:02:45'),(13,'Mediano',1,290000.00,1,'2026-01-04 15:02:45','2026-01-04 15:02:45'),(14,'Grande',1,400000.00,1,'2026-01-04 15:02:45','2026-01-04 15:02:45'),(15,'Extragrande',1,800000.00,1,'2026-01-04 15:02:45','2026-01-04 15:02:45'),(16,'Pequeño',6,400000.00,1,'2026-01-05 13:05:02','2026-01-05 13:05:02'),(17,'Mediano',6,560000.00,1,'2026-01-05 13:05:02','2026-01-05 13:05:02'),(18,'Grande',6,800000.00,1,'2026-01-05 13:05:02','2026-01-05 13:05:02'),(19,'Extragrande',6,1000000.00,1,'2026-01-05 13:05:17','2026-01-05 13:05:17');
/*!40000 ALTER TABLE `tarifas_transporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('bodega','taller','transito','finca','hacienda','jardin','club','hotel','playa','parque','residencia','evento','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'bodega',
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ciudad_id` int DEFAULT NULL,
  `responsable` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacidad_estimada` int DEFAULT NULL COMMENT 'Capacidad aproximada de almacenamiento',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si es la ubicación principal del sistema',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_activo` (`activo`),
  KEY `idx_ubicaciones_tipo` (`tipo`),
  KEY `idx_ubicaciones_nombre` (`nombre`),
  KEY `idx_ubicaciones_activo` (`activo`),
  KEY `fk_ubicacion_ciudad` (`ciudad_id`),
  CONSTRAINT `fk_ubicacion_ciudad` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicaciones`
--

LOCK TABLES `ubicaciones` WRITE;
/*!40000 ALTER TABLE `ubicaciones` DISABLE KEYS */;
INSERT INTO `ubicaciones` VALUES (1,'Finca La Armenia','finca','Vereda La Armenia, Km 5 vía a Circasia',2,'Juan Pérez','3001234567',NULL,300,NULL,1,'2025-11-20 17:17:51','2026-01-05 13:03:18',0),(2,'Finca Los Laureles','finca','Vereda Carrasquilla',1,'María González','3007654321',NULL,1000,NULL,1,'2025-11-20 17:17:51','2026-01-05 13:03:18',0),(4,'Taller de Reparación','taller','Carrera 15 #8-30, Barrio Industrial',2,'Pedro Martínez','3005432109',NULL,NULL,NULL,1,'2025-11-20 17:17:51','2026-01-04 14:52:18',0),(5,'En Tránsito','transito',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2025-11-20 17:17:51','2025-11-20 17:17:51',0),(21,'Bodega A','bodega','hacienda los laureles',1,'Anderson Moreno',NULL,NULL,NULL,NULL,1,'2025-11-20 17:25:20','2026-01-05 13:03:18',1),(22,'Taller','bodega','hacienda los laureles',1,'Alavaro Gomez',NULL,NULL,NULL,NULL,1,'2025-11-20 17:25:20','2026-01-05 13:03:18',0),(23,'Bodega C','bodega','toyota/ cerritos',3,'el entable',NULL,NULL,NULL,NULL,1,'2025-11-20 17:25:20','2026-01-04 20:18:56',0),(29,'Bodega B','bodega','hacienda los laureles',1,'Anderson Moreno',NULL,NULL,NULL,NULL,1,'2025-11-20 17:26:43','2026-01-05 13:03:18',0),(37,'hotel san jose','hotel','vereda el tigre/ cerritos',3,NULL,NULL,NULL,500,NULL,1,'2025-12-28 17:10:11','2026-01-04 14:52:18',0),(38,'edificio grande','residencia','calle 1 23 40',6,NULL,NULL,NULL,NULL,NULL,1,'2026-03-27 21:14:45','2026-03-27 21:14:45',0),(39,'casa luisa','finca','Vereda Carrasquilla',1,NULL,NULL,NULL,NULL,NULL,1,'2026-03-29 01:37:23','2026-03-29 01:37:23',0);
/*!40000 ALTER TABLE `ubicaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades`
--

DROP TABLE IF EXISTS `unidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `abreviatura` varchar(10) DEFAULT NULL,
  `tipo` enum('longitud','peso','volumen','cantidad') DEFAULT 'cantidad',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_unidades_nombre` (`nombre`),
  KEY `idx_unidades_abreviatura` (`abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades`
--

LOCK TABLES `unidades` WRITE;
/*!40000 ALTER TABLE `unidades` DISABLE KEYS */;
INSERT INTO `unidades` VALUES (1,'Metro','m','longitud','2025-10-14 22:38:24'),(2,'Kilogramo','kg','peso','2025-10-14 22:38:24'),(3,'Unidad','und','cantidad','2025-10-14 22:38:24'),(4,'Rollo','rollo','cantidad','2025-10-14 22:38:24'),(5,'Caja','caja','cantidad','2025-10-14 22:38:24'),(6,'Litro','L','volumen','2025-10-14 22:38:24');
/*!40000 ALTER TABLE `unidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo_mantenimientos`
--

DROP TABLE IF EXISTS `vehiculo_mantenimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo_mantenimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int NOT NULL,
  `tipo` enum('preventivo','correctivo','revision') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_programada` date DEFAULT NULL,
  `km_programado` int DEFAULT NULL,
  `fecha_realizado` date DEFAULT NULL,
  `km_realizado` int DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `proveedor` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','en_proceso','completado','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehiculo_mant_vehiculo` (`vehiculo_id`),
  KEY `idx_vehiculo_mant_estado` (`estado`),
  CONSTRAINT `vehiculo_mantenimientos_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo_mantenimientos`
--

LOCK TABLES `vehiculo_mantenimientos` WRITE;
/*!40000 ALTER TABLE `vehiculo_mantenimientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculo_mantenimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo_uso_log`
--

DROP TABLE IF EXISTS `vehiculo_uso_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo_uso_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int NOT NULL,
  `tipo` enum('orden_trabajo','mantenimiento','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha_salida` datetime NOT NULL,
  `fecha_retorno` datetime DEFAULT NULL,
  `km_salida` int DEFAULT NULL,
  `km_retorno` int DEFAULT NULL,
  `conductor_id` int DEFAULT NULL,
  `estado_retorno` enum('ok','con_novedad','requiere_mantenimiento') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conductor_id` (`conductor_id`),
  KEY `idx_vehiculo_uso_vehiculo` (`vehiculo_id`),
  KEY `idx_vehiculo_uso_fechas` (`fecha_salida`,`fecha_retorno`),
  CONSTRAINT `vehiculo_uso_log_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`),
  CONSTRAINT `vehiculo_uso_log_ibfk_2` FOREIGN KEY (`conductor_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo_uso_log`
--

LOCK TABLES `vehiculo_uso_log` WRITE;
/*!40000 ALTER TABLE `vehiculo_uso_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculo_uso_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('camion','furgon','camioneta','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `año` int DEFAULT NULL,
  `color` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacidad_peso_kg` decimal(10,2) DEFAULT NULL,
  `capacidad_volumen_m3` decimal(10,2) DEFAULT NULL,
  `estado` enum('disponible','en_uso','mantenimiento','fuera_servicio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'disponible',
  `kilometraje_actual` int DEFAULT NULL,
  `soat_vencimiento` date DEFAULT NULL,
  `tecnomecanica_vencimiento` date DEFAULT NULL,
  `seguro_vencimiento` date DEFAULT NULL,
  `conductor_habitual_id` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `placa` (`placa`),
  KEY `conductor_habitual_id` (`conductor_habitual_id`),
  KEY `idx_vehiculos_placa` (`placa`),
  KEY `idx_vehiculos_estado` (`estado`),
  KEY `idx_vehiculos_tipo` (`tipo`),
  CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`conductor_habitual_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-29 18:41:25
