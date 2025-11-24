<?php
/**
 * View Material API
 * Method: GET
 * Auth: Required (student, teacher, admin)
 */

// Handle CORS manually without setting JSON content-type
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/jwt.php';

// Get JWT token from Authorization header
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

$token = getBearerToken();
if (!$token) {
    http_response_code(401);
    echo 'Unauthorized - No token';
    exit;
}

$user = verifyJWT($token);
if (!$user) {
    http_response_code(401);
    echo 'Unauthorized - Invalid token';
    exit;
}

$materialId = $_GET['id'] ?? null;
if (!$materialId) {
    http_response_code(400);
    echo 'Material ID is required';
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get material details
    $query = "SELECT m.* FROM study_materials m WHERE m.id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $materialId);
    $stmt->execute();
    
    $material = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$material) {
        http_response_code(404);
        echo 'Material not found';
        exit;
    }

    // Security check
    if ($user['role'] === 'student') {
        $stmt = $db->prepare("SELECT department FROM students WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile || $profile['department'] !== $material['department']) {
            http_response_code(403);
            echo 'Access denied';
            exit;
        }
    } elseif ($user['role'] === 'teacher') {
        $stmt = $db->prepare("SELECT department FROM teachers WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile || $profile['department'] !== $material['department']) {
            http_response_code(403);
            echo 'Access denied';
            exit;
        }
    }

    // Check if file exists
    $filePath = $material['file_path'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo 'File not found on server';
        exit;
    }

    // Set headers for inline viewing
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . basename($material['file_name']) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, max-age=3600');

    // Output file
    readfile($filePath);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo 'Server error';
    exit;
}
?>
