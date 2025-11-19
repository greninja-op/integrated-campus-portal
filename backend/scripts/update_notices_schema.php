<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Updating notices table schema...\n";
    
    // Check if columns exist
    $columns = [];
    $stmt = $db->query("SHOW COLUMNS FROM notices");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = $row['Field'];
    }
    
    // Add type if missing
    if (!in_array('type', $columns)) {
        $db->exec("ALTER TABLE notices ADD COLUMN type VARCHAR(50) DEFAULT 'general' AFTER content");
        echo "Added 'type' column.\n";
    }
    
    // Handle target_role -> target_audience
    if (in_array('target_role', $columns) && !in_array('target_audience', $columns)) {
        // We need to be careful with ENUM to VARCHAR conversion if strict mode is on, but usually it's fine.
        // Also need to map values if they differ ('student' vs 'students')
        
        // First change to varchar
        $db->exec("ALTER TABLE notices MODIFY COLUMN target_role VARCHAR(50) DEFAULT 'all'");
        
        // Update values
        $db->exec("UPDATE notices SET target_role = 'students' WHERE target_role = 'student'");
        $db->exec("UPDATE notices SET target_role = 'teachers' WHERE target_role = 'teacher'");
        
        // Rename
        $db->exec("ALTER TABLE notices CHANGE COLUMN target_role target_audience VARCHAR(50) DEFAULT 'all'");
        echo "Renamed 'target_role' to 'target_audience' and updated values.\n";
    } elseif (!in_array('target_audience', $columns)) {
        $db->exec("ALTER TABLE notices ADD COLUMN target_audience VARCHAR(50) DEFAULT 'all' AFTER type");
        echo "Added 'target_audience' column.\n";
    }
    
    // Add department
    if (!in_array('department', $columns)) {
        $db->exec("ALTER TABLE notices ADD COLUMN department VARCHAR(50) NULL AFTER target_audience");
        echo "Added 'department' column.\n";
    }
    
    // Add semester
    if (!in_array('semester', $columns)) {
        $db->exec("ALTER TABLE notices ADD COLUMN semester INT NULL AFTER department");
        echo "Added 'semester' column.\n";
    }
    
    // Add attachment_url
    if (!in_array('attachment_url', $columns)) {
        $db->exec("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR(255) NULL AFTER semester");
        echo "Added 'attachment_url' column.\n";
    }
    
    echo "Schema update completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
