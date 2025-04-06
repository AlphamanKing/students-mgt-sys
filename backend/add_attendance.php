<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'db_connection.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

try {
    // Validate required fields
    if (empty($input['student_id']) || empty($input['date']) || empty($input['status'])) {
        throw new Exception('All fields are required');
    }

    // Prepare SQL based on whether we're updating or inserting
    if (!empty($input['attendance_id'])) {
        // Update existing record
        $stmt = $conn->prepare("
            UPDATE attendance 
            SET student_id = ?,
                date = ?,
                status = ?
            WHERE attendance_id = ?
        ");
        $stmt->bind_param("issi", 
            $input['student_id'], 
            $input['date'], 
            $input['status'],
            $input['attendance_id']
        );
    } else {
        // Insert new record
        $stmt = $conn->prepare("
            INSERT INTO attendance (student_id, date, status)
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param("iss", 
            $input['student_id'], 
            $input['date'], 
            $input['status']
        );
    }

    if (!$stmt->execute()) {
        throw new Exception('Failed to save attendance record: ' . $stmt->error);
    }

    $attendanceId = !empty($input['attendance_id']) ? $input['attendance_id'] : $stmt->insert_id;
    $stmt->close();

    $response = [
        'success' => true,
        'message' => 'Attendance record saved successfully',
        'attendance_id' => $attendanceId
    ];

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
}

// Ensure we only output JSON
echo json_encode($response);
exit;
?>