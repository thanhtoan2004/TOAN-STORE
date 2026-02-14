
import { executeQuery } from '../lib/db/mysql';
import fs from 'fs';

async function main() {
    try {
        const rows = await executeQuery<any[]>(
            'SELECT id, status, images, reason, admin_response FROM refund_requests',
            []
        );
        fs.writeFileSync('refund-dump.json', JSON.stringify(rows, null, 2));
        console.log('Dumped to refund-dump.json');
    } catch (error) {
        console.error(error);
    }
}

main();
