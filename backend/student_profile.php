<?php
header("Content-Type: application/json");
require 'db_config.php';
session_start();

// Simulate login session (replace with real session management later)
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "User not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch student info
$stmt = $conn->prepare("SELECT name, email, course FROM students WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $student = $result->fetch_assoc();

    // 🔸 Dummy data for charts (replace with real queries later)
    $grades = [75, 82, 68, 90]; // simulate grades
    $attendance = [88, 92, 80, 95]; // simulate attendance

    echo json_encode([
        "success" => true,
        "student" => $student,
        "grades" => $grades,
        "attendance" => $attendance
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Student profile not found"]);
}

$stmt->close();
$conn->close();
