<?php
// save_chat.php - Save messages to MySQL
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (isset($input['message']) && isset($input['sender'])) {
    $message = $conn->real_escape_string($input['message']);
    $sender = $conn->real_escape_string($input['sender']);

    $sql = "INSERT INTO chat_messages (message, sender) VALUES ('$message', '$sender')";
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Message saved."]);
    }
    else {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $conn->error]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "Invalid inputs"]);
}

$conn->close();
?>
