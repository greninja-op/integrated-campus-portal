<?php
/**
 * Validation Helper Functions
 * Provides input validation and sanitization functions
 */

/**
 * Validate required fields in data
 * @param array $fields Array of required field names
 * @param array|object $data Data to validate
 * @return array Array of missing fields (empty if all present)
 */
function validateRequired($fields, $data) {
    $missing = [];
    
    // Convert object to array if needed
    if (is_object($data)) {
        $data = (array) $data;
    }
    
    foreach ($fields as $field) {
        if (!isset($data[$field])) {
            $missing[] = $field;
        } elseif (is_string($data[$field]) && trim($data[$field]) === '') {
            $missing[] = $field;
        } elseif (is_array($data[$field]) && empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    return $missing;
}

/**
 * Validate email format
 * @param string $email Email address to validate
 * @return bool True if valid, false otherwise
 */
function validateEmail($email) {
    if (empty($email)) {
        return false;
    }
    
    // Remove whitespace
    $email = trim($email);
    
    // Validate format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    
    // Additional checks
    $parts = explode('@', $email);
    if (count($parts) !== 2) {
        return false;
    }
    
    // Check domain has at least one dot
    if (strpos($parts[1], '.') === false) {
        return false;
    }
    
    return true;
}

/**
 * Validate phone number format
 * @param string $phone Phone number to validate
 * @return bool True if valid, false otherwise
 */
function validatePhone($phone) {
    if (empty($phone)) {
        return false;
    }
    
    // Remove all non-digit characters
    $cleaned = preg_replace('/[^0-9]/', '', $phone);
    
    // Check length (10-15 digits)
    $length = strlen($cleaned);
    if ($length < 10 || $length > 15) {
        return false;
    }
    
    return true;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param string $date Date string to validate
 * @return bool True if valid, false otherwise
 */
function validateDate($date) {
    if (empty($date)) {
        return false;
    }
    
    // Check format with regex
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return false;
    }
    
    // Parse date parts
    $parts = explode('-', $date);
    $year = (int) $parts[0];
    $month = (int) $parts[1];
    $day = (int) $parts[2];
    
    // Validate using checkdate
    if (!checkdate($month, $day, $year)) {
        return false;
    }
    
    // Additional validation: year should be reasonable (1900-2100)
    if ($year < 1900 || $year > 2100) {
        return false;
    }
    
    return true;
}

/**
 * Validate semester number (1-6 for 3-year program)
 * @param int $semester Semester number to validate
 * @return bool True if valid, false otherwise
 */
function validateSemester($semester) {
    // Convert to integer if string
    $semester = (int) $semester;
    
    // Check range (1-6)
    return $semester >= 1 && $semester <= 6;
}

/**
 * Validate marks are within valid range
 * @param float $marks Marks value to validate
 * @param float $max Maximum allowed marks (default 100)
 * @return bool True if valid, false otherwise
 */
function validateMarks($marks, $max = 100) {
    // Convert to float
    $marks = (float) $marks;
    
    // Check range (0 to max)
    if ($marks < 0 || $marks > $max) {
        return false;
    }
    
    // Check decimal places (max 2)
    $decimalPlaces = strlen(substr(strrchr((string) $marks, "."), 1));
    if ($decimalPlaces > 2) {
        return false;
    }
    
    return true;
}

/**
 * Sanitize input to prevent XSS attacks
 * @param string $input Input string to sanitize
 * @return string Sanitized string
 */
function sanitizeInput($input) {
    if (empty($input)) {
        return '';
    }
    
    // Trim whitespace
    $input = trim($input);
    
    // Convert special characters to HTML entities
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    
    // Remove any null bytes
    $input = str_replace(chr(0), '', $input);
    
    return $input;
}

/**
 * Validate username format
 * @param string $username Username to validate
 * @return bool True if valid, false otherwise
 */
function validateUsername($username) {
    if (empty($username)) {
        return false;
    }
    
    // Trim leading/trailing whitespace only
    $username = trim($username);
    
    // Check length (3-50 characters)
    $length = strlen($username);
    if ($length < 3 || $length > 50) {
        return false;
    }
    
    // Allow alphanumeric, underscore, hyphen, dots, and spaces
    if (!preg_match('/^[a-zA-Z0-9_\-\. ]+$/', $username)) {
        return false;
    }
    
    return true;
}

/**
 * Validate password strength
 * @param string $password Password to validate
 * @return array Returns ['valid' => bool, 'message' => string]
 */
function validatePassword($password) {
    $result = ['valid' => true, 'message' => ''];
    
    if (empty($password)) {
        return ['valid' => false, 'message' => 'Password is required'];
    }
    
    // Minimum length
    if (strlen($password) < 8) {
        return ['valid' => false, 'message' => 'Password must be at least 8 characters'];
    }
    
    // Maximum length
    if (strlen($password) > 255) {
        return ['valid' => false, 'message' => 'Password is too long'];
    }
    
    return $result;
}

/**
 * Validate numeric value
 * @param mixed $value Value to validate
 * @param float $min Minimum value (optional)
 * @param float $max Maximum value (optional)
 * @return bool True if valid, false otherwise
 */
function validateNumeric($value, $min = null, $max = null) {
    if (!is_numeric($value)) {
        return false;
    }
    
    $value = (float) $value;
    
    if ($min !== null && $value < $min) {
        return false;
    }
    
    if ($max !== null && $value > $max) {
        return false;
    }
    
    return true;
}

/**
 * Validate enum value
 * @param mixed $value Value to check
 * @param array $allowedValues Array of allowed values
 * @return bool True if value is in allowed list, false otherwise
 */
function validateEnum($value, $allowedValues) {
    return in_array($value, $allowedValues, true);
}

/**
 * Validate file upload
 * @param array $file $_FILES array element
 * @param array $allowedTypes Allowed MIME types
 * @param int $maxSize Maximum file size in bytes
 * @return array Returns ['valid' => bool, 'message' => string]
 */
function validateFileUpload($file, $allowedTypes, $maxSize) {
    // Check if file was uploaded
    if (!isset($file['error']) || is_array($file['error'])) {
        return ['valid' => false, 'message' => 'Invalid file upload'];
    }
    
    // Check for upload errors
    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return ['valid' => false, 'message' => 'File size exceeds limit'];
        case UPLOAD_ERR_NO_FILE:
            return ['valid' => false, 'message' => 'No file uploaded'];
        default:
            return ['valid' => false, 'message' => 'Upload error occurred'];
    }
    
    // Check file size
    if ($file['size'] > $maxSize) {
        return ['valid' => false, 'message' => 'File size exceeds maximum allowed'];
    }
    
    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        return ['valid' => false, 'message' => 'Invalid file type'];
    }
    
    return ['valid' => true, 'message' => ''];
}

/**
 * Validate batch year
 * @param int $year Year to validate
 * @return bool True if valid, false otherwise
 */
function validateBatchYear($year) {
    $year = (int) $year;
    $currentYear = (int) date('Y');
    
    // Should be within reasonable range (current year -10 to +2)
    return $year >= ($currentYear - 10) && $year <= ($currentYear + 2);
}

/**
 * Validate gender
 * @param string $gender Gender value to validate
 * @return bool True if valid, false otherwise
 */
function validateGender($gender) {
    $allowedGenders = ['male', 'female', 'other'];
    return validateEnum(strtolower($gender), $allowedGenders);
}

/**
 * Validate student/teacher/admin ID format
 * @param string $id ID to validate
 * @param string $prefix Expected prefix (STU, TCH, ADM)
 * @return bool True if valid, false otherwise
 */
function validateIdFormat($id, $prefix) {
    // Format: PREFIX + YEAR(4 digits) + NUMBER(3 digits)
    // Example: STU2024001, TCH2024001, ADM2024001
    $pattern = '/^' . $prefix . '\d{4}\d{3}$/';
    return preg_match($pattern, $id) === 1;
}
