<?php
header("Content-Type: application/json");
require 'db_connection.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is authenticated
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// Get current user data
$currentUser = [
    'user_id' => $_SESSION['user_id'],
    'email' => $_SESSION['email'],
    'role' => $_SESSION['role'],
    'name' => $_SESSION['name']
];

if ($_SESSION['role'] === 'student' && isset($_SESSION['student_id'])) {
    $currentUser['student_id'] = $_SESSION['student_id'];
}

// For endpoints that require specific roles
function requireRole($requiredRole) {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== $requiredRole) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: Insufficient privileges"]);
        exit;
    }
}

// For endpoints that require lecturer or admin access
function requireLecturerOrAdmin() {
    if (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'lecturer' && $_SESSION['role'] !== 'admin')) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: Lecturer or Admin access required"]);
        exit;
    }
}

// For endpoints that require student access
function requireStudent() {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student' || !isset($_SESSION['student_id'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: Student access required"]);
        exit;
    }
    
    return $_SESSION['student_id'];
}
?>