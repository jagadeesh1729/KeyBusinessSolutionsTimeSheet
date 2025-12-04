-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: keybusiness
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `employee_change_logs`
--

DROP TABLE IF EXISTS `employee_change_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_change_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_type` enum('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `change_reason` text,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `employee_change_logs_fk_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_change_logs_fk_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `visa_status` varchar(100) DEFAULT NULL,
  `job_duties` text,
  `compensation` varchar(200) DEFAULT NULL,
  `project_manager_id` int DEFAULT NULL,
  `college_name` varchar(100) DEFAULT NULL,
  `college_address` varchar(100) DEFAULT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `job_title` varchar(200) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `employement_start_date` date DEFAULT NULL,
  `college_Dso_name` varchar(255) DEFAULT NULL,
  `college_Dso_email` varchar(255) DEFAULT NULL,
  `college_Dso_phone` varchar(255) DEFAULT NULL,
  `primary_emergency_contact_full_name` varchar(255) DEFAULT NULL,
  `primary_emergency_contact_relationship` varchar(100) DEFAULT NULL,
  `primary_emergency_contact_home_phone` varchar(50) DEFAULT NULL,
  `secondary_emergency_contact_full_name` varchar(255) DEFAULT NULL,
  `secondary_emergency_contact_relationship` varchar(100) DEFAULT NULL,
  `secondary_emergency_contact_home_phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_manager_id` (`project_manager_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expiration_tracker`
--

DROP TABLE IF EXISTS `expiration_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expiration_tracker` (
  `id` int NOT NULL AUTO_INCREMENT,
  `target_days` int NOT NULL DEFAULT '180',
  `recurring` enum('daily','weekly','bi-weekly','bi-monthly','monthly','quarterly') NOT NULL DEFAULT 'monthly',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expiration_tracker_logs`
--

DROP TABLE IF EXISTS `expiration_tracker_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expiration_tracker_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tracker_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_type` enum('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tracker_id` (`tracker_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `expiration_tracker_logs_fk_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expiration_tracker_logs_fk_tracker` FOREIGN KEY (`tracker_id`) REFERENCES `expiration_tracker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `google_oauth_tokens`
--

DROP TABLE IF EXISTS `google_oauth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_oauth_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `access_token` text,
  `refresh_token` text,
  `scope` text,
  `token_type` varchar(50) DEFAULT NULL,
  `expiry_date` bigint DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_change_logs`
--

DROP TABLE IF EXISTS `project_change_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_change_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_type` enum('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `change_reason` text,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `project_change_logs_fk_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_change_logs_fk_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project_date_history`
--

DROP TABLE IF EXISTS `project_date_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_date_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `old_start_date` date DEFAULT NULL,
  `old_end_date` date DEFAULT NULL,
  `new_start_date` date DEFAULT NULL,
  `new_end_date` date DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_date_history_chk_1` CHECK ((regexp_like(`old_start_date`,_utf8mb4'^[0-9]{4}-[0-9]{2}-[0-9]{2}$') or (`old_start_date` is null))),
  CONSTRAINT `project_date_history_chk_2` CHECK ((regexp_like(`old_end_date`,_utf8mb4'^[0-9]{4}-[0-9]{2}-[0-9]{2}$') or (`old_end_date` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `auto_approve` tinyint(1) DEFAULT '1',
  `period_type` enum('weekly','bi-monthly','monthly') NOT NULL DEFAULT 'weekly',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `client_address` varchar(255) DEFAULT NULL,
  `project_description` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `signature_required` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  CONSTRAINT `projects_chk_1` CHECK (regexp_like(`start_date`,_utf8mb4'^[0-9]{4}-[0-9]{2}-[0-9]{2}$')),
  CONSTRAINT `projects_chk_2` CHECK (regexp_like(`end_date`,_utf8mb4'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timesheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT 'References employees.id (not users.id)',
  `project_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `total_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
  `daily_entries` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejection_reason` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_timesheet_period` (`employee_id`,`project_id`,`period_start`,`period_end`),
  KEY `employee_id` (`employee_id`),
  KEY `project_id` (`project_id`),
  KEY `status` (`status`),
  KEY `timesheets_ibfk_3` (`approved_by`),
  KEY `timesheets_ibfk_4` (`rejected_by`),
  CONSTRAINT `timesheets_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timesheets_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timesheets_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `timesheets_ibfk_4` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `before_timesheet_insert` BEFORE INSERT ON `timesheets` FOR EACH ROW BEGIN
  DECLARE project_period_type ENUM('weekly','bi-monthly','monthly');
  DECLARE period_dates JSON;
  DECLARE employee_exists INT DEFAULT 0;
  
  -- Verify employee exists
  SELECT COUNT(*) INTO employee_exists 
  FROM employees e 
  WHERE e.id = NEW.employee_id;
  
  IF employee_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid employee ID';
  END IF;
  
  -- Get project's period type from projects table
  SELECT period_type INTO project_period_type 
  FROM projects WHERE id = NEW.project_id;
  
  -- Calculate period dates based on project's period type
  SET period_dates = get_period_dates(project_period_type, CURDATE());
  
  -- Auto-set period dates if not provided
  IF NEW.period_start IS NULL THEN
    SET NEW.period_start = JSON_UNQUOTE(JSON_EXTRACT(period_dates, '$.period_start'));
  END IF;
  
  IF NEW.period_end IS NULL THEN
    SET NEW.period_end = JSON_UNQUOTE(JSON_EXTRACT(period_dates, '$.period_end'));
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `user_change_logs`
--

DROP TABLE IF EXISTS `user_change_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_change_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_type` enum('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `change_reason` text,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `user_change_logs_fk_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_change_logs_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_change_logs`
--

DROP TABLE IF EXISTS `user_project_change_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_change_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action_type` enum('ASSIGNED','UNASSIGNED','UPDATED') NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_reason` text,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `user_project_change_logs_fk_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_project_change_logs_fk_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_project_change_logs_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_projects`
--

DROP TABLE IF EXISTS `user_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_projects` (
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `user_projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_projects_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','employee','project_manager') NOT NULL DEFAULT 'employee',
  `is_active` tinyint(1) DEFAULT '1',
  `reset_token` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `no_of_hours` int DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 20:10:26
