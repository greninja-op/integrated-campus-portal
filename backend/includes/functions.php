<?php
/**
 * General Helper Functions
 * Provides utility functions used across the application
 */

/**
 * Generate unique ID with prefix
 * @param string $prefix Prefix for ID (STU, TCH, ADM)
 * @param PDO $db Database connection
 * @param string $table Table name to check for uniqueness
 * @param string $column Column name for ID
 * @return string Unique ID (e.g., STU2024001)
 */
function generateUniqueId($prefix, $db, $table, $column) {
    $year = date('Y');
    $maxAttempts = 100;
    
    for ($i = 0; $i < $maxAttempts; $i++) {
        // Get the count of existing IDs for this year
        try {
            $query = "SELECT COUNT(*) as count FROM {$table} 
                      WHERE {$column} LIKE :pattern";
            $stmt = $db->prepare($query);
            $pattern = $prefix . $year . '%';
            $stmt->bindParam(':pattern', $pattern, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $count = (int) $result['count'];
            $nextNumber = $count + 1;
            
            // Format: PREFIX + YEAR(4) + NUMBER(3 padded)
            $id = $prefix . $year . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            
            // Check if this ID already exists
            $checkQuery = "SELECT COUNT(*) as exists_count FROM {$table} 
                           WHERE {$column} = :id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $id, PDO::PARAM_STR);
            $checkStmt->execute();
            $existsResult = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existsResult['exists_count'] == 0) {
                return $id;
            }
        } catch (PDOException $e) {
            error_log("Error generating unique ID: " . $e->getMessage());
        }
    }
    
    // Fallback: use timestamp
    return $prefix . $year . substr(time(), -3);
}

/**
 * Generate unique receipt number
 * @return string Receipt number (e.g., RCP20241114001)
 */
function generateReceiptNumber() {
    $date = date('Ymd');
    $random = str_pad(random_int(1, 999), 3, '0', STR_PAD_LEFT);
    $timestamp = substr(microtime(true) * 1000, -3);
    
    return 'RCP' . $date . $random;
}

/**
 * Get active academic session
 * @param PDO $db Database connection
 * @return array|false Active session data or false if not found
 */
function getActiveSession($db) {
    try {
        $query = "SELECT * FROM sessions WHERE is_active = 1 LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error getting active session: " . $e->getMessage());
        return false;
    }
}

/**
 * Get student ID from user ID
 * @param int $userId User ID
 * @param PDO $db Database connection
 * @return int|false Student ID or false if not found
 */
function getStudentIdFromUserId($userId, $db) {
    try {
        $query = "SELECT id FROM students WHERE user_id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int) $result['id'] : false;
    } catch (PDOException $e) {
        error_log("Error getting student ID: " . $e->getMessage());
        return false;
    }
}

/**
 * Get teacher ID from user ID
 * @param int $userId User ID
 * @param PDO $db Database connection
 * @return int|false Teacher ID or false if not found
 */
function getTeacherIdFromUserId($userId, $db) {
    try {
        $query = "SELECT id FROM teachers WHERE user_id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int) $result['id'] : false;
    } catch (PDOException $e) {
        error_log("Error getting teacher ID: " . $e->getMessage());
        return false;
    }
}

/**
 * Get admin ID from user ID
 * @param int $userId User ID
 * @param PDO $db Database connection
 * @return int|false Admin ID or false if not found
 */
function getAdminIdFromUserId($userId, $db) {
    try {
        $query = "SELECT id FROM admins WHERE user_id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int) $result['id'] : false;
    } catch (PDOException $e) {
        error_log("Error getting admin ID: " . $e->getMessage());
        return false;
    }
}

/**
 * Log error message to file
 * @param string $message Error message
 * @param array $context Additional context data
 * @return void
 */
function logError($message, $context = []) {
    static $logger = null;
    if ($logger === null) {
        require_once __DIR__ . '/Logger.php';
        $logger = new Logger();
    }
    $logger->error($message, $context);
}

/**
 * Send JSON response with status code
 * @param int $statusCode HTTP status code
 * @param array $data Response data
 * @return void
 */
function sendJsonResponse($statusCode, $data) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data);
    exit();
}

/**
 * Send success response
 * @param array $data Response data
 * @param int $statusCode HTTP status code (default 200)
 * @return void
 */
function sendSuccess($data, $statusCode = 200) {
    sendJsonResponse($statusCode, [
        'success' => true,
        'data' => $data
    ]);
}

/**
 * Send error response
 * @param string $message Error message
 * @param string $errorCode Error code
 * @param int $statusCode HTTP status code (default 400)
 * @param array $details Additional error details
 * @return void
 */
function sendError($message, $errorCode = 'error', $statusCode = 400, $details = []) {
    $response = [
        'success' => false,
        'error' => $errorCode,
        'message' => $message
    ];
    
    if (!empty($details)) {
        $response['details'] = $details;
    }
    
    // In production, hide detailed error messages for server errors (500)
    if ($statusCode >= 500 && getenv('APP_ENV') === 'production') {
        $response['message'] = 'An unexpected error occurred. Please try again later.';
        unset($response['details']); // Hide details in production
    }
    
    sendJsonResponse($statusCode, $response);
}

