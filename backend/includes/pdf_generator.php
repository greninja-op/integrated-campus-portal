<?php
/**
 * PDF Generator Helper
 * 
 * Centralized PDF generation using TCPDF library for all downloadable documents.
 * Provides functions for generating ID cards, receipts, and performance reports.
 * 
 * Requirements: 14.1, 14.2
 */

// Include TCPDF library
require_once __DIR__ . '/../vendor/autoload.php';

// Institution branding constants
define('PDF_INSTITUTION_NAME', 'Student Portal Management System');
define('PDF_INSTITUTION_ADDRESS', 'Address Line 1, City, State - PIN');
define('PDF_INSTITUTION_PHONE', '+91 1234567890');
define('PDF_INSTITUTION_EMAIL', 'info@institution.edu');
define('PDF_INSTITUTION_WEBSITE', 'https://portal.institution.edu');

// PDF styling constants
define('PDF_HEADER_COLOR', [41, 128, 185]); // RGB for header background
define('PDF_PRIMARY_COLOR', [52, 152, 219]); // RGB for primary elements
define('PDF_TEXT_COLOR', [44, 62, 80]); // RGB for text
define('PDF_BORDER_COLOR', [189, 195, 199]); // RGB for borders

/**
 * Initialize TCPDF instance with institution branding
 * 
 * @param string $orientation Page orientation ('P' for portrait, 'L' for landscape)
 * @param string $format Page format ('A4', 'LETTER', or custom array [width, height] in mm)
 * @return TCPDF Configured TCPDF object
 */
