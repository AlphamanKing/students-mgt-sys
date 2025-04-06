-- Create lecturers table
CREATE TABLE IF NOT EXISTS `lecturers` (
  `lecturer_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`lecturer_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_id` (`user_id`),
  CONSTRAINT `lecturers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert existing lecturers from users table
INSERT INTO `lecturers` (`user_id`, `name`, `email`, `department`, `created_at`)
SELECT `user_id`, `name`, `email`, 'Computer Science', `created_at`
FROM `users`
WHERE `role` = 'lecturer'
AND NOT EXISTS (
    SELECT 1 FROM `lecturers` WHERE `lecturers`.`user_id` = `users`.`user_id`
); 