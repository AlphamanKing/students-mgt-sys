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
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Missing required fields');
    }

    // Start transaction
    $conn->begin_transaction();

    // First, create user account
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    $createUserQuery = "
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, 'student')
    ";
    
    $stmt = $conn->prepare($createUserQuery);
    $stmt->bind_param("sss", $data['name'], $data['email'], $hashedPassword);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create user account');
    }
    
    $userId = $conn->insert_id;

    // Then, create student record
    $createStudentQuery = "
        INSERT INTO students (user_id, name, email, course)
        VALUES (?, ?, ?, ?)
    ";
    
    $stmt = $conn->prepare($createStudentQuery);
    $stmt->bind_param("isss", 
        $userId,
        $data['name'],
        $data['email'],
        $data['course']
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create student record');
    }
    
    $studentId = $conn->insert_id;

    // If we get here, commit the transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Student created successfully',
        'data' => [
            'student_id' => $studentId,
            'user_id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'course' => $data['course'],
            'status' => 'Active'
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
        'message' => 'Failed to create student: ' . $e->getMessage()
    ]);
}

if ($conn) {
    $conn->close();
} 