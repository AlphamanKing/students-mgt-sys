<?php
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}
require_once 'config.php';
header('Content-Type: application/json');

try {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
        throw new Exception('Unauthorized access');
    }

    $userId = $_SESSION['user_id'];

    // Get student profile data
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.name,
            u.email,
            s.student_id,
            s.course
        FROM users u
        JOIN students s ON u.user_id = s.user_id
        WHERE u.user_id = ? AND u.role = 'student'
    ");

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Student not found');
    }

    $student = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'data' => [
            'student_id' => $student['student_id'],
            'name' => $student['name'],
            'email' => $student['email'],
            'course' => $student['course']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 