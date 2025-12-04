-- Expiration Tracker Tables
-- Run this SQL to create the expiration tracker and its change logs table

-- Table for storing expiration tracker settings (singleton)
CREATE TABLE IF NOT EXISTS `expiration_tracker` (
  `id` INT NOT NULL AUTO_INCREMENT,

  -- Default threshold = 6 months (≈ 180 days)
  `target_days` INT NOT NULL DEFAULT 180,

  -- Recurring frequency for sending reminders
  `recurring` ENUM(
      'daily',
      'weekly',
      'bi-weekly',
      'bi-monthly',
      'monthly',
      'quarterly'
  ) NOT NULL DEFAULT 'monthly',

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing change logs for the expiration tracker
CREATE TABLE IF NOT EXISTS `expiration_tracker_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,

  `tracker_id` INT NOT NULL,                 -- linked to expiration_tracker.id

  `changed_by` INT DEFAULT NULL,             -- which user made the change

  `field_name` VARCHAR(255) NOT NULL,        -- target_days, recurring
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,

  `change_type` ENUM('CREATE','UPDATE','DELETE') NOT NULL DEFAULT 'UPDATE',
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_tracker_id` (`tracker_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_changed_at` (`changed_at`),

  CONSTRAINT `expiration_tracker_logs_fk_tracker`
      FOREIGN KEY (`tracker_id`) REFERENCES `expiration_tracker`(`id`) ON DELETE CASCADE,

  CONSTRAINT `expiration_tracker_logs_fk_changed_by`
      FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings if table is empty
INSERT INTO `expiration_tracker` (`target_days`, `recurring`)
SELECT 180, 'monthly'
WHERE NOT EXISTS (SELECT 1 FROM `expiration_tracker` LIMIT 1);
