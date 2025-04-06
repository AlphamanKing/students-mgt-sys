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
            SET student_id = :student_id,
                date = :date,
                status = :status
            WHERE attendance_id = :attendance_id
        ");
        $params = [
            ':attendance_id' => $input['attendance_id'],
            ':student_id' => $input['student_id'],
            ':date' => $input['date'],
            ':status' => $input['status']
        ];
    } else {
        // Insert new record
        $stmt = $conn->prepare("
            INSERT INTO attendance (student_id, date, status)
            VALUES (:student_id, :date, :status)
        ");
        $params = [
            ':student_id' => $input['student_id'],
            ':date' => $input['date'],
            ':status' => $input['status']
        ];
    }

    $success = $stmt->execute($params);

    if ($success) {
        $response = [
            'success' => true,
            'message' => 'Attendance record saved successfully',
            'attendance_id' => $input['attendance_id'] ?? $conn->lastInsertId()
        ];
    } else {
        throw new Exception('Failed to save attendance record');
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

// Ensure we only output JSON
echo json_encode($response);
exit;
?>