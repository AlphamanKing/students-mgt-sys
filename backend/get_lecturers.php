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
    // Get all lecturers with their details from both tables
    $query = "
        SELECT 
            l.lecturer_id,
            l.user_id,
            l.name,
            l.email,
            l.department,
            l.created_at
        FROM lecturers l
        JOIN users u ON l.user_id = u.user_id
        WHERE u.role = 'lecturer'
        ORDER BY l.name ASC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $lecturers = [];
    while ($row = $result->fetch_assoc()) {
        $lecturers[] = [
            'lecturer_id' => $row['lecturer_id'],
            'user_id' => $row['user_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'department' => $row['department'],
            'status' => 'Active', // Default status since it's not in the database
            'created_at' => $row['created_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $lecturers
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load lecturers: ' . $e->getMessage()
    ]);
}

$conn->close(); 