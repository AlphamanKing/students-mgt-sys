<?php
// This script sets up the lecturers table in the database
require_once 'db_connection.php';

try {
    // Read the SQL file
    $sql = file_get_contents('create_lecturers_table.sql');
    
    // Execute the SQL
    if ($conn->multi_query($sql)) {
        do {
            // Store first result set
            if ($result = $conn->store_result()) {
                $result->free();
            }
        } while ($conn->more_results() && $conn->next_result());
    }
    
    echo "Lecturers table created successfully!";
    
} catch (Exception $e) {
    echo "Error creating lecturers table: " . $e->getMessage();
}

if ($conn) {
    $conn->close();
} 