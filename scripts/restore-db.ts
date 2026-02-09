import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'nike_clone';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

async function restoreDatabase() {
    console.log('🔄 Bắt đầu khôi phục cơ sở dữ liệu...');

    // 1. Read the SQL file
    const sqlFilePath = path.resolve(__dirname, '../database.sql');
    if (!fs.existsSync(sqlFilePath)) {
        console.error(`❌ Không tìm thấy file: ${sqlFilePath}`);
        process.exit(1);
    }

    console.log(`📖 Đang đọc file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // 2. Create connection
    // Note: multi statements allowed for dump execution
    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: DB_PORT,
        multipleStatements: true,
        charset: 'utf8mb4' // Force utf8mb4
    });

    try {
        console.log(`🔌 Đã kết nối đến MySQL tại ${DB_HOST}:${DB_PORT}`);

        // 3. Create DB if not exists (just in case)
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database ${DB_NAME} đã sẵn sàng.`);

        // 4. Switch to the database
        await connection.changeUser({ database: DB_NAME });

        // 5. Execute the SQL dump
        console.log('🚀 Đang thực thi SQL dump...');
        // Splitting by schema specific comments if needed, but mysql2 handles multiple statements
        // nicely usually unless the file is huge.
        // For safety/progress, we can try to execute it as one big block if it fits in memory (123KB is tiny).

        await connection.query(sqlContent);
        console.log('✅ Đã thực thi xong SQL dump.');

        // 6. Verify encoding
        console.log('🔍 Kiểm tra encoding...');
        const [rows]: any = await connection.query(`SELECT * FROM banners LIMIT 1`);
        if (rows.length > 0) {
            console.log('Banner sample:', rows[0].title, rows[0].description);
            if (rows[0].description && !rows[0].description.includes('?')) {
                console.log('🎉 Verification PASSED: Vietnamese characters appear correct.');
            } else {
                console.log('⚠️ Verification WARNING: Vietnamese characters might be incorrect. Please check manually.');
            }
        } else {
            console.log('⚠️ No banners found to verify.');
        }

    } catch (error) {
        console.error('❌ Lỗi khi khôi phục database:', error);
    } finally {
        await connection.end();
        console.log('👋 Đã đóng kết nối.');
    }
}

restoreDatabase();
