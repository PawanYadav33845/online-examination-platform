-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 22, 2023 at 02:28 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `online_examination`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_table`
--

CREATE TABLE `admin_table` (
  `admin_id` int(11) NOT NULL,
  `admin_email_address` varchar(150) NOT NULL,
  `admin_password` varchar(150) NOT NULL,
  `admin_verfication_code` varchar(100) NOT NULL,
  `admin_type` enum('master','sub_master') NOT NULL,
  `admin_created_on` datetime NOT NULL,
  `email_verified` enum('no','yes') NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `admin_table`
--

INSERT INTO `admin_table` (`admin_id`, `admin_email_address`, `admin_password`, `admin_verfication_code`, `admin_type`, `admin_created_on`, `email_verified`) VALUES
(33845, 'pawan.y@aol.com', 'Mr7Neorite', '33845', 'master', '2023-11-05 21:48:50', 'yes'),
(12345, 'bablisinghraput@gmail.com', 'bablisingh', '12345', 'sub_master', '2023-11-05 21:48:50', 'yes'),
(9989, 'mail2kartikeyjoshi@gmail.com', 'kartikeyjoshi', '9989', 'sub_master', '2023-11-05 21:50:47', 'yes'),
(123456, 'pratiksingh@gmail.com', 'pratiksingh', '123456', 'sub_master', '2023-11-05 21:50:47', 'yes'),
(1234567, 'aryanraj@gmail.com', 'aryanraj', '1234567', 'sub_master', '2023-11-05 21:52:27', 'yes');

-- --------------------------------------------------------

--
-- Table structure for table `online_exam_table`
--

CREATE TABLE `online_exam_table` (
  `online_exam_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `online_exam_title` varchar(250) NOT NULL,
  `online_exam_datetime` datetime NOT NULL,
  `online_exam_duration` varchar(30) NOT NULL,
  `total_question` int(5) NOT NULL,
  `marks_per_right_answer` varchar(30) NOT NULL,
  `marks_per_wrong_answer` varchar(30) NOT NULL,
  `online_exam_created_on` datetime NOT NULL,
  `online_exam_status` enum('Pending','Created','Started','Completed') NOT NULL,
  `online_exam_code` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `online_exam_table`
--

INSERT INTO `online_exam_table` (`online_exam_id`, `admin_id`, `online_exam_title`, `online_exam_datetime`, `online_exam_duration`, `total_question`, `marks_per_right_answer`, `marks_per_wrong_answer`, `online_exam_created_on`, `online_exam_status`, `online_exam_code`) VALUES
(15, 9989, 'E-sports', '2023-11-05 21:53:48', '2 hours', 40, '2', '0', '2023-11-05 21:53:48', 'Completed', 'E-015'),
(21, 33845, 'Java Funndamentals', '2023-11-05 21:53:48', '2 hours', 40, '2', '0', '2023-11-05 21:53:48', 'Pending', 'J-021');

-- --------------------------------------------------------

--
-- Table structure for table `option_table`
--

