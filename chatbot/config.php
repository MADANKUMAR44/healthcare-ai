<?php
// config.php - Configuration for Database and APIs

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Change this based on your XAMPP/WAMP setup
define('DB_PASS', '');     // Change this based on your XAMPP/WAMP setup
define('DB_NAME', 'healthcare_ai');

// Groq API Configuration
// IMPORTANT: Replace with your actual Groq API Key
define('GROQ_API_KEY', 'YOUR_GROQ_API_KEY_HERE');

// Database Connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database Connection Failed: " . $conn->connect_error]));
}

// Set charset to utf8mb4 for emoji and multilingual support (Tamil)
$conn->set_charset("utf8mb4");
?>
