CREATE DATABASE IF NOT EXISTS healthcare_ai;
USE healthcare_ai;

-- Table for storing chat history
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- 'user' or 'bot'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing emergency alerts
CREATE TABLE IF NOT EXISTS emergency_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_message TEXT NOT NULL,
    location TEXT NULL, -- Google Maps link
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
