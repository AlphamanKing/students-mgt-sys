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

// Get and validate input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data'
    ]);
    exit();
}

try {
    // Validate required fields
    if (empty($data['student_id']) || !is_numeric($data['student_id'])) {
        throw new Exception('Invalid student ID');
    }
    if (empty($data['subject'])) {
        throw new Exception('Subject is required');
    }
    if (empty($data['grade'])) {
        throw new Exception('Grade is required');
    }

    // Verify student exists
    $checkStmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
    $checkStmt->execute([$data['student_id']]);
    if (!$checkStmt->fetch()) {
        throw new Exception('Student not found');
    }

    // Insert grade
    $stmt = $conn->prepare("
        INSERT INTO grades (student_id, subject, grade)
        VALUES (:student_id, :subject, :grade)
    ");
    
    $success = $stmt->execute([
        ':student_id' => $data['student_id'],
        ':subject' => $data['subject'],
        ':grade' => strtoupper($data['grade'])
    ]);

    if (!$success) {
        throw new Exception('Failed to add grade');
    }

    $gradeId = $conn->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Grade added successfully',
        'grade_id' => $gradeId
    ]);

} catch (PDOException $e) {
    error_log("Database error in add_grade.php: " . $e->getMessage());
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