function initializePDF($orientation = 'P', $format = 'A4') {
    // Create new PDF document
    $pdf = new TCPDF($orientation, 'mm', $format, true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('Student Portal System');
    $pdf->SetAuthor(PDF_INSTITUTION_NAME);
    $pdf->SetTitle('Document');
    
    // Remove default header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Set default monospaced font
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
    
    // Set margins
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetAutoPageBreak(true, 15);
    
    // Set image scale factor
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
    
    // Set default font
    $pdf->SetFont('helvetica', '', 10);
    
    return $pdf;
}

/**
 * Generate student ID card PDF
 * 
 * @param array $studentData Student information including:
 *   - student_id: Unique student identifier
 *   - full_name: Student's full name
 *   - department: Department name
 *   - semester: Current semester
 *   - enrollment_date: Date of enrollment
 *   - profile_image: Path to profile image (optional)
 *   - valid_until: Expiry date of ID card
 * @return string Path to generated PDF file in temp directory
 */
function generateIDCard($studentData) {
    // Initialize PDF with ID card dimensions (85.6mm × 53.98mm)
    $pdf = initializePDF('L', [53.98, 85.6]);
    
    // Add a page
    $pdf->AddPage();
    
    // Set fill color for header
    $pdf->SetFillColor(PDF_HEADER_COLOR[0], PDF_HEADER_COLOR[1], PDF_HEADER_COLOR[2]);
    $pdf->Rect(0, 0, 85.6, 12, 'F');
    
    // Institution name in header
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetXY(5, 3);
    $pdf->Cell(75.6, 6, PDF_INSTITUTION_NAME, 0, 1, 'C');
    
    // Reset text color
    $pdf->SetTextColor(PDF_TEXT_COLOR[0], PDF_TEXT_COLOR[1], PDF_TEXT_COLOR[2]);
    
    // Add profile photo if available
    $photoX = 8;
    $photoY = 15;
    $photoSize = 20;
    
    if (!empty($studentData['profile_image'])) {
        $imagePath = __DIR__ . '/../' . $studentData['profile_image'];
        $realImagePath = realpath($imagePath);
        $uploadsDir = realpath(__DIR__ . '/../uploads');
        
        // Ensure image is within uploads directory and exists
        if ($realImagePath && strpos($realImagePath, $uploadsDir) === 0 && file_exists($realImagePath)) {
             $pdf->Image($realImagePath, $photoX, $photoY, $photoSize, $photoSize, '', '', '', true, 150, '', false, false, 1);
        } else {
             // Draw placeholder rectangle for photo
             $pdf->SetDrawColor(PDF_BORDER_COLOR[0], PDF_BORDER_COLOR[1], PDF_BORDER_COLOR[2]);
             $pdf->Rect($photoX, $photoY, $photoSize, $photoSize);
             $pdf->SetFont('helvetica', '', 8);
             $pdf->SetXY($photoX, $photoY + 8);
             $pdf->Cell($photoSize, 4, 'No Photo', 0, 0, 'C');
        }
    } else {
        // Draw placeholder rectangle for photo
        $pdf->SetDrawColor(PDF_BORDER_COLOR[0], PDF_BORDER_COLOR[1], PDF_BORDER_COLOR[2]);
        $pdf->Rect($photoX, $photoY, $photoSize, $photoSize);
        $pdf->SetFont('helvetica', '', 8);
        $pdf->SetXY($photoX, $photoY + 8);
        $pdf->Cell($photoSize, 4, 'No Photo', 0, 0, 'C');
    }
    
    // Student details
    $detailsX = $photoX + $photoSize + 3;
    $detailsY = 16;
    $lineHeight = 4.5;
    
    $pdf->SetFont('helvetica', 'B', 9);
    $pdf->SetXY($detailsX, $detailsY);
    $pdf->Cell(50, $lineHeight, 'Name:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY($detailsX + 12, $detailsY);
    $pdf->Cell(38, $lineHeight, $studentData['full_name'], 0, 1, 'L');
    
    $detailsY += $lineHeight;
    $pdf->SetFont('helvetica', 'B', 9);
    $pdf->SetXY($detailsX, $detailsY);
    $pdf->Cell(50, $lineHeight, 'ID:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY($detailsX + 12, $detailsY);
    $pdf->Cell(38, $lineHeight, $studentData['student_id'], 0, 1, 'L');
    
    $detailsY += $lineHeight;
    $pdf->SetFont('helvetica', 'B', 9);
    $pdf->SetXY($detailsX, $detailsY);
    $pdf->Cell(50, $lineHeight, 'Dept:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY($detailsX + 12, $detailsY);
    $pdf->Cell(38, $lineHeight, $studentData['department'], 0, 1, 'L');
    
    $detailsY += $lineHeight;
    $pdf->SetFont('helvetica', 'B', 9);
    $pdf->SetXY($detailsX, $detailsY);
    $pdf->Cell(50, $lineHeight, 'Semester:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY($detailsX + 12, $detailsY);
    $pdf->Cell(38, $lineHeight, $studentData['semester'], 0, 1, 'L');
    
    // Generate QR code with student verification data
    $qrData = json_encode([
        'student_id' => $studentData['student_id'],
        'verification_url' => PDF_INSTITUTION_WEBSITE . '/verify/' . $studentData['student_id']
    ]);
    
    embedQRCode($pdf, $qrData, 8, 38, 15);
    
    // Valid until date
    $pdf->SetFont('helvetica', '', 7);
    $pdf->SetXY(25, 42);
    $pdf->Cell(55, 4, 'Valid Until: ' . date('M Y', strtotime($studentData['valid_until'])), 0, 0, 'L');
    
    // Save to temp directory
    $tempDir = __DIR__ . '/../uploads/temp/';
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0777, true);
    }
    
    $filename = 'id_card_' . $studentData['student_id'] . '_' . time() . '.pdf';
    $filepath = $tempDir . $filename;
    
    $pdf->Output($filepath, 'F');
    
    return $filepath;
}

/**
 * Generate payment receipt PDF
 * 
 * @param array $paymentData Payment information including:
 *   - receipt_number: Unique receipt number
 *   - payment_date: Date of payment
 *   - student_name: Student's full name
 *   - student_id: Student identifier
 *   - department: Department name
 *   - semester: Current semester
 *   - fee_type: Type of fee
 *   - fee_name: Name of fee
 *   - base_amount: Base fee amount
 *   - late_fine: Late fine amount
 *   - total_amount: Total amount paid
 *   - payment_method: Method of payment
 *   - transaction_id: Transaction identifier
 * @return string Path to generated PDF file in temp directory
 */
function generateReceipt($paymentData) {
    // Initialize PDF with A4 portrait
    $pdf = initializePDF('P', 'A4');
    
    // Add a page
    $pdf->AddPage();
    
    // Institution header
    $pdf->SetFillColor(PDF_HEADER_COLOR[0], PDF_HEADER_COLOR[1], PDF_HEADER_COLOR[2]);
    $pdf->Rect(0, 0, 210, 35, 'F');
    
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetXY(15, 10);
    $pdf->Cell(180, 8, PDF_INSTITUTION_NAME, 0, 1, 'C');
    
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, 20);
    $pdf->Cell(180, 5, PDF_INSTITUTION_ADDRESS, 0, 1, 'C');
    $pdf->SetXY(15, 25);
    $pdf->Cell(180, 5, 'Phone: ' . PDF_INSTITUTION_PHONE . ' | Email: ' . PDF_INSTITUTION_EMAIL, 0, 1, 'C');
    
    // Reset text color
    $pdf->SetTextColor(PDF_TEXT_COLOR[0], PDF_TEXT_COLOR[1], PDF_TEXT_COLOR[2]);
    
    // Receipt title
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->SetXY(15, 45);
    $pdf->Cell(180, 8, 'FEE PAYMENT RECEIPT', 0, 1, 'C');
    
    // Receipt details
    $pdf->SetFont('helvetica', '', 10);
    $y = 60;
    
    $pdf->SetXY(15, $y);
    $pdf->Cell(90, 6, 'Receipt No: ' . $paymentData['receipt_number'], 0, 0, 'L');
    $pdf->Cell(90, 6, 'Date: ' . date('F d, Y', strtotime($paymentData['payment_date'])), 0, 1, 'R');
    
    // Horizontal line
    $y += 10;
    $pdf->Line(15, $y, 195, $y);
    
    // Student details section
    $y += 8;
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 6, 'Student Details:', 0, 1, 'L');
    
    $y += 8;
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Name: ' . $paymentData['student_name'], 0, 1, 'L');
    
    $y += 6;
    $pdf->SetXY(15, $y);
    $pdf->Cell(90, 5, 'Student ID: ' . $paymentData['student_id'], 0, 0, 'L');
    $pdf->Cell(90, 5, 'Department: ' . $paymentData['department'] . ', Semester: ' . $paymentData['semester'], 0, 1, 'L');
    
    // Fee details section
    $y += 12;
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 6, 'Fee Details:', 0, 1, 'L');
    
    // Table header
    $y += 8;
    $pdf->SetFillColor(240, 240, 240);
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(120, 7, 'Description', 1, 0, 'L', true);
    $pdf->Cell(60, 7, 'Amount', 1, 1, 'R', true);
    
    // Table rows
    $y += 7;
    $pdf->SetFont('helvetica', '', 10);
    
    // Fee type row
    $pdf->SetXY(15, $y);
    $pdf->Cell(120, 6, $paymentData['fee_type'] . ' - ' . $paymentData['fee_name'], 1, 0, 'L');
    $pdf->Cell(60, 6, '₹' . number_format($paymentData['base_amount'], 2), 1, 1, 'R');
    
    // Late fine row (if applicable)
    if ($paymentData['late_fine'] > 0) {
        $y += 6;
        $pdf->SetXY(15, $y);
        $pdf->Cell(120, 6, 'Late Fine', 1, 0, 'L');
        $pdf->Cell(60, 6, '₹' . number_format($paymentData['late_fine'], 2), 1, 1, 'R');
    }
    
    // Total row
    $y += 6;
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->SetXY(15, $y);
    $pdf->Cell(120, 7, 'Total Amount', 1, 0, 'L', true);
    $pdf->Cell(60, 7, '₹' . number_format($paymentData['total_amount'], 2), 1, 1, 'R', true);
    
    // Payment details
    $y += 12;
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Payment Method: ' . ucfirst($paymentData['payment_method']), 0, 1, 'L');
    
    $y += 6;
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Transaction ID: ' . $paymentData['transaction_id'], 0, 1, 'L');
    
    // Footer note
    $y += 20;
    $pdf->SetFont('helvetica', 'I', 9);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'This is a computer-generated receipt and does not require a signature.', 0, 1, 'C');
    
    // Authorized signature placeholder
    $y += 30;
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, '_______________________', 0, 1, 'R');
    $pdf->SetXY(15, $y + 5);
    $pdf->Cell(180, 5, 'Authorized Signature', 0, 1, 'R');
    
    // Save to temp directory
    $tempDir = __DIR__ . '/../uploads/temp/';
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0777, true);
    }
    
    $filename = 'receipt_' . $paymentData['receipt_number'] . '_' . time() . '.pdf';
    $filepath = $tempDir . $filename;
    
    $pdf->Output($filepath, 'F');
    
    return $filepath;
}

