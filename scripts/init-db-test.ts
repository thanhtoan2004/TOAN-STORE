import { initDb } from '../src/lib/db/init';
import { executeQuery } from '../src/lib/db/mysql';

async function run() {
    console.log('--- Initializing Database ---');
    try {
        const success = await initDb();
        console.log('Initialization status:', success);

        if (success) {
            console.log('Seeding test admin user...');
            await executeQuery(
                "INSERT IGNORE INTO admin_users (id, username, password, email, role, is_active) VALUES (1, 'admin', 'password', 'admin@example.com', 'super_admin', 1)"
            );
            console.log('Seeding complete.');
        }

        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

run();
