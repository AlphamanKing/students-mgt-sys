<?php
// Strict error reporting
error_reporting(0); // Disable error output to prevent corrupting JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

// Initialize response array
$response = [
    'success' => false,
    'message' => 'Unknown error occurred'
];

try {
    // Verify request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST requests are allowed');
    }

    // Get and validate input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }

    // Validate required fields
    if (empty($data['attendance_id']) || !is_numeric($data['attendance_id'])) {
        throw new Exception('Invalid attendance ID');
    }
    
    if (empty($data['student_id']) || !is_numeric($data['student_id'])) {
        throw new Exception('Invalid student ID');
    }
    
    if (empty($data['date'])) {
        throw new Exception('Date is required');
    }
    
    if (empty($data['status'])) {
        throw new Exception('Status is required');
    }

    // Update the attendance record
    $stmt = $conn->prepare("
        UPDATE attendance 
        SET student_id = :student_id,
            date = :date,
            status = :status
        WHERE attendance_id = :attendance_id
    ");
    
    $params = [
        ':attendance_id' => $data['attendance_id'],
        ':student_id' => $data['student_id'],
        ':date' => $data['date'],
        ':status' => $data['status']
    ];
    
    $success = $stmt->execute($params);

    if (!$success) {
        throw new Exception('Failed to update attendance record');
    }

    $rowsAffected = $stmt->rowCount();
    if ($rowsAffected > 0) {
        $response = [
            'success' => true,
            'message' => 'Attendance record updated successfully',
            'attendance_id' => $data['attendance_id']
        ];
    } else {
        $response = [
            'success' => false,
            'message' => 'No attendance record found with that ID',
            'attendance_id' => null
        ];
    }

} catch (PDOException $e) {
    $response = [
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ];
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
}

// Ensure no output before this
ob_clean(); // Clear any potential output buffers
echo json_encode($response);
exit;
?> 