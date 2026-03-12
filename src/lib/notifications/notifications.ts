import { executeQuery } from './db/mysql';

/**
 * Loại thông báo trong hệ thống.
 * - order: Liên quan đến đơn hàng
 * - social: Tương tác người dùng
 * - promo: Khuyến mãi, Voucher
 * - system: Thông báo từ hệ thống/admin
 */
export type NotificationType = 'order' | 'social' | 'promo' | 'system';

/**
 * Tạo thông báo mới cho người dùng (Bell Notification).
 * Dữ liệu này sẽ xuất hiện ở icon chuông trên Header.
 */
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
