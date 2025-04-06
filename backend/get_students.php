<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

// Debug session variables
error_log("Session variables: " . print_r($_SESSION, true));

// Check if user is logged in and is an admin or lecturer
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || 
    ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'lecturer')) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized access'
    ]);
    exit;
}

try {
    // Get all students with their course information
    $query = "
        SELECT s.student_id, s.name, s.email, s.course, s.created_at,
               CASE WHEN u.user_id IS NOT NULL THEN 'Active' ELSE 'Inactive' END as status
        FROM students s
        LEFT JOIN users u ON s.user_id = u.user_id
        ORDER BY s.student_id DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = [
            'student_id' => $row['student_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'course' => $row['course'],
            'status' => $row['status'],
            'created_at' => $row['created_at']
        ];
    }
        
        echo json_encode([
            'success' => true,
        'data' => $students
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_students.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load students: ' . $e->getMessage()
    ]);
}

$conn->close();

// Debugging
error_log("Session user_id: " . $_SESSION['user_id']);
error_log("Session role: " . $_SESSION['role']);
?>