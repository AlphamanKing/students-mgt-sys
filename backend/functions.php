<?php
// Function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate student ID
function validate_student_id($student_id) {
    return preg_match('/^[A-Z0-9]+$/', $student_id);
}

// Function to check if user is logged in
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Function to check if user is a student
function is_student() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'student';
}

// Function to check if user is a lecturer
function is_lecturer() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'lecturer';
}

// Function to check if user is an admin
function is_admin() {
    return isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'admin';
}

// Function to get user data
function get_user_data($conn, $user_id) {
    $stmt = $conn->prepare("SELECT id, name, email, user_type FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}
?> 