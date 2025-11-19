<?php
/**
 * Get Profile API
 * Returns student profile information
 * Method: GET
 * Auth: Required (student role)
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role (allow students and admins)
if ($user['role'] !== 'student' && $user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to students', 'forbidden', 403);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Query student profile with user details
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
                u.username,
                u.email,
                u.status,
                u.last_login,
                sess.session_name,
                sess.start_year,
                sess.end_year
              FROM students s
              JOIN users u ON s.user_id = u.id
              LEFT JOIN sessions sess ON s.session_id = sess.id
              WHERE s.user_id = :user_id
              LIMIT 1";
    
    // IDOR Protection:
    // If admin, allow fetching any profile by student_id
    if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
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
                    u.username,
                    u.email,
                    u.status,
                    u.last_login,
                    sess.session_name,
                    sess.start_year,
                    sess.end_year
                  FROM students s
                  JOIN users u ON s.user_id = u.id
                  LEFT JOIN sessions sess ON s.session_id = sess.id
                  WHERE s.id = :student_id
                  LIMIT 1";
    }

    $stmt = $db->prepare($query);
    
    if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
        $stmt->bindParam(':student_id', $_GET['student_id'], PDO::PARAM_INT);
    } else {
        $stmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    }
    $stmt->execute();
    
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        sendError('Student profile not found', 'not_found', 404);
    }
    
    // Convert to proper types
    $profile['semester'] = (int) $profile['semester'];
    $profile['batch_year'] = (int) $profile['batch_year'];
    $profile['start_year'] = $profile['start_year'] ? (int) $profile['start_year'] : null;
    $profile['end_year'] = $profile['end_year'] ? (int) $profile['end_year'] : null;
    
    // Format dates
    $profile['date_of_birth'] = $profile['date_of_birth'];
    $profile['enrollment_date'] = $profile['enrollment_date'];
    
    // Remove sensitive information
    // (password is not selected, but ensure no other sensitive data)
    
    sendSuccess($profile);
    
} catch (PDOException $e) {
    logError('Database error in get_profile.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching profile', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_profile.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
