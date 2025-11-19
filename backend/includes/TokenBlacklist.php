<?php
class TokenBlacklist {
    private $db;
    private $table_name = "token_blacklist";

    public function __construct($db) {
        $this->db = $db;
        $this->initializeTable();
    }

    private function initializeTable() {
        $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
            id INT AUTO_INCREMENT PRIMARY KEY,
            jti VARCHAR(255) NOT NULL UNIQUE,
            expires_at INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_jti (jti),
            INDEX idx_expires (expires_at)
        )";
        $this->db->exec($query);
    }

    public function add($jti, $expiresAt) {
        try {
            $query = "INSERT INTO " . $this->table_name . " (jti, expires_at) VALUES (:jti, :expires_at)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':jti', $jti);
            $stmt->bindParam(':expires_at', $expiresAt);
            return $stmt->execute();
        } catch (PDOException $e) {
            // Ignore duplicate entry errors
            return false;
        }
    }

    public function isBlacklisted($jti) {
        // Clean up expired tokens first (lazy cleanup)
        if (rand(1, 100) <= 5) { // 5% chance to run cleanup
            $this->cleanup();
        }

        $query = "SELECT id FROM " . $this->table_name . " WHERE jti = :jti LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':jti', $jti);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    private function cleanup() {
        $query = "DELETE FROM " . $this->table_name . " WHERE expires_at < :now";
        $stmt = $this->db->prepare($query);
        $now = time();
        $stmt->bindParam(':now', $now);
        $stmt->execute();
    }
}
?>
