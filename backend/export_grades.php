<?php
require_once 'db_connection.php';

header("Content-Type: text/csv");
header("Content-Disposition: attachment; filename=grades.csv");

$student_id = (int)$_GET['student_id'];

// Get data
$stmt = $conn->prepare("SELECT subject, grade FROM grades WHERE student_id = ?");
$stmt->execute([$student_id]);

// Output CSV
$output = fopen('php://output', 'w');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($output, $row);
}
fclose($output);