<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access'
    ]);
    exit;
}

require_once 'db_connection.php';

try {
    // Get grade distribution by subject
    $query = "
        SELECT 
            subject,
            COUNT(*) as total_grades,
            SUM(CASE 
                WHEN grade = 'A' THEN 95
                WHEN grade = 'B' THEN 85
                WHEN grade = 'C' THEN 75
                WHEN grade = 'D' THEN 65
                WHEN grade = 'F' THEN 55
                ELSE 0
            END) as total_points
        FROM grades
        GROUP BY subject
        ORDER BY subject
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $labels = [];
    $averages = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['subject'];
        $averages[] = round($row['total_points'] / $row['total_grades'], 2);
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'labels' => $labels,
            'averages' => $averages
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load performance statistics: ' . $e->getMessage()
    ]);
}

$conn->close(); 