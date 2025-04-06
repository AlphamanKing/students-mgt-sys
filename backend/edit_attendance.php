<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);

try {
    if ($data['attendance_id']) {
        // Update existing record
        $stmt = $conn->prepare("
            UPDATE attendance 
            SET student_id = :student_id,
                date = :date,
                status = :status
            WHERE attendance_id = :attendance_id
        ");
    } else {
        // Create new record
        $stmt = $conn->prepare("
            INSERT INTO attendance (student_id, date, status)
            VALUES (:student_id, :date, :status)
        ");
    }
    
    $success = $stmt->execute([
        ':student_id' => $data['student_id'],
        ':date' => $data['date'],
        ':status' => $data['status'],
        ':attendance_id' => $data['attendance_id'] ?? null
    ]);
    
    echo json_encode([
        'success' => $success,
        'message' => $success ? 'Attendance recorded' : 'Failed to record attendance'
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>