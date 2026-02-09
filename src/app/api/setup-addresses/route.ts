import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        console.log('Connected to database, creating addresses table...');

        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address_line VARCHAR(500) NOT NULL,
        ward VARCHAR(100),
        district VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'Vietnam',
        is_default TINYINT(1) DEFAULT 0,
        label VARCHAR(50) DEFAULT 'Home',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

        console.log('Addresses table created successfully');
        await connection.end();

        return NextResponse.json({ success: true, message: 'Addresses table created' });
    } catch (error) {
        console.error('Error creating table:', error);
        return NextResponse.json({ success: false, error: 'Failed to create table' }, { status: 500 });
    }
}
