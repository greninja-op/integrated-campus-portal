<?php
/**
 * Update Fee API
 * Updates an existing fee structure
 * Method: PUT
 * Auth: Required (admin role)
 * Body: Fee ID and fields to update
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required ID
    if (!isset($data['fee_id']) || empty($data['fee_id'])) {
        sendError('fee_id is required', 'validation_error', 400);
    }
    
    $feeId = (int) $data['fee_id'];
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify fee exists
    $checkQuery = "SELECT * FROM fees WHERE id = :fee_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Fee not found', 'not_found', 404);
    }
    
    // Build update query dynamically
    $updates = [];
    $params = [':fee_id' => $feeId];
    
    $allowedFields = [
        'fee_type', 'fee_name', 'amount', 'semester', 'department', 'program',
        'due_date', 'late_fine_per_day', 'max_late_fine', 'description'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $value = $data[$field];
            
            // Sanitize string inputs
            if (is_string($value) && !in_array($field, ['amount', 'semester', 'late_fine_per_day', 'max_late_fine'])) {
                $value = trim(htmlspecialchars(strip_tags($value)));
            }
            
            // Validate specific fields
            if ($field === 'amount' && (float)$value <= 0) {
                sendError('Amount must be greater than 0', 'invalid_amount', 400);
            }
            if ($field === 'due_date' && !validateDate($value)) {
                sendError('Invalid due date format', 'invalid_date', 400);
            }
            if ($field === 'semester' && $value !== null && !validateSemester((int)$value)) {
                sendError('Invalid semester', 'invalid_semester', 400);
            }
            
            $updates[] = "$field = :$field";
            $params[":$field"] = $value;
        }
    }
    
    // Execute update if there are changes
    if (!empty($updates)) {
        $query = "UPDATE fees SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :fee_id";
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
    }
    
    // Get updated fee
    $getQuery = "SELECT * FROM fees WHERE id = :fee_id";
    $getStmt = $db->prepare($getQuery);
    $getStmt->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    $getStmt->execute();
    $updatedFee = $getStmt->fetch(PDO::FETCH_ASSOC);
    
    // Convert types
    $updatedFee['amount'] = (float) $updatedFee['amount'];
    $updatedFee['late_fine_per_day'] = (float) $updatedFee['late_fine_per_day'];
    $updatedFee['max_late_fine'] = (float) $updatedFee['max_late_fine'];
    $updatedFee['semester'] = $updatedFee['semester'] ? (int) $updatedFee['semester'] : null;
    $updatedFee['is_active'] = (bool) $updatedFee['is_active'];
    
    sendSuccess($updatedFee);
    
} catch (PDOException $e) {
    logError('Database error in update fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'fee_id' => $feeId ?? null
    ]);
    sendError('An error occurred while updating fee', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in update fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
