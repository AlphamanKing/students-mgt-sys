<?php
// students.php
header("Content-Type: application/json");

// Include the database connection file
require 'db_config.php';

// SQL query to select all students
$sql = "SELECT * FROM students";
$result = $conn->query($sql);

$students = array();

if ($result->num_rows > 0) {
    // Output data for each row
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
}

// Return data as JSON
echo json_encode($students);

// Close the database connection
$conn->close();
?>