CREATE TABLE `option_table` (
  `option_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_number` int(2) NOT NULL,
  `option_title` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_table`
--

CREATE TABLE `question_table` (
  `question_id` int(11) NOT NULL,
  `online_exam_id` int(11) NOT NULL,
  `question_title` text NOT NULL,
  `answer_option` enum('1','2','3','4') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `question_table`
--

INSERT INTO `question_table` (`question_id`, `online_exam_id`, `question_title`, `answer_option`) VALUES
(1, 21, 'Java FullForm', '4'),
(2, 15, 'Online games main focus', '4');

-- --------------------------------------------------------

--
-- Table structure for table `user_exam_enroll_table`
--

CREATE TABLE `user_exam_enroll_table` (
  `user_exam_enroll_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `attendance_status` enum('Absent','Present') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user_exam_enroll_table`
--

INSERT INTO `user_exam_enroll_table` (`user_exam_enroll_id`, `user_id`, `exam_id`, `attendance_status`) VALUES
(111, 11561, 21, 'Present'),
(112, 10373, 15, 'Present'),
(113, 12345, 21, 'Present'),
(114, 123456, 15, 'Present'),
(115, 11565, 15, 'Absent');

-- --------------------------------------------------------

--
-- Table structure for table `user_exam_question_answer`
--

CREATE TABLE `user_exam_question_answer` (
  `user_exam_question_answer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `user_answer_option` enum('0','1','2','3','4') NOT NULL,
  `marks` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_table`
--

CREATE TABLE `user_table` (
  `user_id` int(11) NOT NULL,
  `user_email_address` varchar(250) NOT NULL,
  `user_password` varchar(150) NOT NULL,
  `user_verfication_code` varchar(100) NOT NULL,
  `user_name` varchar(150) NOT NULL,
  `user_gender` enum('Male','Female') NOT NULL,
  `user_address` text NOT NULL,
  `user_mobile_no` varchar(30) NOT NULL,
  `user_image` varchar(150) NOT NULL,
  `user_created_on` datetime NOT NULL,
  `user_email_verified` enum('no','yes') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user_table`
--

INSERT INTO `user_table` (`user_id`, `user_email_address`, `user_password`, `user_verfication_code`, `user_name`, `user_gender`, `user_address`, `user_mobile_no`, `user_image`, `user_created_on`, `user_email_verified`) VALUES
(11562, '21BCS11581@cuchd.in', '$2y$10$gO6rQR5BluAnZB3jEY26WOdieNt3bmwwhjotMTQoN0J3WOdcxocw.', 'd178a824acc31df082eeedb5b16ed458', 'Babli ', 'Female', 'Kharar', '6440069545', '654802aaa4e57.jpg', '2023-11-05 22:01:30', 'yes'),
(11563, '21BCS10382@cuchd.in', '$2y$10$.QkWtIH5hUvM.uS.CjtZoOKpBNu0P6.f4L3MjLeMDPk9SOlTAF2Oq', '80309b4930584e772b4c69f874789a04', 'Aryan Raj', 'Male', 'Kharar', '8564133566', '654803212c251.jpg', '2023-11-05 22:03:29', 'yes'),
(11564, '21BCS3226@cuchd.in', '$2y$10$F7qb78eNxy.Vvxxbrx2IE.AROoFbJ0ipjxqa/4jGNlzw.VGz/R5n2', 'ed11a9c2704c9c95b33e2e76af0d110d', 'Pratik Singh ', 'Male', 'Kharar', '8686452196', '654803661f15c.png', '2023-11-05 22:04:38', 'yes'),
(11565, '21BCS11561@cuchd.in', '$2y$10$gGruOmdBBRJp2hodNfMigecA5zo0OzwK6PmQ7B05dF7IXHhv3rem2', '5de5920bac629ff8006e36626b302d2e', 'Pawan Yadav', 'Male', '188 G\r\nModern Valley', '08840069545', '654803daa7fd4.jpg', '2023-11-05 22:06:34', 'yes'),
(11566, '21BCS10373@cuchd.in', '$2y$10$EwZT2Z7J2O9/hH1OZjJ.5.3bDffdtvNedJ.4Vs66.tR5LocohpZQu', '37a7b63a29d9b1c2444a8e2549b8a622', 'Kartikey Joshi', 'Male', 'Kharar', '63547893633', '6548042552bbe.jpg', '2023-11-05 22:07:49', 'yes');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_table`
--
ALTER TABLE `admin_table`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `online_exam_table`
--
ALTER TABLE `online_exam_table`
  ADD PRIMARY KEY (`online_exam_id`);

--
-- Indexes for table `option_table`
--
ALTER TABLE `option_table`
  ADD PRIMARY KEY (`option_id`);

--
-- Indexes for table `question_table`
--
ALTER TABLE `question_table`
  ADD PRIMARY KEY (`question_id`);

--
-- Indexes for table `user_exam_enroll_table`
--
ALTER TABLE `user_exam_enroll_table`
  ADD PRIMARY KEY (`user_exam_enroll_id`);

--
-- Indexes for table `user_exam_question_answer`
--
ALTER TABLE `user_exam_question_answer`
  ADD PRIMARY KEY (`user_exam_question_answer_id`);

--
-- Indexes for table `user_table`
--
ALTER TABLE `user_table`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_table`
--
ALTER TABLE `admin_table`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1234568;

--
-- AUTO_INCREMENT for table `online_exam_table`
--
ALTER TABLE `online_exam_table`
  MODIFY `online_exam_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `option_table`
--
ALTER TABLE `option_table`
  MODIFY `option_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_table`
--
ALTER TABLE `question_table`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_exam_enroll_table`
--
ALTER TABLE `user_exam_enroll_table`
  MODIFY `user_exam_enroll_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `user_exam_question_answer`
--
ALTER TABLE `user_exam_question_answer`
  MODIFY `user_exam_question_answer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_table`
--
ALTER TABLE `user_table`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11567;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
