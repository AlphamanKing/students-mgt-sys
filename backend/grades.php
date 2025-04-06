<?php
// grades.php
header("Content-Type: application/json");

require 'db_config.php';

$sql = "SELECT * FROM grades";
$result = $conn->query($sql);

$grades = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $grades[] = $row;
    }
}

echo json_encode($grades);
$conn->close();
?>
