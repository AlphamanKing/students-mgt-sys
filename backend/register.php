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
$name = mysqli_real_escape_string($conn, $input['name']);
$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$password = $input['password'];
$role = mysqli_real_escape_string($conn, $input['role']);
$course = isset($input['course']) ? mysqli_real_escape_string($conn, $input['course']) : null;

// Validate role
$validRoles = ['student', 'lecturer', 'admin'];
if (!in_array($role, $validRoles)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid role specified"]);
    exit;
}

try {
    // Check if email exists
    $check_email = "SELECT user_id FROM users WHERE email = '$email'";
    $result = mysqli_query($conn, $check_email);
    
    if (mysqli_num_rows($result) > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email already exists"]);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Start transaction
    mysqli_begin_transaction($conn);

    // Insert into users table
    $insert_user = "INSERT INTO users (name, email, password, role) VALUES ('$name', '$email', '$hashedPassword', '$role')";
    if (!mysqli_query($conn, $insert_user)) {
        throw new Exception(mysqli_error($conn));
    }
    $user_id = mysqli_insert_id($conn);

    // For students, insert into students table
    if ($role === 'student') {
        $insert_student = "INSERT INTO students (user_id, name, email, course) VALUES ('$user_id', '$name', '$email', '$course')";
        if (!mysqli_query($conn, $insert_student)) {
            throw new Exception(mysqli_error($conn));
        }
        $student_id = mysqli_insert_id($conn);
    }

    // Commit transaction
    mysqli_commit($conn);

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

} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Registration failed", "error" => $e->getMessage()]);
}

mysqli_close($conn);
?>