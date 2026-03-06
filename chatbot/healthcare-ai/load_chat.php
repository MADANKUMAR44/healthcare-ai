<?php
// load_chat.php - Retrieve messages from MySQL
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$sql = "SELECT id, message, sender, created_at FROM chat_messages ORDER BY created_at ASC";
$result = $conn->query($sql);

$messages = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
}

echo json_encode(["status" => "success", "data" => $messages]);

$conn->close();
?>
