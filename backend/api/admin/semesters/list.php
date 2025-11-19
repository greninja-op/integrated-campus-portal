<?php
/**
 * List Semesters Endpoint
 * 
 * Retrieves semesters for a specific session or all semesters
 * 
 * @method GET
 * @auth Required (admin role)
 * @query session_id (optional) - Filter by session ID
 * @return JSON response with semesters list
 */

require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../config/database.php';

// Verify admin authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Authentication required'
    ]);
    exit();
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'forbidden',
        'message' => 'Admin access required'
    ]);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'method_not_allowed',
        'message' => 'Only GET requests are allowed'
    ]);
    exit();
}

try {
    $db = getDBConnection();
    
    // Get optional session_id filter
    $session_id = isset($_GET['session_id']) ? intval($_GET['session_id']) : null;
    
    // Build query
    if ($session_id) {
        $query = "SELECT 
                    id,
                    session_id,
                    semester_number,
                    start_date,
                    end_date,
                    created_at
                  FROM semesters
                  WHERE session_id = :session_id
                  ORDER BY semester_number ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':session_id', $session_id, PDO::PARAM_INT);
    } else {
        $query = "SELECT 
                    id,
                    session_id,
                    semester_number,
                    start_date,
                    end_date,
                    created_at
                  FROM semesters
                  ORDER BY session_id DESC, semester_number ASC";
        
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    $semesters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group semesters by session_id if no filter
    if (!$session_id) {
        $grouped = [];
        foreach ($semesters as $semester) {
            $sid = $semester['session_id'];
            if (!isset($grouped[$sid])) {
                $grouped[$sid] = [];
            }
            $grouped[$sid][] = $semester;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'semesters_by_session' => $grouped,
                'total' => count($semesters)
            ]
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'semesters' => $semesters,
                'total' => count($semesters)
            ]
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Database error in list semesters: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'Failed to retrieve semesters'
    ]);
}
