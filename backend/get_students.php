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

// Check if user is logged in and has a role
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
    http_response_code(401);
    die(json_encode([
        'success' => false, 
        'message' => 'Unauthorized. Please log in again.',
        'debug' => ['session_status' => session_status(), 'session_id' => session_id()]
    ]));
}

try {
    $user_id = $_SESSION['user_id'];
    $role = $_SESSION['role'];
    
    error_log("User ID: $user_id, Role: $role");
    
    // For LECTURERS/ADMINS: Return all students
    if ($role === 'lecturer' || $role === 'admin') {
        $stmt = $conn->prepare("
            SELECT 
                s.student_id, 
                s.name, 
                s.email, 
                s.course,
                s.created_at
            FROM students s
            ORDER BY s.name ASC
        ");
        
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'students' => $students
        ]);
        exit;
    }
    
    // For STUDENTS: Return only their own information
    else if ($role === 'student') {
        $stmt = $conn->prepare("
            SELECT 
                student_id, 
                name, 
                email, 
                course,
                created_at
            FROM students 
            WHERE user_id = ?
        ");
        $stmt->execute([$user_id]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'students' => $student ? [$student] : []
        ]);
        exit;
    } else {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid role'
        ]);
        exit;
    }
} catch(Exception $e) {
    error_log("Error in get_students.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'debug' => $e->getMessage()
    ]);
    exit;
}

// Debugging
error_log("Session user_id: " . $_SESSION['user_id']);
error_log("Session role: " . $_SESSION['role']);
?>