<?php
/**
 * List Students API
 * Returns paginated list of students with filters
 * Method: GET
 * Auth: Required (admin role)
 * Query Params: page, limit, search, department, semester, status
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
    $department = isset($_GET['department']) ? trim($_GET['department']) : null;
    $semester = isset($_GET['semester']) ? (int) $_GET['semester'] : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 20;
    
    // Calculate offset
    $offset = getPaginationOffset($page, $limit);
    
    // Build base query
    $baseQuery = "FROM students s
                  JOIN users u ON s.user_id = u.id
                  WHERE 1=1";
    
    $params = [];
    
    // Add filters
    if ($department !== null) {
        $baseQuery .= " AND s.department = :department";
        $params[':department'] = $department;
    }
    
    if ($semester !== null) {
        $baseQuery .= " AND s.semester = :semester";
        $params[':semester'] = $semester;
    }
    
    if ($status !== null) {
        $baseQuery .= " AND u.status = :status";
        $params[':status'] = $status;
    }
    
    if ($search !== null && $search !== '') {
        $search = htmlspecialchars(strip_tags($search));
        $baseQuery .= " AND (s.student_id LIKE :search 
                        OR s.first_name LIKE :search 
                        OR s.last_name LIKE :search 
                        OR CONCAT(s.first_name, ' ', s.last_name) LIKE :search
                        OR u.email LIKE :search
                        OR u.username LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total " . $baseQuery;
    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get students with pagination
    $query = "SELECT 
                s.id,
                s.student_id,
                s.first_name,
                s.last_name,
                s.date_of_birth,
                s.gender,
                s.phone,
                s.address,
                s.enrollment_date,
                s.semester,
                s.department,
                s.program,
                s.batch_year,
                s.guardian_name,
                s.guardian_phone,
                s.guardian_email,
                s.profile_image,
                s.created_at,
                s.updated_at,
                u.username,
                u.email,
                u.status,
                u.last_login
              " . $baseQuery . "
              ORDER BY s.student_id DESC
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert to proper types
    foreach ($students as &$student) {
        $student['semester'] = (int) $student['semester'];
        $student['batch_year'] = (int) $student['batch_year'];
    }
    
    // Calculate pagination
    $totalPages = getTotalPages($totalCount, $limit);
    
    // Prepare response
    $response = [
        'students' => $students,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalCount,
            'total_pages' => $totalPages,
            'has_next' => $page < $totalPages,
            'has_previous' => $page > 1
        ],
        'filters' => [
            'department' => $department,
            'semester' => $semester,
            'status' => $status,
            'search' => $search
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in list students: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching students', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in list students: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
