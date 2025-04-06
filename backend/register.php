<?php
header("Content-Type: application/json");
require 'db_connection.php';

$input = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$required = ['name', 'email', 'password', 'role'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$field is required"]);
        exit;
    }
}

// Extract and sanitize inputs
$name = htmlspecialchars($input['name']);
$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$password = $input['password'];
$role = $input['role'];
$course = $input['course'] ?? null;

// Validate role
$validRoles = ['student', 'lecturer', 'admin'];
if (!in_array($role, $validRoles)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid role specified"]);
    exit;
}

try {
    // Check if email exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email already exists"]);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Start transaction
    $conn->beginTransaction();

    // Insert into users table
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $role]);
    $user_id = $conn->lastInsertId();

    // For students, insert into students table
    if ($role === 'student') {
        $stmt = $conn->prepare("INSERT INTO students (user_id, name, email, course) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $name, $email, $course]);
        $student_id = $conn->lastInsertId();
    }

    // Commit transaction
    $conn->commit();

    // Prepare response data
    $response = [
        "success" => true,
        "message" => "Registration successful",
        "user" => [
            "user_id" => $user_id,
            "name" => $name,
            "email" => $email,
            "role" => $role
        ]
    ];

    // Add student-specific data if applicable
    if ($role === 'student') {
        $response['user']['student_id'] = $student_id;
        $response['user']['course'] = $course;
    }

    echo json_encode($response);

} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Registration failed", "error" => $e->getMessage()]);
}
?>