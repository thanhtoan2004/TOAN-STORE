
import { executeQuery } from '../lib/db/mysql';
import fs from 'fs';

async function main() {
    try {
        const rows = await executeQuery<any[]>(
            "DESCRIBE orders",
            []
        );
        const statusRow = rows.find((row: any) => row.Field === 'status');
        fs.writeFileSync('schema-dump.json', JSON.stringify(statusRow, null, 2));
        console.log('Dumped status schema to schema-dump.json');
    } catch (error) {
        console.error(error);
    }
}

main();