/**
 * Generate academic performance report PDF
 * 
 * @param array $studentData Student information
 * @param array $marksData Marks data grouped by semester
 * @return string Path to generated PDF file in temp directory
 */
function generatePerformanceReport($studentData, $marksData) {
    // Initialize PDF with A4 portrait
    $pdf = initializePDF('P', 'A4');
    
    // Add a page
    $pdf->AddPage();
    
    // Institution header
    $pdf->SetFillColor(PDF_HEADER_COLOR[0], PDF_HEADER_COLOR[1], PDF_HEADER_COLOR[2]);
    $pdf->Rect(0, 0, 210, 35, 'F');
    
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetXY(15, 8);
    $pdf->Cell(180, 8, PDF_INSTITUTION_NAME, 0, 1, 'C');
    
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->SetXY(15, 18);
    $pdf->Cell(180, 7, 'ACADEMIC PERFORMANCE REPORT', 0, 1, 'C');
    
    // Reset text color
    $pdf->SetTextColor(PDF_TEXT_COLOR[0], PDF_TEXT_COLOR[1], PDF_TEXT_COLOR[2]);
    
    // Student information
    $y = 45;
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(90, 5, 'Student: ' . $studentData['full_name'] . ' (' . $studentData['student_id'] . ')', 0, 0, 'L');
    $pdf->Cell(90, 5, 'Department: ' . $studentData['department'], 0, 1, 'R');
    
    $y += 6;
    $pdf->SetXY(15, $y);
    $pdf->Cell(90, 5, 'Enrollment: ' . date('F Y', strtotime($studentData['enrollment_date'])), 0, 0, 'L');
    $pdf->Cell(90, 5, 'Current Semester: ' . $studentData['semester'], 0, 1, 'R');
    
    // Process each semester
    $y += 12;
    $cumulativeCredits = 0;
    $cumulativeCreditPoints = 0;
    
    foreach ($marksData as $semester => $subjects) {
        // Check if we need a new page
        if ($y > 240) {
            $pdf->AddPage();
            $y = 20;
        }
        
        // Semester header
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetFillColor(PDF_PRIMARY_COLOR[0], PDF_PRIMARY_COLOR[1], PDF_PRIMARY_COLOR[2]);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetXY(15, $y);
        $pdf->Cell(180, 7, 'SEMESTER ' . $semester, 0, 1, 'L', true);
        
        $pdf->SetTextColor(PDF_TEXT_COLOR[0], PDF_TEXT_COLOR[1], PDF_TEXT_COLOR[2]);
        
        // Table header
        $y += 7;
        $pdf->SetFillColor(240, 240, 240);
        $pdf->SetFont('helvetica', 'B', 9);
        $pdf->SetXY(15, $y);
        $pdf->Cell(20, 6, 'Code', 1, 0, 'C', true);
        $pdf->Cell(55, 6, 'Subject Name', 1, 0, 'C', true);
        $pdf->Cell(15, 6, 'Credits', 1, 0, 'C', true);
        $pdf->Cell(20, 6, 'Internal', 1, 0, 'C', true);
        $pdf->Cell(20, 6, 'External', 1, 0, 'C', true);
        $pdf->Cell(20, 6, 'Total', 1, 0, 'C', true);
        $pdf->Cell(15, 6, 'Grade', 1, 0, 'C', true);
        $pdf->Cell(15, 6, 'GP', 1, 1, 'C', true);
        
        // Table rows
        $pdf->SetFont('helvetica', '', 9);
        $semesterCredits = 0;
        $semesterCreditPoints = 0;
        
        foreach ($subjects as $subject) {
            $y += 6;
            $pdf->SetXY(15, $y);
            $pdf->Cell(20, 6, $subject['subject_code'], 1, 0, 'C');
            $pdf->Cell(55, 6, substr($subject['subject_name'], 0, 30), 1, 0, 'L');
            $pdf->Cell(15, 6, $subject['credit_hours'], 1, 0, 'C');
            $pdf->Cell(20, 6, number_format($subject['internal_marks'], 2), 1, 0, 'C');
            $pdf->Cell(20, 6, number_format($subject['external_marks'], 2), 1, 0, 'C');
            $pdf->Cell(20, 6, number_format($subject['total_marks'], 2), 1, 0, 'C');
            $pdf->Cell(15, 6, $subject['letter_grade'], 1, 0, 'C');
            $pdf->Cell(15, 6, number_format($subject['grade_point'], 2), 1, 1, 'C');
            
            $semesterCredits += $subject['credit_hours'];
            $semesterCreditPoints += $subject['credit_points'];
        }
        
        // Semester summary
        $y += 6;
        $semesterGPA = $semesterCredits > 0 ? $semesterCreditPoints / $semesterCredits : 0;
        $cumulativeCredits += $semesterCredits;
        $cumulativeCreditPoints += $semesterCreditPoints;
        $cgpa = $cumulativeCredits > 0 ? $cumulativeCreditPoints / $cumulativeCredits : 0;
        
        $pdf->SetFont('helvetica', 'B', 9);
        $pdf->SetFillColor(250, 250, 250);
        $pdf->SetXY(15, $y);
        $pdf->Cell(90, 6, 'Semester Summary', 1, 0, 'L', true);
        $pdf->Cell(90, 6, 'Total Credits: ' . $semesterCredits . ' | GPA: ' . number_format($semesterGPA, 2) . ' | CGPA: ' . number_format($cgpa, 2), 1, 1, 'R', true);
        
        $y += 12;
    }
    
    // Overall summary
    if ($y > 250) {
        $pdf->AddPage();
        $y = 20;
    }
    
    $y += 5;
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 6, 'Overall Performance Summary', 0, 1, 'L');
    
    $y += 8;
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Total Credits Earned: ' . $cumulativeCredits, 0, 1, 'L');
    
    $y += 6;
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Cumulative Grade Point Average (CGPA): ' . number_format($cgpa, 2), 0, 1, 'L');
    
    // Footer
    $y += 20;
    $pdf->SetFont('helvetica', 'I', 9);
    $pdf->SetXY(15, $y);
    $pdf->Cell(180, 5, 'Generated on: ' . date('F d, Y'), 0, 1, 'C');
    
    // Save to temp directory
    $tempDir = __DIR__ . '/../uploads/temp/';
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0777, true);
    }
    
    $filename = 'performance_report_' . $studentData['student_id'] . '_' . time() . '.pdf';
    $filepath = $tempDir . $filename;
    
    $pdf->Output($filepath, 'F');
    
    return $filepath;
}

