import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './src/lib/db/migrations',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nike_clone',
        port: Number(process.env.DB_PORT) || 3306,
    },
});
