<?php
class Logger {
    private $logDir;
    private $logFile;

    public function __construct($logDir = null) {
        $this->logDir = $logDir ?: __DIR__ . '/../logs';
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
        // Rotate logs daily
        $this->logFile = $this->logDir . '/app-' . date('Y-m-d') . '.log';
    }

    public function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $requestId = defined('REQUEST_ID') ? REQUEST_ID : 'N/A';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'CLI';
        
        $logEntry = [
            'timestamp' => $timestamp,
            'level' => strtoupper($level),
            'request_id' => $requestId,
            'ip' => $ip,
            'message' => $message,
            'context' => $context
        ];

        $formattedLog = json_encode($logEntry) . PHP_EOL;
        
        file_put_contents($this->logFile, $formattedLog, FILE_APPEND | LOCK_EX);
    }

    public function info($message, $context = []) {
        $this->log('INFO', $message, $context);
    }

    public function error($message, $context = []) {
        $this->log('ERROR', $message, $context);
    }

    public function warning($message, $context = []) {
        $this->log('WARNING', $message, $context);
    }
    
    public function debug($message, $context = []) {
        if (getenv('APP_DEBUG') === 'true') {
            $this->log('DEBUG', $message, $context);
        }
    }
}
?>
