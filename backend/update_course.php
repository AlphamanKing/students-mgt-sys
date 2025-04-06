<?php
session_start();
include 'db_config.php';

$student_id = 10;// or test id 10
$data = json_decode(file_get_contents("php://input"), true);
$course = htmlspecialchars($data['course']);

$stmt = $conn->prepare("UPDATE students SET course = ? WHERE user_id = ?");
$stmt->bind_param("si", $course, $student_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Course updated successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update course."]);
}