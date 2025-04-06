<?php
header("Content-Type: application/json");
require 'db_connection.php';

$input = json_decode(file_get_contents("php://input"), true);

if (empty($input['email'])) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);

try {
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        // In a real system, you'd generate/send a token here
        echo json_encode([
            "success" => true,
            "message" => "If this email exists, you can reset your password",
            "email" => $email // Return email for frontend to use
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Email not found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>