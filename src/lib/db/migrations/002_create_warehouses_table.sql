-- Migration: 002_create_warehouses_table
-- Description: Create warehouses table and seed data.

CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO warehouses (id, name, location) VALUES 
(1, 'Kho Hà Nội (Main)', 'Hà Nội'),
(2, 'Kho TP.HCM', 'TP. Hồ Chí Minh');
