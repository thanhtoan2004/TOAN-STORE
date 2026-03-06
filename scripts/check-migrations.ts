import { getConnection } from '../src/lib/db/connection';

async function main() {
  let connection;
  try {
    connection = await getConnection();

    console.log('--- Migrations Table ---');
    try {
      const [rows] = await connection.execute('SELECT name FROM _migrations ORDER BY id ASC');
      console.log(JSON.stringify(rows, null, 2));
    } catch (e: any) {
      console.log('_migrations table does not exist or error:', e.message);
    }

    console.log('\n--- Inventory Table Structure ---');
    try {
      const [rows] = (await connection.execute('SHOW CREATE TABLE inventory')) as any[];
      console.log(rows[0]['Create Table']);
    } catch (e: any) {
      console.log('inventory table error:', e.message);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
