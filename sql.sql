CREATE DATABASE IF NOT EXISTS smart_recycling_db;

USE smart_recycling_db;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Disposal tips table
CREATE TABLE IF NOT EXISTS disposal_tips (
    tip_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE,
    disposal_tip TEXT NOT NULL
);

-- 3. Waste predictions table
CREATE TABLE IF NOT EXISTS waste_predictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    image_filename VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,4),
    disposal_tip TEXT,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- Add disposal tips
INSERT INTO disposal_tips (category, disposal_tip)
VALUES
('Plastic', 'Empty and clean the item before recycling it according to local rules.'),
('Paper', 'Keep paper dry and separate from food-contaminated waste.'),
('Metal', 'Empty containers and place recyclable metal in the appropriate bin.'),
('Glass', 'Separate glass and follow local collection and handling rules.'),
('Organic', 'Compost suitable food scraps and garden waste.'),
('E-Waste', 'Take electronic waste to an authorized e-waste collection centre.'),
('General Waste', 'Dispose of non-recyclable waste according to local rules.')
ON DUPLICATE KEY UPDATE
disposal_tip = VALUES(disposal_tip);

-- View all disposal tips
SELECT * FROM disposal_tips;

-- View prediction history
SELECT * FROM waste_predictions;