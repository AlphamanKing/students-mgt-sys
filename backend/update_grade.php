<?php
session_start();
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

    // Validate required fields
    if (empty($data['grade_id']) || !is_numeric($data['grade_id'])) {
        throw new Exception('Invalid grade ID');
    }
    if (empty($data['grade'])) {
        throw new Exception('Grade is required');
    }
    if (empty($data['subject'])) {
        throw new Exception('Subject is required');
    }

    // Update the grade in the database
    $stmt = $conn->prepare("
        UPDATE grades 
        SET grade = ?, subject = ? 
        WHERE grade_id = ?
    ");
    
    $grade = strtoupper($data['grade']);
    $subject = $data['subject'];
    $gradeId = $data['grade_id'];
    
    $stmt->bind_param("ssi", $grade, $subject, $gradeId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update grade: ' . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception('Grade not found');
    }
    
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Grade updated successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in update_grade.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
