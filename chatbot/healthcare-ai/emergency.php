<?php
// emergency.php - Save emergency alert logs
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (isset($input['alert_message'])) {
    $alert_message = $conn->real_escape_string($input['alert_message']);
    $location = isset($input['location']) ? $conn->real_escape_string($input['location']) : NULL;

    $sql = "INSERT INTO emergency_logs (alert_message, location) VALUES ('$alert_message', '$location')";
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Emergency alert sent and saved."]);
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
