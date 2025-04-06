<?php
session_start();
require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['new_email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$user_id = $_SESSION['user_id'];
$new_email = $input['new_email'];
$password = $input['password'];

try {
    // Start transaction
    $conn->begin_transaction();

    // Verify current password
    $stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        $conn->rollback();
        http_response_code(401);
        echo json_encode(['error' => 'Invalid password']);
        exit;
    }

    // Check if new email already exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
    $stmt->bind_param("si", $new_email, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $conn->rollback();
        http_response_code(400);
        echo json_encode(['error' => 'Email already in use']);
        exit;
    }

    // Update email in users table
    $stmt = $conn->prepare("UPDATE users SET email = ? WHERE user_id = ?");
    $stmt->bind_param("si", $new_email, $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update email in users table');
    }

    // Update email in students table
    $stmt = $conn->prepare("UPDATE students SET email = ? WHERE user_id = ?");
    $stmt->bind_param("si", $new_email, $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to update email in students table');
    }

    // Commit transaction
    $conn->commit();
    
    $_SESSION['email'] = $new_email;
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 