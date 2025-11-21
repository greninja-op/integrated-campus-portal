<?php
/**
 * List Teachers API
 * Returns paginated list of teachers with filters
 * Method: GET
 * Auth: Required (admin role)
 * Query Params: page, limit, search, department, status
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
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 20;
    
    // Calculate offset
    $offset = getPaginationOffset($page, $limit);
    
    // Build base query
    $baseQuery = "FROM teachers t
                  JOIN users u ON t.user_id = u.id
                  WHERE 1=1";
    
    $params = [];
    
    // Add filters
    if ($department !== null) {
        $baseQuery .= " AND t.department = :department";
        $params[':department'] = $department;
    }
    
    if ($status !== null) {
        $baseQuery .= " AND u.status = :status";
        $params[':status'] = $status;
    }
    
    if ($search !== null && $search !== '') {
        $search = htmlspecialchars(strip_tags($search));
        $baseQuery .= " AND (t.teacher_id LIKE :search 
                        OR t.first_name LIKE :search 
                        OR t.last_name LIKE :search 
                        OR CONCAT(t.first_name, ' ', t.last_name) LIKE :search
                        OR u.email LIKE :search
                        OR u.username LIKE :search
                        OR t.designation LIKE :search)";
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
    
    // Get teachers with pagination
    $query = "SELECT 
                t.id,
                t.teacher_id,
                t.first_name,
                t.last_name,
                t.date_of_birth,
                t.gender,
                t.phone,
                t.address,
                t.joining_date,
                t.department,
                t.designation,
                t.qualification,
                t.specialization,
                t.experience_years,
                t.profile_image,
                t.created_at,
                t.updated_at,
                u.username,
                u.email,
                u.status,
                u.last_login
              " . $baseQuery . "
              ORDER BY t.teacher_id DESC
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get assigned subjects for each teacher
    foreach ($teachers as &$teacher) {
        if ($teacher['experience_years']) {
            $teacher['experience_years'] = (int) $teacher['experience_years'];
        }
        
        // Fetch assigned subjects
        $subjectsQuery = "SELECT s.id, s.subject_code, s.subject_name, s.semester, s.department
                          FROM teacher_subjects ts
                          JOIN subjects s ON ts.subject_id = s.id
                          WHERE ts.teacher_id = :teacher_id AND ts.is_active = 1";
        $subjectsStmt = $db->prepare($subjectsQuery);
        $subjectsStmt->bindParam(':teacher_id', $teacher['id'], PDO::PARAM_INT);
        $subjectsStmt->execute();
        $teacher['assigned_subjects'] = $subjectsStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Calculate pagination
    $totalPages = getTotalPages($totalCount, $limit);
    
    // Prepare response
    $response = [
        'teachers' => $teachers,
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
            'status' => $status,
            'search' => $search
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in list teachers: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching teachers', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in list teachers: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
