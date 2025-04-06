<?php
// Define the password to be hashed
$password = "your_password_here";

// Generate a hashed password using bcrypt
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Print the hashed password
echo "Hashed Password: " . $hashed_password;
?>
