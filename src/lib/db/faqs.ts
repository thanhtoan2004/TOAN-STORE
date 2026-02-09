import { pool } from './mysql';

export async function getAllFAQs() {
    try {
        const [rows]: any = await pool.query('SELECT question, answer FROM faqs ORDER BY id ASC');
        return rows;
    } catch (error) {
        console.error('Failed to fetch FAQs:', error);
        return [];
    }
}

export async function searchFAQs(query: string) {
    try {
        const [rows]: any = await pool.query(
            `SELECT question, answer FROM faqs 
             WHERE question LIKE ? OR keywords LIKE ?`,
            [`%${query}%`, `%${query}%`]
        );
        return rows;
    } catch (error) {
        console.error('Failed to search FAQs:', error);
        return [];
    }
}
