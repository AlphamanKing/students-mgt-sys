<?php
require_once 'db_connection.php';
header("Content-Type: application/json");

try {
    // Get top performers (highest average grades)
    $topQuery = "SELECT 
                s.student_id,
                s.name,
                ROUND(AVG(
                    CASE g.grade 
                        WHEN 'A' THEN 4.0
                        WHEN 'B' THEN 3.0
                        WHEN 'C' THEN 2.0
                        WHEN 'D' THEN 1.0
                        ELSE 0.0
                    END
                ), 2) as average_grade
                FROM students s
                JOIN grades g ON s.student_id = g.student_id
                GROUP BY s.student_id
                ORDER BY average_grade DESC
                LIMIT 5";
    
    // Get bottom performers (lowest average grades)
    $bottomQuery = "SELECT 
                   s.student_id,
                   s.name,
                   ROUND(AVG(
                       CASE g.grade 
                           WHEN 'A' THEN 4.0
                           WHEN 'B' THEN 3.0
                           WHEN 'C' THEN 2.0
                           WHEN 'D' THEN 1.0
                           ELSE 0.0
                       END
                   ), 2) as average_grade
                   FROM students s
                   JOIN grades g ON s.student_id = g.student_id
                   GROUP BY s.student_id
                   HAVING average_grade > 0
                   ORDER BY average_grade ASC
                   LIMIT 5";
    
    $topPerformers = $conn->query($topQuery)->fetchAll(PDO::FETCH_ASSOC);
    $bottomPerformers = $conn->query($bottomQuery)->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'top_performers' => $topPerformers,
            'bottom_performers' => $bottomPerformers
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>