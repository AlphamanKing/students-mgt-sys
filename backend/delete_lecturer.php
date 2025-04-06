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
    
    if (!$data || !isset($data['lecturer_id'])) {
        throw new Exception('Lecturer ID is required');
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

    // Delete from lecturers table first (due to foreign key constraint)
    $deleteLecturerQuery = "DELETE FROM lecturers WHERE lecturer_id = ?";
    $stmt = $conn->prepare($deleteLecturerQuery);
    $stmt->bind_param("i", $data['lecturer_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete lecturer record');
    }

    // Delete from users table
    $deleteUserQuery = "DELETE FROM users WHERE user_id = ?";
    $stmt = $conn->prepare($deleteUserQuery);
    $stmt->bind_param("i", $lecturer['user_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete user account');
    }

    // If we get here, commit the transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Lecturer deleted successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn && $conn->ping()) {
        $conn->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete lecturer: ' . $e->getMessage()
    ]);
}

if ($conn) {
    $conn->close();
} 