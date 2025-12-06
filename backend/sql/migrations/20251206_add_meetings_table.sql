-- Adds meetings table to track Google Meet links created by PMs/Admins
CREATE TABLE IF NOT EXISTS meetings (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  meeting_link VARCHAR(1024) NOT NULL,
  start_time DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  created_by INT NOT NULL,
  event_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_meetings_created_by (created_by),
  CONSTRAINT meetings_fk_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);
