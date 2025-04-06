<?php
session_start();
require_once 'config.php';
require_once 'functions.php';

// Set headers for CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="academic_report.csv"');

try {
    // Get student data
    $stmt = $conn->prepare("
        SELECT s.name, s.student_id 
        FROM students s 
        WHERE s.user_id = ?
    ");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();

    if (!$student) {
        throw new Exception('Student not found');
    }

    // Create output handle
    $output = fopen('php://output', 'w');

    // Add UTF-8 BOM for Excel compatibility
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Write student information
    fputcsv($output, ['Student Report']);
    fputcsv($output, ['Name:', $student['name']]);
    fputcsv($output, ['Student ID:', $student['student_id']]);
    fputcsv($output, ['Generated on:', date('Y-m-d H:i:s')]);
    fputcsv($output, []); // Empty line

    // Get and write grades
    $stmt = $conn->prepare("
        SELECT subject, grade
        FROM grades
        WHERE student_id = ?
        ORDER BY subject ASC
    ");
    $stmt->bind_param("i", $student['student_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $grades = $result->fetch_all(MYSQLI_ASSOC);

    // Write grades section
    fputcsv($output, ['Grades Report']);
    fputcsv($output, ['Subject', 'Grade']);
    foreach ($grades as $grade) {
        fputcsv($output, [$grade['subject'], $grade['grade']]);
    }

    // Calculate and write GPA
    $gradePoints = [
        'A' => 4.0,
        'B' => 3.0,
        'C' => 2.0,
        'D' => 1.0,
        'F' => 0.0
    ];

    $totalPoints = 0;
    $totalSubjects = count($grades);
    foreach ($grades as $grade) {
        $totalPoints += $gradePoints[strtoupper($grade['grade'])] ?? 0;
    }
    $gpa = $totalSubjects > 0 ? round($totalPoints / $totalSubjects, 2) : 0;

    fputcsv($output, []); // Empty line
    fputcsv($output, ['GPA:', $gpa]);
    fputcsv($output, []); // Empty line

    // Get and write attendance
    $stmt = $conn->prepare("
        SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, status
        FROM attendance
        WHERE student_id = ?
        ORDER BY date DESC
    ");
    $stmt->bind_param("i", $student['student_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $attendance = $result->fetch_all(MYSQLI_ASSOC);

    // Calculate attendance statistics
    $totalClasses = count($attendance);
    $presentCount = array_reduce($attendance, function($carry, $record) {
        return $carry + ($record['status'] === 'present' ? 1 : 0);
    }, 0);
    $absentCount = $totalClasses - $presentCount;
    $attendanceRate = $totalClasses > 0 ? round(($presentCount / $totalClasses) * 100, 1) : 0;

    // Write attendance summary
    fputcsv($output, ['Attendance Summary']);
    fputcsv($output, ['Total Classes:', $totalClasses]);
    fputcsv($output, ['Present:', $presentCount]);
    fputcsv($output, ['Absent:', $absentCount]);
    fputcsv($output, ['Attendance Rate:', $attendanceRate . '%']);
    fputcsv($output, ['Eligibility Status:', $attendanceRate >= 75 ? 'Eligible' : 'Not Eligible']);
    fputcsv($output, []); // Empty line

    // Write detailed attendance
    fputcsv($output, ['Detailed Attendance Records']);
    fputcsv($output, ['Date', 'Status']);
    foreach ($attendance as $record) {
        fputcsv($output, [$record['date'], ucfirst($record['status'])]);
    }

    fclose($output);

} catch (Exception $e) {
    // If error occurs, return JSON error response
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?> 