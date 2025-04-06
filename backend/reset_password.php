<?php
header("Content-Type: application/json");
require 'db_connection.php';

$input = json_decode(file_get_contents("php://input"), true);

if (empty($input['email']) || empty($input['new_password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and new password are required"]);
    exit;
}

$email = $input['email'];
$hashedPassword = password_hash($input['new_password'], PASSWORD_DEFAULT);

try {
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $email]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Password updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "No user found with that email"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>