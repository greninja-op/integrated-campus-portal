<?php
/**
 * List Fees API
 * Returns list of fee structures with filters
 * Method: GET
 * Auth: Required (admin role)
 * Query Params: semester, department, session_id, is_active
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get query parameters
    $semester = isset($_GET['semester']) ? (int) $_GET['semester'] : null;
    $department = isset($_GET['department']) ? trim(htmlspecialchars(strip_tags($_GET['department']))) : null;
    $sessionId = isset($_GET['session_id']) ? (int) $_GET['session_id'] : null;
    $isActive = isset($_GET['is_active']) ? ($_GET['is_active'] === 'true' || $_GET['is_active'] === '1') : null;
    
    // If no session specified, get active session
    if ($sessionId === null) {
        $session = getActiveSession($db);
        if ($session) {
            $sessionId = $session['id'];
        }
    }
    
    // Build query
    $query = "SELECT * FROM fees WHERE 1=1";
    $params = [];
    
    if ($sessionId !== null) {
        $query .= " AND session_id = :session_id";
        $params[':session_id'] = $sessionId;
    }
    
    if ($semester !== null) {
        $query .= " AND (semester IS NULL OR semester = :semester)";
        $params[':semester'] = $semester;
    }
    
    if ($department !== null) {
        $query .= " AND (department IS NULL OR department = :department)";
        $params[':department'] = $department;
    }
    
    if ($isActive !== null) {
        $query .= " AND is_active = :is_active";
        $params[':is_active'] = $isActive ? 1 : 0;
    }
    
    $query .= " ORDER BY due_date, semester, fee_type";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $fees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert types
    foreach ($fees as &$fee) {
        $fee['amount'] = (float) $fee['amount'];
        $fee['late_fine_per_day'] = (float) $fee['late_fine_per_day'];
        $fee['max_late_fine'] = (float) $fee['max_late_fine'];
        $fee['semester'] = $fee['semester'] ? (int) $fee['semester'] : null;
        $fee['is_active'] = (bool) $fee['is_active'];
    }
    
    // Prepare response
    $response = [
        'fees' => $fees,
        'total' => count($fees),
        'filters' => [
            'session_id' => $sessionId,
            'semester' => $semester,
            'department' => $department,
            'is_active' => $isActive
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in list fees: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching fees', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in list fees: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