/**
 * Embed QR code in PDF at specified position
 * 
 * @param TCPDF $pdf PDF object
 * @param string $data Data to encode in QR code
 * @param int $x X position in mm
 * @param int $y Y position in mm
 * @param int $size Size of QR code in mm
 * @return void
 */
function embedQRCode($pdf, $data, $x, $y, $size) {
    // Use TCPDF's built-in 2D barcode functionality
    $style = [
        'border' => 0,
        'vpadding' => 'auto',
        'hpadding' => 'auto',
        'fgcolor' => [0, 0, 0],
        'bgcolor' => [255, 255, 255],
        'module_width' => 1,
        'module_height' => 1
    ];
    
    $pdf->write2DBarcode($data, 'QRCODE,L', $x, $y, $size, $size, $style, 'N');
}

/**
 * Clean up temporary PDF files older than specified hours
 * 
 * @param int $olderThanHours Delete files older than this many hours (default: 24)
 * @return int Number of files deleted
 */
function cleanupTempFiles($olderThanHours = 24) {
    $tempDir = __DIR__ . '/../uploads/temp/';
    
    if (!file_exists($tempDir)) {
        return 0;
    }
    
    $deletedCount = 0;
    $cutoffTime = time() - ($olderThanHours * 3600);
    
    $files = glob($tempDir . '*.pdf');
    
    foreach ($files as $file) {
        if (is_file($file) && filemtime($file) < $cutoffTime) {
            if (unlink($file)) {
                $deletedCount++;
            }
        }
    }
    
    // Log cleanup activity
    error_log("PDF cleanup: Deleted $deletedCount files older than $olderThanHours hours");
    
    return $deletedCount;
}

/**
 * Output PDF file for download and clean up temp file
 * 
 * @param string $filePath Path to PDF file
 * @param string $filename Filename for download
 * @return void
 */
function outputPDFDownload($filePath, $filename) {
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'file_not_found',
            'message' => 'PDF file not found'
        ]);
        exit();
    }
    
    // Set headers for PDF download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // Output file
    readfile($filePath);
    
    // Delete temp file after sending
    unlink($filePath);
    
    exit();
}

?>
