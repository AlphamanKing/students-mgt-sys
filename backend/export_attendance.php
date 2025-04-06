<?php
require 'db_config.php';

header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=attendance_export.csv');

$output = fopen('php://output', 'w');
fputcsv($output, ['Attendance ID', 'Student ID', 'Date', 'Status', 'Marked On']);

$sql = "SELECT attendance_id, student_id, date, status, created_at FROM attendance";
$result = $conn->query($sql);

while ($row = $result->fetch_assoc()) {
    fputcsv($output, $row);
}

fclose($output);
$conn->close();
exit;
