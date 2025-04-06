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
        SET grade = :grade, subject = :subject 
        WHERE grade_id = :grade_id
    ");
    
    $success = $stmt->execute([
        ':grade' => strtoupper($data['grade']),
        ':subject' => $data['subject'],
        ':grade_id' => $data['grade_id']
    ]);

    if (!$success) {
        throw new Exception('Failed to update grade');
    }

    if ($stmt->rowCount() === 0) {
        throw new Exception('Grade not found');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Grade updated successfully'
    ]);

} catch (PDOException $e) {
    error_log("Database error in update_grade.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
