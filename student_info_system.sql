-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 05, 2025 at 03:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `student_info_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `student_id`, `date`, `status`) VALUES
(7, 10, '2025-03-02', 'Absent'),
(8, 10, '2025-03-03', 'Present'),
(9, 10, '2025-03-04', 'Present'),
(10, 10, '2025-03-05', 'Present'),
(11, 10, '2025-03-06', 'Absent'),
(13, 16, '2025-04-24', 'Present'),
(14, 16, '2025-05-08', 'Absent'),
(15, 16, '2025-04-15', 'Present');

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `grade_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `grade` char(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`grade_id`, `student_id`, `subject`, `grade`) VALUES
(7, 10, 'Web Programming', 'B'),
(8, 10, 'Database Systems', 'A'),
(9, 10, 'Networking', 'C'),
(10, 10, 'Software Engineering', 'B'),
(12, 13, 'Software Engineering', 'A'),
(13, 14, 'Networking', 'F'),
(15, 14, 'Database Systems', 'A'),
(16, 10, 'Software Engineering', 'A'),
(17, 16, 'Software Engineering', 'A'),
(18, 16, 'Database systems', 'F');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `student_id`, `message`, `created_at`) VALUES
(1, 10, '🎓 Grade for Web Programming has been updated.', '2025-03-15 14:59:12'),
(2, 10, '📢 Don’t forget the upcoming Software Engineering assessment.', '2025-03-15 14:59:12'),
(3, 10, '✅ You have maintained 85% attendance this semester. Keep it up!', '2025-03-15 14:59:12'),
(4, 10, '📌 Your attendance on 5th March was marked as Absent.', '2025-03-15 14:59:12'),
(5, 10, '⚠ Low attendance in Database Systems unit. Consider reaching out to your lecturer.', '2025-03-15 14:59:12');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `course` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `user_id`, `name`, `email`, `course`, `created_at`) VALUES
(4, 16, 'Njoroge Ann', 'ann@gmail.com', '', '2025-03-10 09:30:39'),
(8, 20, 'Fauzia', 'fauzia@gmail.com', '', '2025-03-10 11:44:43'),
(10, 11, 'Test Student', 'student@example.com', 'BBIT', '2025-03-10 12:15:04'),
(13, 23, 'jaffar', 'jaffar@gmail.com', '', '2025-03-10 14:09:13'),
(14, 24, 'Mumbua', 'star@gmail.com', 'BBIT', '2025-03-12 19:31:07'),
(15, 25, 'Lavalava', 'Lava@gmail.com', '', '2025-03-15 15:37:16'),
(16, 27, 'Mustapha Iddi', 'mustaphamustard876@gmail.com', 'Software Engineering', '2025-04-03 12:15:31'),
(19, 30, 'lelele lelele', 'lele@gmail.com', 'BBIT', '2025-04-03 13:09:49'),
(20, 32, 'John Wahome', 'wahome@gmail.com', 'Computer Science', '2025-04-05 13:23:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','lecturer','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(3, 'Test User', 'testuser@example.com', '$2y$10$JmhY.CFIrroHB/cNX0gvj.OfsO29tNhIgk524Urpr.PH0MkadH/F2', 'student', '2025-03-08 15:40:48'),
(4, 'Admin User', 'admin@example.com', '$2y$10$wKmIjg4RfYURhO7M9JDoAOYyBL5O7PMZPz...', 'admin', '2025-03-09 11:20:30'),
(5, 'Lecturer User', 'lecturer@example.com', '$2y$10$Qb8X5hgt9j3jY7PzNQjW1O6K...', 'lecturer', '2025-03-09 11:20:30'),
(7, 'John Doe', 'johndoe@example.com', '$2y$10$HI3GCB3b/spO4jhV2dftHubTEgK8g.9R1dUKyQQtOJGEkvYwhbXHC', 'student', '2025-03-09 11:32:32'),
(11, 'Test Student', 'student@example.com', '$2y$10$5OG6EBrLPrMFDTPCx9z30.2HUYaYVxZg/C.YJ5qV0NsX4p7tQCYyK', 'student', '2025-03-09 20:14:06'),
(12, 'Tapha', 'zaid@gmail.com', '$2y$10$ueHauKDMxbgP2PhWKcnDtu9.evItjTS4BY/JnxmhtGyRmgs/jRagu', 'student', '2025-03-09 22:00:05'),
(13, 'Star Mumbu', 'mumbu@gmail.com', '$2y$10$SIglRC80OWuT6cQ8hPNqqOM32/vhf/gIA8sCCAqjn/6.6r7PQxKyy', 'student', '2025-03-09 22:06:13'),
(14, 'Abuh', 'Abuh@gmail.com', '$2y$10$YsSk/hXwMTHKX6XwR8AzMu4u6EkrOXzE6zwvPWHuuyJFW0sAmw2gO', 'student', '2025-03-09 23:01:06'),
(15, 'levy njoroge', 'njoroge@gmail.com', '$2y$10$SXEd5Ds5x9P/t2ceIgQB/uNCZxXZZmFZ0IYU8k6tH/tXhjxAwwzv.', 'student', '2025-03-09 23:04:50'),
(16, 'Njoroge Ann', 'ann@gmail.com', '$2y$10$lBa2ERCIz1D4GxmMxTpODuxnM0mWzBiAAv7Lv4iM4taDATU1msaOa', 'student', '2025-03-10 09:30:39'),
(20, 'Fauzia', 'fauzia@gmail.com', '$2y$10$8b/UHXCFXA.YZtH0covrVOCYRiDFaa2CIWVEks1ubmV4V0Ov0aHQe', 'student', '2025-03-10 11:44:43'),
(22, 'Musungu Idd', '', '$2y$10$nmYEuTmTcEsDjaWoWCGRg.n1eURHF4DPOicH5LpIeiGafXyA05vY6', 'student', '2025-03-10 12:31:50'),
(23, 'jaffar', 'jaffar@gmail.com', '$2y$10$WaLedKICpOLkbWSvjZaH..rO3eAr4kwCQpxtMTGplJuTscj5J.wVi', 'student', '2025-03-10 14:09:13'),
(24, 'Mumbua', 'star@gmail.com', '$2y$10$15lrGUGm2yM7oYjVAz9FU.JKC7WAKxUf6ic0V.3G9G7I7XUZ2BlCm', 'student', '2025-03-12 19:31:07'),
(25, 'Lavalava', 'Lava@gmail.com', '$2y$10$14fJuvvtPlCuSTOcSwN/SOaHcqd9QHLD7vx/KOAWQOp1.G8wSHam6', 'student', '2025-03-15 15:37:16'),
(26, 'Rachael', 'Rachael@gmail.com', '$2y$10$rgisZhwrrwowkzfU9e95tOHnan0nkbocJgimL.VZlg0B5dXoMj8L.', 'lecturer', '2025-03-31 11:42:07'),
(27, 'Mustapha Iddi', 'mustaphamustard876@gmail.com', '$2y$10$7XRJXlTJB.7PPh2A3jIxnOT5lH/5ovI9REmJyXxVk9XfU7WIHqKBu', 'student', '2025-04-03 12:15:31'),
(30, 'lelele lelele', 'lele@gmail.com', '$2y$10$IwZFH6Psj/h6XhM9Q5H40.gEiIDWZGHgO/lTRcTUzvWCYz0LmyYBO', 'student', '2025-04-03 13:09:49'),
(31, 'Eugene Gudi', 'eugenegudi3@gmai.com', '$2y$10$m3SXIYKJDB9kNZ963p13DuAYY..DfzGlx9wyO6XbGV2oNsBGbHSlq', 'lecturer', '2025-04-03 13:36:04'),
(32, 'John Wahome', 'wahome@gmail.com', '$2y$10$g.DFpW8etSDk6AGP2rtjeuf5PybNF9nFf9LTCOuiYJO56Swn93ZmC', 'student', '2025-04-05 13:23:30');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `grade_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
