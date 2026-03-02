import { executeQuery } from './db/mysql';

export type NotificationType = 'order' | 'social' | 'promo' | 'system';

export async function createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
) {
    try {
        await executeQuery(
            'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
            [userId, type, title, message, link || null]
        );
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}
