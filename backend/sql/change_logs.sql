-- Change history tables for projects and users
DROP TABLE IF EXISTS `project_date_history`;
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
  CONSTRAINT `project_date_history_chk_1` CHECK (
    regexp_like(`old_start_date`, '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
    OR (`old_start_date` IS NULL)
  ),
  CONSTRAINT `project_date_history_chk_2` CHECK (
    regexp_like(`old_end_date`, '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
    OR (`old_end_date` IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `user_change_logs`;
CREATE TABLE `user_change_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `changed_by` INT DEFAULT NULL,
  `field_name` VARCHAR(255) NOT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `change_type` ENUM('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `change_reason` TEXT DEFAULT NULL,
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `user_change_logs_fk_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_change_logs_fk_changed_by`
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `project_change_logs`;
CREATE TABLE `project_change_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `changed_by` INT DEFAULT NULL,
  `field_name` VARCHAR(255) NOT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `change_type` ENUM('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `change_reason` TEXT DEFAULT NULL,
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `project_change_logs_fk_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `project_change_logs_fk_changed_by`
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `user_project_change_logs`;
CREATE TABLE `user_project_change_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `project_id` INT NOT NULL,
  `changed_by` INT DEFAULT NULL,
  `action_type` ENUM('ASSIGNED','UNASSIGNED','UPDATED') NOT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `change_reason` TEXT DEFAULT NULL,
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `user_project_change_logs_fk_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_project_change_logs_fk_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_project_change_logs_fk_changed_by`
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
