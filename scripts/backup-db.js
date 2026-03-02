const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'toan_store';

// Backup config
const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${DB_NAME}-${timestamp}.sql`);

console.log(`🚀 Starting Database Backup for ${DB_NAME}...`);

// Construct mysqldump command
// Note: This requires 'mysqldump' to be in system PATH
const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} --routines --triggers ${DB_NAME} > "${backupFile}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup Failed: ${error.message}`);
        return;
    }
    if (stderr) {
        // mysqldump writes to stderr for progress, it's not always an error
        console.log(`ℹ️ Info: ${stderr}`);
    }

    console.log(`✅ Backup Successful!`);
    console.log(`📁 File: ${backupFile}`);

    // Verify file size
    const stats = fs.statSync(backupFile);
    console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
});
