<?php
session_start();
// Disable error output to prevent corrupting JSON
error_reporting(0);
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

try {
    // Get and validate input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }

    // Validate grade_id
    if (empty($data['grade_id']) || !is_numeric($data['grade_id'])) {
        throw new Exception('Invalid grade ID');
    }

    // Delete the grade
    $stmt = $conn->prepare("DELETE FROM grades WHERE grade_id = ?");
    $stmt->bind_param("i", $data['grade_id']);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to delete grade: ' . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception('Grade not found');
    }
    
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Grade deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in delete_grade.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>