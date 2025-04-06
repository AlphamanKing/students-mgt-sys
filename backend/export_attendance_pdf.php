<?php
session_start();
require_once 'config.php';
require_once 'functions.php';
require_once 'vendor/tcpdf/tcpdf.php';

header('Content-Type: application/pdf');

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

    // Get attendance data
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

    // Create new PDF document
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

    // Set document information
    $pdf->SetCreator('Student Information System');
    $pdf->SetAuthor('SIS System');
    $pdf->SetTitle('Attendance Report - ' . $student['name']);

    // Set default header data
    $pdf->SetHeaderData('', 0, 'Attendance Report', 'Student: ' . $student['name'] . ' (ID: ' . $student['student_id'] . ')');

    // Set header and footer fonts
    $pdf->setHeaderFont(Array('helvetica', '', 12));
    $pdf->setFooterFont(Array('helvetica', '', 8));

    // Set margins
    $pdf->SetMargins(15, 25, 15);
    $pdf->SetHeaderMargin(5);
    $pdf->SetFooterMargin(10);

    // Set auto page breaks
    $pdf->SetAutoPageBreak(TRUE, 25);

    // Add a page
    $pdf->AddPage();

    // Add attendance summary
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Attendance Summary', 0, 1, 'L');
    $pdf->Ln(5);

    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Total Classes: ' . $totalClasses, 0, 1, 'L');
    $pdf->Cell(0, 10, 'Present: ' . $presentCount, 0, 1, 'L');
    $pdf->Cell(0, 10, 'Absent: ' . $absentCount, 0, 1, 'L');
    $pdf->Cell(0, 10, 'Attendance Rate: ' . $attendanceRate . '%', 0, 1, 'L');
    $pdf->Cell(0, 10, 'Eligibility Status: ' . ($attendanceRate >= 75 ? 'Eligible' : 'Not Eligible'), 0, 1, 'L');

    $pdf->Ln(10);

    // Add detailed attendance records
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Detailed Attendance Records', 0, 1, 'L');
    $pdf->Ln(5);

    // Table header
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(95, 10, 'Date', 1, 0, 'C');
    $pdf->Cell(95, 10, 'Status', 1, 1, 'C');

    // Table data
    $pdf->SetFont('helvetica', '', 12);
    foreach ($attendance as $record) {
        $pdf->Cell(95, 10, $record['date'], 1, 0, 'L');
        $pdf->Cell(95, 10, ucfirst($record['status']), 1, 1, 'C');
    }

    // Add generation date
    $pdf->Ln(10);
    $pdf->SetFont('helvetica', 'I', 10);
    $pdf->Cell(0, 10, 'Generated on: ' . date('Y-m-d H:i:s'), 0, 1, 'L');

    // Output the PDF
    $pdf->Output('attendance_report.pdf', 'D');

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