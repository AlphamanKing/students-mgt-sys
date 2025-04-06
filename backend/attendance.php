<?php
// attendance.php
header("Content-Type: application/json");

require 'db_config.php';

$sql = "SELECT * FROM attendance";
$result = $conn->query($sql);

$attendance = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $attendance[] = $row;
    }
}

echo json_encode($attendance);
$conn->close();
?>
