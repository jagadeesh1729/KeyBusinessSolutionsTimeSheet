-- Migration script to add missing columns to users table
-- Run this on your AWS RDS database

-- Add first_name column if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `first_name` varchar(255) DEFAULT NULL;

-- Add last_name column if not exists  
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `last_name` varchar(255) DEFAULT NULL;

-- Add reset_token column if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `reset_token` varchar(255) DEFAULT NULL;

-- Add location column if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `location` varchar(255) DEFAULT NULL;

-- Add no_of_hours column if not exists
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `no_of_hours` int DEFAULT NULL;

-- If your MySQL version doesn't support IF NOT EXISTS, use these instead:
-- ALTER TABLE `users` ADD COLUMN `first_name` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `last_name` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `reset_token` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `location` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `no_of_hours` int DEFAULT NULL;
