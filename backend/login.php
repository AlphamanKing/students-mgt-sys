<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

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

$input = json_decode(file_get_contents("php://input"), true);

if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and password are required"]);
    exit;
}

$email = $input['email'];
$password = $input['password'];

try {
    $stmt = $conn->prepare("
        SELECT 
            u.user_id, 
            u.password, 
            u.role, 
            u.name,
            s.student_id,
            s.course
        FROM users u
        LEFT JOIN students s ON u.user_id = s.user_id
        WHERE u.email = ?
    ");
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
        exit;
    }

    // Set individual session variables
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['email'] = $email;
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    if ($user['role'] === 'student') {
        $_SESSION['student_id'] = $user['student_id'];
    }

    // Return all necessary user data
    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => [
            "user_id" => $user['user_id'],
            "name" => $user['name'],
            "email" => $email,
            "role" => $user['role'],
            "student_id" => $user['student_id'],
            "course" => $user['course']
        ]
    ]);

} catch (Exception $e) {
    error_log('Login Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database error",
        "debug" => $e->getMessage()
    ]);
}
?>