<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Generated hash: $hash\n";

$stmt = $db->prepare("UPDATE users SET username = 'admin', password = ? WHERE role = 'admin'");
$stmt->execute([$hash]);

echo "Admin password updated successfully!\n";
echo "Username: admin\n";
echo "Password: admin123\n";

// Verify it works
$stmt = $db->prepare("SELECT username, password FROM users WHERE role = 'admin'");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (password_verify('admin123', $user['password'])) {
    echo "✓ Password verification successful!\n";
} else {
    echo "✗ Password verification failed!\n";
}
?>
