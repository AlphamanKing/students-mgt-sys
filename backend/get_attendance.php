<?php
session_start();
require_once 'config.php';
require_once 'functions.php';

header('Content-Type: application/json');

try {
    // Check if student_id is provided in query parameters (for specific student view)
    if (isset($_GET['student_id'])) {
        $studentId = $_GET['student_id'];
        
        // Get attendance records for the specified student
        $stmt = $conn->prepare("
            SELECT 
                a.attendance_id,
                a.student_id,
                DATE_FORMAT(a.date, '%Y-%m-%d') as date,
                a.status,
                s.name as student_name
            FROM attendance a
            JOIN students s ON a.student_id = s.student_id
            WHERE a.student_id = ?
            ORDER BY a.date DESC
        ");
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $attendance = [];
        while ($row = $result->fetch_assoc()) {
            $attendance[] = [
                'attendance_id' => $row['attendance_id'],
                'student_id' => $row['student_id'],
                'date' => $row['date'],
                'status' => $row['status'],
                'student_name' => $row['student_name']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $attendance
        ]);
    } else {
        // For analytics view (all students' attendance with dates)
        $stmt = $conn->prepare("
            SELECT 
                a.attendance_id,
                a.student_id,
                s.name as student_name,
                DATE_FORMAT(a.date, '%Y-%m-%d') as date,
                a.status
            FROM students s
            LEFT JOIN attendance a ON s.student_id = a.student_id
            ORDER BY a.date ASC, s.name
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $attendance = [];
        while ($row = $result->fetch_assoc()) {
            $attendance[] = [
                'attendance_id' => $row['attendance_id'],
                'student_id' => $row['student_id'],
                'student_name' => $row['student_name'],
                'date' => $row['date'],
                'status' => $row['status']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $attendance
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>