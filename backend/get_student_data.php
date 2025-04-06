<?php
session_start();
require_once 'config.php';
require_once 'functions.php';

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Debug session state
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('No user_id in session');
    }
    if (!isset($_SESSION['role'])) {
        throw new Exception('No role in session');
    }
    if ($_SESSION['role'] !== 'student') {
        throw new Exception('User is not a student. Role: ' . $_SESSION['role']);
    }

    $userId = $_SESSION['user_id'];
    
    // Get student data from database
    $stmt = $conn->prepare("
        SELECT u.user_id as id, u.name, u.email, s.student_id
        FROM users u
        JOIN students s ON u.user_id = s.user_id
        WHERE u.user_id = ? AND u.role = 'student'
    ");

    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $bindResult = $stmt->bind_param("i", $userId);
    if (!$bindResult) {
        throw new Exception('Binding parameters failed: ' . $stmt->error);
    }

    $executeResult = $stmt->execute();
    if (!$executeResult) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception('Getting result set failed: ' . $stmt->error);
    }
    
    if ($result->num_rows === 0) {
        throw new Exception('Student not found for user_id: ' . $userId);
    }
    
    $user = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'student_id' => $user['student_id']
        ]
    ]);

} catch (Exception $e) {
    error_log('Student Dashboard Error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'session' => $_SESSION,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?> 