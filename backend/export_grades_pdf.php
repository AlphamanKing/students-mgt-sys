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

    // Get grades data
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

    // Create new PDF document
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

    // Set document information
    $pdf->SetCreator('Student Information System');
    $pdf->SetAuthor('SIS System');
    $pdf->SetTitle('Academic Report - ' . $student['name']);

    // Set default header data
    $pdf->SetHeaderData('', 0, 'Academic Report', 'Student: ' . $student['name'] . ' (ID: ' . $student['student_id'] . ')');

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

    // Set font
    $pdf->SetFont('helvetica', '', 12);

    // Add grades table
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Grade Report', 0, 1, 'L');
    $pdf->Ln(5);

    // Table header
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(95, 10, 'Subject', 1, 0, 'C');
    $pdf->Cell(95, 10, 'Grade', 1, 1, 'C');

    // Table data
    $pdf->SetFont('helvetica', '', 12);
    foreach ($grades as $grade) {
        $pdf->Cell(95, 10, $grade['subject'], 1, 0, 'L');
        $pdf->Cell(95, 10, $grade['grade'], 1, 1, 'C');
    }

    // Calculate GPA
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

    // Add GPA
    $pdf->Ln(10);
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'GPA: ' . $gpa, 0, 1, 'L');

    // Add generation date
    $pdf->Ln(10);
    $pdf->SetFont('helvetica', 'I', 10);
    $pdf->Cell(0, 10, 'Generated on: ' . date('Y-m-d H:i:s'), 0, 1, 'L');

    // Output the PDF
    $pdf->Output('grades_report.pdf', 'D');

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