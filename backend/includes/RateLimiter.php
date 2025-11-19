<?php
class RateLimiter {
    private $db;
    private $table_name = "rate_limits";

    public function __construct($db) {
        $this->db = $db;
        $this->initializeTable();
    }

    private function initializeTable() {
        $query = "CREATE TABLE IF NOT EXISTS " . $this->table_name . " (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            requests INT DEFAULT 1,
            start_time INT NOT NULL,
            INDEX idx_ip_endpoint (ip_address, endpoint)
        )";
        $this->db->exec($query);
    }

    public function check($ip, $endpoint, $limit, $window) {
        $current_time = time();
        
        // Delete old records
        $delete_query = "DELETE FROM " . $this->table_name . " WHERE start_time < :time";
        $stmt = $this->db->prepare($delete_query);
        $stmt->execute([':time' => $current_time - $window]);

        // Check current usage
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE ip_address = :ip AND endpoint = :endpoint";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':ip' => $ip, ':endpoint' => $endpoint]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            if ($row['requests'] >= $limit) {
                return false;
            }
            // Increment
            $update = "UPDATE " . $this->table_name . " 
                       SET requests = requests + 1 
                       WHERE id = :id";
            $stmt = $this->db->prepare($update);
            $stmt->execute([':id' => $row['id']]);
        } else {
            // Insert new
            $insert = "INSERT INTO " . $this->table_name . " 
                       (ip_address, endpoint, requests, start_time) 
                       VALUES (:ip, :endpoint, 1, :time)";
            $stmt = $this->db->prepare($insert);
            $stmt->execute([':ip' => $ip, ':endpoint' => $endpoint, ':time' => $current_time]);
        }

        return true;
    }
}
?>
