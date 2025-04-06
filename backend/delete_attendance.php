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

    // Validate attendance_id
    if (empty($data['attendance_id']) || !is_numeric($data['attendance_id'])) {
        throw new Exception('Invalid attendance ID');
    }

    $attendance_id = $data['attendance_id'];

    // Prepare and execute delete statement
    $stmt = $conn->prepare("DELETE FROM attendance WHERE attendance_id = ?");
    $stmt->bind_param("i", $attendance_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to execute database query: ' . $stmt->error);
    }

    $rowsAffected = $stmt->affected_rows;
    $stmt->close();
    
    if ($rowsAffected > 0) {
        $response = [
            'success' => true,
            'message' => 'Attendance record deleted successfully',
            'deleted_id' => $attendance_id
        ];
    } else {
        $response = [
            'success' => false,
            'message' => 'No attendance record found with that ID',
            'deleted_id' => null
        ];
    }

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