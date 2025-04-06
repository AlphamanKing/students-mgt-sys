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
    
    if (!$data || !isset($data['student_id'])) {
        throw new Exception('Student ID is required');
    }

    // Start transaction
    $conn->begin_transaction();

    // First, get the user_id from students table
    $getUserQuery = "SELECT user_id FROM students WHERE student_id = ?";
    $stmt = $conn->prepare($getUserQuery);
    $stmt->bind_param("i", $data['student_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to find student');
    }
    
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    
    if (!$student) {
        throw new Exception('Student not found');
    }

    // Due to the ON DELETE CASCADE constraint, we only need to delete from the students table
    // The related records in users, attendance, and grades will be automatically deleted
    $deleteStudentQuery = "DELETE FROM students WHERE student_id = ?";
    $stmt = $conn->prepare($deleteStudentQuery);
    $stmt->bind_param("i", $data['student_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete student record');
    }

    // If we get here, commit the transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Student deleted successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn && $conn->ping()) {
        $conn->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete student: ' . $e->getMessage()
    ]);
}

if ($conn) {
    $conn->close();
} 