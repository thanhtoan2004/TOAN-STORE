const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // fallback to .env
}

async function run() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'nike_clone',
        port: Number(process.env.DB_PORT) || 3306,
    };

    if (process.env.DB_PASSWORD) {
        config.password = process.env.DB_PASSWORD;
    }

    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected. Altering table...');

        // Check if duplicate column exists or just run alter
        // We want to add 'read' and 'replied' to the ENUM
        await connection.query(`
      ALTER TABLE contact_messages 
      MODIFY COLUMN status ENUM('new', 'read', 'replied', 'in_progress', 'resolved', 'closed') DEFAULT 'new'
    `);

        console.log('Table contact_messages altered successfully.');
        await connection.end();
    } catch (err) {
        console.error('Failed to update database:', err);
        process.exit(1);
    }
}

run();
