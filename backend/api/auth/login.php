<?php
/**
 * Login Endpoint
 * 
 * Handles user authentication and JWT token generation
 */

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Rate limiting for login (stricter than global)
require_once __DIR__ . '/../../includes/RateLimiter.php';
$database = new Database();
$db = $database->getConnection();

if ($db) {
    $rateLimiter = new RateLimiter($db);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // 5 attempts per minute for login
    if (!$rateLimiter->check($ip, 'login_attempt', 5, 60)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too Many Requests', 'message' => 'Too many login attempts. Please try again later.']);
        exit();
    }
}

// Validate input

// Validate input
if (empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Username and password are required'
    ]);
    exit();
}

// Get database connection
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Database connection failed'
    ]);
    exit();
}

// Query user
$query = "SELECT id, username, password, email, role, status FROM users WHERE username = :username LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':username', $data->username);
$stmt->execute();

$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'invalid_credentials',
        'message' => 'Invalid username or password'
    ]);
    exit();
}

// Verify password
if (!password_verify($data->password, $user['password'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'invalid_credentials',
        'message' => 'Invalid username or password'
    ]);
    exit();
}

// Validate role selection matches user's actual role
// Accept both 'teacher' and 'staff' as equivalent for backwards compatibility
$requestedRole = $data->role ?? null;
$actualRole = $user['role'];

// Normalize roles: treat 'staff' and 'teacher' as the same
$normalizedRequestedRole = ($requestedRole === 'staff') ? 'teacher' : $requestedRole;
$normalizedActualRole = ($actualRole === 'staff') ? 'teacher' : $actualRole;

if (!empty($requestedRole) && $normalizedRequestedRole !== $normalizedActualRole) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'role_mismatch',
        'message' => 'You are trying to login as ' . $requestedRole . ' but your account is registered as ' . $actualRole . '. Please select the correct role.'
    ]);
    exit();
}

// Check if user is active
if ($user['status'] !== 'active') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'account_inactive',
        'message' => 'Your account is inactive. Please contact administrator.'
    ]);
    exit();
}

// Generate JWT token
$token_payload = [
    'user_id' => $user['id'],
    'username' => $user['username'],
    'role' => $user['role']
];

$token = generateJWT($token_payload);

// Update last login
$update_query = "UPDATE users SET last_login = NOW() WHERE id = :id";
$update_stmt = $db->prepare($update_query);
$update_stmt->bindParam(':id', $user['id']);
$update_stmt->execute();

// Remove password from response
unset($user['password']);

// Fetch additional profile data based on role
$profileData = [];
if ($user['role'] === 'student') {
    $stmt = $db->prepare("SELECT student_id, first_name, last_name, department, semester, profile_image FROM students WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $profileData = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
} elseif ($user['role'] === 'teacher') {
    $stmt = $db->prepare("SELECT teacher_id, first_name, last_name, department, profile_image FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $profileData = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
} elseif ($user['role'] === 'admin') {
    $stmt = $db->prepare("SELECT admin_id, first_name, last_name FROM admins WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $profileData = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
}

// Merge profile data into user object
if (!empty($profileData)) {
    $user = array_merge($user, $profileData);
    // Ensure full_name is available
    if (isset($user['first_name']) && isset($user['last_name'])) {
        $user['full_name'] = $user['first_name'] . ' ' . $user['last_name'];
    }
}

// Send response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'data' => [
        'user' => $user,
        'token' => $token
    ]
]);
?>