/**
 * Get current student semester from database
 * @param int $studentId Student ID
 * @param PDO $db Database connection
 * @return int|false Current semester or false if not found
 */
function getCurrentSemester($studentId, $db) {
    try {
        $query = "SELECT semester FROM students WHERE id = :student_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int) $result['semester'] : false;
    } catch (PDOException $e) {
        error_log("Error getting current semester: " . $e->getMessage());
        return false;
    }
}

/**
 * Format date for display
 * @param string $date Date string (YYYY-MM-DD)
 * @param string $format Output format (default: 'd M Y')
 * @return string Formatted date
 */
function formatDate($date, $format = 'd M Y') {
    if (empty($date)) {
        return '';
    }
    
    try {
        $dateTime = new DateTime($date);
        return $dateTime->format($format);
    } catch (Exception $e) {
        return $date;
    }
}

/**
 * Format currency amount
 * @param float $amount Amount to format
 * @param string $currency Currency symbol (default: ₹)
 * @return string Formatted currency string
 */
function formatCurrency($amount, $currency = '₹') {
    $amount = (float) $amount;
    return $currency . number_format($amount, 2);
}

/**
 * Calculate late fine based on due date
 * @param string $dueDate Due date (YYYY-MM-DD)
 * @param float $finePerDay Fine amount per day
 * @param float $maxFine Maximum fine amount
 * @return float Calculated fine amount
 */
function calculateLateFine($dueDate, $finePerDay, $maxFine) {
    $currentDate = new DateTime();
    $due = new DateTime($dueDate);
    
    // If current date is before or on due date, no fine
    if ($currentDate <= $due) {
        return 0.00;
    }
    
    // Calculate days late
    $interval = $currentDate->diff($due);
    $daysLate = (int) $interval->days;
    
    // Calculate fine
    $fine = $daysLate * (float) $finePerDay;
    
    // Cap at maximum fine
    if ($fine > (float) $maxFine) {
        $fine = (float) $maxFine;
    }
    
    return round($fine, 2);
}

/**
 * Check if username exists
 * @param string $username Username to check
 * @param PDO $db Database connection
 * @param int $excludeUserId User ID to exclude from check (for updates)
 * @return bool True if exists, false otherwise
 */
function usernameExists($username, $db, $excludeUserId = null) {
    try {
        $query = "SELECT COUNT(*) as count FROM users WHERE username = :username";
        if ($excludeUserId !== null) {
            $query .= " AND id != :user_id";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        
        if ($excludeUserId !== null) {
            $stmt->bindParam(':user_id', $excludeUserId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int) $result['count'] > 0;
    } catch (PDOException $e) {
        error_log("Error checking username: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if email exists
 * @param string $email Email to check
 * @param PDO $db Database connection
 * @param int $excludeUserId User ID to exclude from check (for updates)
 * @return bool True if exists, false otherwise
 */
function emailExists($email, $db, $excludeUserId = null) {
    try {
        $query = "SELECT COUNT(*) as count FROM users WHERE email = :email";
        if ($excludeUserId !== null) {
            $query .= " AND id != :user_id";
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        
        if ($excludeUserId !== null) {
            $stmt->bindParam(':user_id', $excludeUserId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int) $result['count'] > 0;
    } catch (PDOException $e) {
        error_log("Error checking email: " . $e->getMessage());
        return false;
    }
}

/**
 * Get pagination offset
 * @param int $page Current page number (1-based)
 * @param int $limit Items per page
 * @return int Offset for SQL query
 */
function getPaginationOffset($page, $limit) {
    $page = max(1, (int) $page);
    $limit = max(1, (int) $limit);
    
    return ($page - 1) * $limit;
}

/**
 * Calculate total pages for pagination
 * @param int $totalItems Total number of items
 * @param int $limit Items per page
 * @return int Total number of pages
 */
function getTotalPages($totalItems, $limit) {
    $totalItems = max(0, (int) $totalItems);
    $limit = max(1, (int) $limit);
    
    return (int) ceil($totalItems / $limit);
}

/**
 * Generate random string
 * @param int $length Length of random string
 * @return string Random string
 */
function generateRandomString($length = 16) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    
    return $randomString;
}

/**
 * Get user role from user ID
 * @param int $userId User ID
 * @param PDO $db Database connection
 * @return string|false User role or false if not found
 */
function getUserRole($userId, $db) {
    try {
        $query = "SELECT role FROM users WHERE id = :user_id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['role'] : false;
    } catch (PDOException $e) {
        error_log("Error getting user role: " . $e->getMessage());
        return false;
    }
}

/**
 * Update user last login timestamp
 * @param int $userId User ID
 * @param PDO $db Database connection
 * @return bool True on success, false on failure
 */
function updateLastLogin($userId, $db) {
    try {
        $query = "UPDATE users SET last_login = NOW() WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Error updating last login: " . $e->getMessage());
        return false;
    }
}
