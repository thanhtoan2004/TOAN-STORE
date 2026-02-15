import { initDb } from '../src/lib/db/init';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function run() {
    console.log('🚀 Running Phase 19 Base Migration...');
    try {
        const success = await initDb();
        if (success) {
            console.log('✅ Phase 19 DB Initialization Successful!');
        } else {
            console.log('❌ Phase 19 DB Initialization Failed.');
            process.exit(1);
        }
    } catch (error) {
        console.error('💥 Fatal Error:', error);
        process.exit(1);
    }
}

run();
