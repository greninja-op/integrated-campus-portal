<?php
/**
 * Cleanup Temporary PDF Files
 * 
 * Deletes PDF files older than 24 hours from the temp directory.
 * Should be run via cron job or scheduled task.
 * 
 * Usage:
 *   php backend/includes/cleanup_temp_files.php
 * 
 * Cron job example (daily at 2 AM):
 *   0 2 * * * /usr/bin/php /path/to/backend/includes/cleanup_temp_files.php
 * 
 * Requirements: 14.4
 */

// Configuration
$tempDir = __DIR__ . '/../uploads/temp';
$maxAge = 24 * 60 * 60; // 24 hours in seconds
$logFile = __DIR__ . '/../logs/cleanup.log';

// Ensure log directory exists
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Check if temp directory exists
if (!is_dir($tempDir)) {
    $message = "Temp directory does not exist: $tempDir";
    echo $message . "\n";
    logCleanup($logFile, 0, 0, $message);
    exit(1);
}

// Get all PDF files in temp directory
$files = glob($tempDir . '/*.pdf');
$deletedCount = 0;
$errorCount = 0;
$totalSize = 0;

echo "Starting cleanup of temporary PDF files...\n";
echo "Directory: $tempDir\n";
echo "Max age: " . ($maxAge / 3600) . " hours\n";
echo "Files found: " . count($files) . "\n\n";

foreach ($files as $file) {
    if (is_file($file)) {
        $fileAge = time() - filemtime($file);
        $fileSize = filesize($file);
        $fileName = basename($file);
        
        if ($fileAge > $maxAge) {
            if (unlink($file)) {
                $deletedCount++;
                $totalSize += $fileSize;
                echo "✓ Deleted: $fileName (age: " . round($fileAge / 3600, 1) . "h, size: " . formatBytes($fileSize) . ")\n";
            } else {
                $errorCount++;
                echo "✗ Failed to delete: $fileName\n";
            }
        } else {
            echo "⊘ Skipped: $fileName (age: " . round($fileAge / 3600, 1) . "h - too recent)\n";
        }
    }
}

echo "\n" . str_repeat("-", 60) . "\n";
echo "Cleanup Summary:\n";
echo "- Files deleted: $deletedCount\n";
echo "- Space freed: " . formatBytes($totalSize) . "\n";
echo "- Errors: $errorCount\n";
echo "- Timestamp: " . date('Y-m-d H:i:s') . "\n";
echo str_repeat("-", 60) . "\n";

// Log cleanup activity
logCleanup($logFile, $deletedCount, $errorCount, formatBytes($totalSize));

exit($errorCount > 0 ? 1 : 0);

/**
 * Log cleanup activity to file
 */
function logCleanup($logFile, $deletedCount, $errorCount, $details) {
    $logEntry = sprintf(
        "[%s] Cleanup: %d files deleted, %d errors, %s\n",
        date('Y-m-d H:i:s'),
        $deletedCount,
        $errorCount,
        $details
    );
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Format bytes to human-readable format
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}
