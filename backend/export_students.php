<?php
require 'db_config.php';

header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=students_export.csv');

// Open output stream
$output = fopen('php://output', 'w');

// Add column headers
fputcsv($output, ['Student ID', 'Name', 'Email', 'Course', 'Registered On']);

// Fetch student records
$sql = "SELECT student_id, name, email, course, created_at FROM students";
$result = $conn->query($sql);

// Write rows to CSV
while ($row = $result->fetch_assoc()) {
    fputcsv($output, $row);
}

fclose($output);
$conn->close();
exit;
