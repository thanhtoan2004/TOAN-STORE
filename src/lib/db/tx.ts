import { db } from './drizzle';
import { logger } from '../logger';

/**
 * Executes a callback within a database transaction.
 * Automatically handles commit and rollback.
 */
export async function withTransaction<T>(
    callback: (tx: any) => Promise<T>
): Promise<T> {
    return await db.transaction(async (tx) => {
        try {
            return await callback(tx);
        } catch (error) {
            logger.error(error, 'Transaction failed, rolling back:');
            throw error;
        }
    });
}
