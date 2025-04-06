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

// Since we don't have a settings table yet, return default settings
echo json_encode([
    'success' => true,
    'data' => [
        'general' => [
            'system_name' => 'Student Information System',
            'academic_year' => date('Y'),
            'maintenance_mode' => false
        ],
        'email' => [
            'smtp_server' => '',
            'smtp_port' => '587',
            'email_from' => ''
        ],
        'backup' => [
            'auto_backup' => false,
            'frequency' => 'daily'
        ]
    ]
]); 