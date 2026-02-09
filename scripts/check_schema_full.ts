import { pool } from '../src/lib/db/mysql';

async function checkTables() {
    try {
        const [rows]: any = await pool.query("SHOW TABLES");
        const tables = rows.map((r: any) => Object.values(r)[0]);
        console.log('Tables:', tables);

        // Check specifics
        console.log('Has reviews?', tables.includes('reviews') || tables.includes('product_reviews'));
        console.log('Has wishlist?', tables.includes('wishlists') || tables.includes('favorites'));

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkTables();
