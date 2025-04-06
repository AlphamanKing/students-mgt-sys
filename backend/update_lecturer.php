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
    
    if (!$data || !isset($data['lecturer_id']) || !isset($data['name']) || !isset($data['email'])) {
        throw new Exception('Missing required fields');
    }

    // Start transaction
    $conn->begin_transaction();

    // First, get the user_id from lecturers table
    $getUserQuery = "SELECT user_id FROM lecturers WHERE lecturer_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->bind_param("i", $data['lecturer_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to find lecturer');
    }
    
    $result = $stmt->get_result();
    $lecturer = $result->fetch_assoc();
    
    if (!$lecturer) {
        throw new Exception('Lecturer not found');
    }

    // Update users table
    $updateUserQuery = "
        UPDATE users 
        SET name = ?, email = ?
    ";
    
    $params = [$data['name'], $data['email']];
    $types = "ss";
    
    // If password is provided, update it
    if (!empty($data['password'])) {
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $updateUserQuery .= ", password = ?";
        $params[] = $hashedPassword;
        $types .= "s";
    }
    
    $updateUserQuery .= " WHERE user_id = ?";
    $params[] = $lecturer['user_id'];
    $types .= "i";
    
    $stmt = $conn->prepare($updateUserQuery);
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update user account');
    }

    // Update lecturers table
    $updateLecturerQuery = "
        UPDATE lecturers 
        SET name = ?, email = ?, department = ?
        WHERE lecturer_id = ?
    ";
    
    $stmt = $conn->prepare($updateLecturerQuery);
    $stmt->bind_param("sssi", 
        $data['name'],
        $data['email'],
        $data['department'],
        $data['lecturer_id']
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update lecturer record');
    }

    // If we get here, commit the transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Lecturer updated successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn && $conn->ping()) {
        $conn->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update lecturer: ' . $e->getMessage()
    ]);
}

if ($conn) {
    $conn->close();
} 