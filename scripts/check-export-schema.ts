process.env.DB_PORT = '3306';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = ''; // No password as per user request

async function checkSchema() {
    try {
        const { executeQuery } = await import('../src/lib/db/mysql');

        console.log('Orders Columns:');
        const orderCols = await executeQuery('DESCRIBE orders');
        console.table(orderCols);

        console.log('\nUsers Columns:');
        const userCols = await executeQuery('DESCRIBE users');
        console.table(userCols);

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
