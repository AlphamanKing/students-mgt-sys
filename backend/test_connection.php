<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

require_once 'config.php';

try {
    $testData = [
        'database' => [
            'connected' => $conn && !$conn->connect_error,
            'error' => $conn->connect_error ?? null,
            'selected_db' => $conn->select_db(DB_NAME)
        ],
        'session' => [
            'active' => session_status() === PHP_SESSION_ACTIVE,
            'id' => session_id(),
            'data' => $_SESSION
        ],
        'server' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'],
            'document_root' => $_SERVER['DOCUMENT_ROOT'],
            'script_filename' => $_SERVER['SCRIPT_FILENAME']
        ]
    ];

    // Test database query
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        $tables = [];
        while ($row = $result->fetch_array()) {
            $tables[] = $row[0];
        }
        $testData['database']['tables'] = $tables;
    }

    echo json_encode([
        'success' => true,
        'data' => $testData
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?> 