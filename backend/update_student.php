<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('Invalid request data');
    }

    // Start transaction
    $conn->begin_transaction();

    // Update users table first
    $updateUserQuery = "
        UPDATE users 
        SET name = ?, email = ?
        WHERE user_id = (
            SELECT user_id 
            FROM students 
            WHERE student_id = ?
        )
    ";
    
    $stmt = $conn->prepare($updateUserQuery);
    $stmt->bind_param("ssi", $data['name'], $data['email'], $data['student_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update user data');
    }

    // Update students table
    $updateStudentQuery = "
        UPDATE students 
        SET name = ?, 
            email = ?, 
            course = ?
        WHERE student_id = ?
    ";
    
    $stmt = $conn->prepare($updateStudentQuery);
    $stmt->bind_param("sssi", 
        $data['name'], 
        $data['email'], 
        $data['course'], 
        $data['student_id']
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update student data');
    }

    // If we get here, commit the transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Student updated successfully',
        'data' => [
            'student_id' => $data['student_id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'course' => $data['course']
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn && $conn->ping()) {
        $conn->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update student: ' . $e->getMessage()
    ]);
}

if ($conn) {
    $conn->close();
} 