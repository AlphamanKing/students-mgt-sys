<?php
session_start();
require_once 'config.php';
require_once 'functions.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        throw new Exception('Unauthorized access');
    }

    $userId = $_SESSION['user_id'];
    $role = $_SESSION['role'];
    
    // Check if student_id is provided in the query string
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    
    // For lecturers: Return all grades or filter by student_id if provided
    if ($role === 'lecturer') {
        if ($studentId) {
            // Filter grades by student_id
            $stmt = $conn->prepare("
                SELECT 
                    g.grade_id,
                    g.student_id,
                    s.name as student_name,
                    g.subject,
                    g.grade
                FROM grades g
                JOIN students s ON g.student_id = s.student_id
                WHERE g.student_id = ?
                ORDER BY g.subject ASC
            ");
            $stmt->bind_param("i", $studentId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            // Return all grades
            $stmt = $conn->prepare("
                SELECT 
                    g.grade_id,
                    g.student_id,
                    s.name as student_name,
                    g.subject,
                    g.grade
                FROM grades g
                JOIN students s ON g.student_id = s.student_id
                ORDER BY s.name ASC, g.subject ASC
            ");
            $stmt->execute();
            $result = $stmt->get_result();
        }
        
        $grades = [];
        while ($row = $result->fetch_assoc()) {
            $grades[] = [
                'grade_id' => $row['grade_id'],
                'student_id' => $row['student_id'],
                'student_name' => $row['student_name'],
                'subject' => $row['subject'],
                'grade' => $row['grade']
            ];
        }
    }
    // For students: Return only their grades
    else if ($role === 'student') {
        // First get the student_id
        $stmt = $conn->prepare("SELECT student_id FROM students WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception('Student not found');
        }
        
        $student = $result->fetch_assoc();
        $studentId = $student['student_id'];
        
        // Get student's grades
        $stmt = $conn->prepare("
            SELECT 
                grade_id,
                student_id,
                subject,
                grade,
                CASE grade
                    WHEN 'A' THEN 95
                    WHEN 'B' THEN 85
                    WHEN 'C' THEN 75
                    WHEN 'D' THEN 65
                    WHEN 'F' THEN 55
                    ELSE 0
                END as score
            FROM grades 
            WHERE student_id = ?
            ORDER BY subject ASC
        ");
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $grades = [];
        while ($row = $result->fetch_assoc()) {
            $grades[] = [
                'grade_id' => $row['grade_id'],
                'student_id' => $row['student_id'],
                'subject' => $row['subject'],
                'grade' => $row['grade'],
                'score' => (float)$row['score']
            ];
        }
    } else {
        throw new Exception('Invalid role');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $grades
    ]);

} catch (Exception $e) {
    error_log("Error in get_grades.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>