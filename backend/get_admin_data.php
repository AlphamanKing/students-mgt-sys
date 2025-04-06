<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

require_once 'db_connection.php';

try {
    // Get admin user data
    $stmt = $conn->prepare("
        SELECT user_id, name, email, role, created_at 
        FROM users 
        WHERE user_id = ? AND role = 'admin'
    ");
    
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Admin user not found');
    }
    
    $admin = $result->fetch_assoc();
    
    // Get system overview data
    $totalStudents = $conn->query("SELECT COUNT(*) as count FROM students")->fetch_assoc()['count'];
    $totalLecturers = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'lecturer'")->fetch_assoc()['count'];
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $admin['user_id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'created_at' => $admin['created_at']
        ],
        'overview' => [
            'total_students' => $totalStudents,
            'total_lecturers' => $totalLecturers
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load admin data: ' . $e->getMessage()
    ]);
}

$conn->close(); 