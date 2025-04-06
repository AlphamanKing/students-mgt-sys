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
    // Get counts for each user type
    $query = "
        SELECT 
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
            SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) as lecturers,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
        FROM users
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $stats = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'students' => (int)$stats['students'],
            'lecturers' => (int)$stats['lecturers'],
            'admins' => (int)$stats['admins']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load user statistics: ' . $e->getMessage()
    ]);
}

$conn->close(); 