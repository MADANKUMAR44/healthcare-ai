<?php
// ai_chat.php - Handles communication with Groq API
require_once 'config.php';

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Get JSON raw POST data
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (isset($input['message'])) {
    $user_message = $input['message'];
    
    // System prompt to set the AI's behavior
    $system_prompt = "You are a SMART RURAL HEALTHCARE CHATBOT AI. You help patients in rural areas with medical advice, symptom checking, first aid information, and general health queries in both English and Tamil if asked. Always advise users to consult a real doctor for serious conditions. Keep responses concise and supportive.";

    $data = [
        "model" => "llama-3.3-70b-versatile",
        "messages" => [
            [
                "role" => "system",
                "content" => $system_prompt
            ],
            [
                "role" => "user",
                "content" => $user_message
            ]
        ],
        "temperature" => 0.5,
        "max_tokens" => 512,
        "top_p" => 1,
        "stream" => false
    ];

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY
    ));

    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpcode == 200) {
        $result = json_decode($response, true);
        if (isset($result['choices'][0]['message']['content'])) {
            $bot_reply = $result['choices'][0]['message']['content'];
            echo json_encode(["status" => "success", "reply" => trim($bot_reply)]);
        } else {
            echo json_encode(["status" => "error", "message" => "Empty response from Groq API", "api_response" => $result]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to reach Groq API. HTTP Code: " . $httpcode]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "No message provided."]);
}
?>
