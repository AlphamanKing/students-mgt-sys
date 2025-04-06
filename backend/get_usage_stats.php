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
    // Get user registration trends for the last 7 days
    $query = "
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $dates = [];
    $counts = [];
    
    // Fill in missing dates with zero counts
    $end = new DateTime();
    $start = new DateTime('-6 days');
    $interval = new DateInterval('P1D');
    $dateRange = new DatePeriod($start, $interval, $end);
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[$row['date']] = (int)$row['count'];
    }
    
    foreach ($dateRange as $date) {
        $dateStr = $date->format('Y-m-d');
        $dates[] = $dateStr;
        $counts[] = isset($data[$dateStr]) ? $data[$dateStr] : 0;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'labels' => $dates,
            'values' => $counts
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load usage statistics: ' . $e->getMessage()
    ]);
}

$conn->close(); 