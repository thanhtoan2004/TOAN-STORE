import { pool } from './mysql';
import { randomUUID } from 'crypto';

// ==================== SUPPORT CHAT FUNCTIONS ====================

/**
 * Module cấu hình Hệ thống Live Chat CSKH.
 * Ghi chú Kiến trúc: Dự án hiện đang dùng Database-Polling (gọi API liên tục mỗi 3s để tải tin nhắn mới)
 * thay vì WebSockets (Socket.io) để tiết kiệm chi phí duy trì Server Node.js chìm.
 */

/**
 * Tạo một phiên Chat mới (Session).
 * Có hỗ trợ cho cả Guest (vãng lai không đăng nhập) lẫn User có ID.
 * @returns Object chứa `chatId` và `accessToken` (dùng để xác thực Session ở Client).
 */
export async function createSupportChat(data: {
  userId?: number;
  guestEmail?: string;
  guestName?: string;
  initialMessage?: string;
}): Promise<{ chatId: number; accessToken: string }> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const accessToken = randomUUID();

    // Create chat session
    const [result]: any = await connection.execute(
      `INSERT INTO support_chats (user_id, guest_email, guest_name, status, access_token, last_message_at)
       VALUES (?, ?, ?, 'waiting', ?, NOW())`,
      [data.userId || null, data.guestEmail || null, data.guestName || null, accessToken]
    );

    const chatId = result.insertId;

    // Add initial message if provided
    if (data.initialMessage) {
      await connection.execute(
        `INSERT INTO support_messages (chat_id, sender_type, sender_id, message)
         VALUES (?, 'customer', ?, ?)`,
        [chatId, data.userId || null, data.initialMessage]
      );
    }

    await connection.commit();
    return { chatId, accessToken };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get support chat by ID
 */
export async function getSupportChat(chatId: number): Promise<any> {
  const [rows]: any = await pool.execute(
    `SELECT 
      sc.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      admin.email as admin_email,
      admin.full_name as admin_full_name
     FROM support_chats sc
     LEFT JOIN users u ON sc.user_id = u.id
     LEFT JOIN admin_users admin ON sc.assigned_admin_id = admin.id
     WHERE sc.id = ?`,
    [chatId]
  );

  return rows[0] || null;
}

/**
 * Get user's active chat session
 */
export async function getUserActiveChat(userId: number): Promise<any> {
  const [rows]: any = await pool.execute(
    `SELECT * FROM support_chats
     WHERE user_id = ? AND status IN ('waiting', 'active')
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

/**
 * Get guest's active chat by email
 */
export async function getGuestActiveChat(email: string): Promise<any> {
  const [rows]: any = await pool.execute(
    `SELECT * FROM support_chats
     WHERE guest_email = ? AND status IN ('waiting', 'active')
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

/**
 * Create a support message
 */
export async function createSupportMessage(data: {
  chatId: number;
  senderType: 'customer' | 'admin';
  senderId?: number;
  message: string;
  imageUrl?: string;
}): Promise<number> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert message
    const [result]: any = await connection.execute(
      `INSERT INTO support_messages (chat_id, sender_type, sender_id, message, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [data.chatId, data.senderType, data.senderId || null, data.message, data.imageUrl || null]
    );

    // Update chat's last_message_at
    await connection.execute(`UPDATE support_chats SET last_message_at = NOW() WHERE id = ?`, [
      data.chatId,
    ]);

    // If admin sends message, set status to active and update first_response_at
    if (data.senderType === 'admin') {
      await connection.execute(
        `UPDATE support_chats 
                 SET status = 'active', 
                     first_response_at = COALESCE(first_response_at, NOW()) 
                 WHERE id = ? AND status = 'waiting'`,
        [data.chatId]
      );
    }

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get messages for a chat
 */
export async function getSupportMessages(
  chatId: number,
  options?: { since?: Date; limit?: number }
): Promise<any[]> {
  let sql = `
    SELECT 
      sm.*,
      CASE 
        WHEN sm.sender_type = 'admin' THEN au.full_name
        ELSE u.first_name 
      END as sender_first_name,
      CASE 
        WHEN sm.sender_type = 'admin' THEN ''
        ELSE u.last_name 
      END as sender_last_name
    FROM support_messages sm
    LEFT JOIN users u ON sm.sender_id = u.id AND sm.sender_type = 'customer'
    LEFT JOIN admin_users au ON sm.sender_id = au.id AND sm.sender_type = 'admin'
    WHERE sm.chat_id = ?
  `;

  const params: any[] = [chatId];

  if (options?.since) {
    sql += ` AND sm.created_at > ?`;
    params.push(options.since);
  }

  sql += ` ORDER BY sm.created_at ASC`;

  if (options?.limit) {
    sql += ` LIMIT ?`;
    params.push(options.limit);
  }

  // Use pool.query for dynamic SQL compatibility in some mysql2 versions or pool.execute
  const [rows]: any = await pool.query(sql, params);
  return rows;
}

/**
 * Update chat status
 */
export async function updateChatStatus(
  chatId: number,
  status: 'active' | 'waiting' | 'resolved' | 'closed'
): Promise<void> {
  await pool.execute(`UPDATE support_chats SET status = ?, updated_at = NOW() WHERE id = ?`, [
    status,
    chatId,
  ]);
}

/**
 * Assign chat to admin
 */
export async function assignChatToAdmin(chatId: number, adminId: number): Promise<void> {
  await pool.execute(
    `UPDATE support_chats 
     SET assigned_admin_id = ?, status = 'active', updated_at = NOW() 
     WHERE id = ?`,
    [adminId, chatId]
  );
}

/**
 * Get admin chats with filters
 */
export async function getAdminChats(filters: {
  status?: string;
  assignedAdminId?: number;
  page?: number;
  limit?: number;
}): Promise<{ chats: any[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    whereClauses.push('sc.status = ?');
    params.push(filters.status);
  }

  if (filters.assignedAdminId) {
    whereClauses.push('sc.assigned_admin_id = ?');
    params.push(filters.assignedAdminId);
  }

  // Always exclude chats with no messages to avoid "empty" waiting sessions
  whereClauses.push('(SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.id) > 0');

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get chats
  const chatSQL = `
    SELECT 
      sc.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      admin.email as admin_email,
      admin.full_name as admin_full_name,
      (SELECT COUNT(*) FROM support_messages 
       WHERE chat_id = sc.id AND sender_type = 'customer' AND is_read = FALSE) as unread_count,
      (SELECT message FROM support_messages 
       WHERE chat_id = sc.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM support_chats sc
    LEFT JOIN users u ON sc.user_id = u.id
    LEFT JOIN admin_users admin ON sc.assigned_admin_id = admin.id
    ${whereSQL}
    ORDER BY sc.last_message_at DESC
    LIMIT ? OFFSET ?
  `;

  // Use pool.query instead of execute for LIMIT/OFFSET sometimes better
  const [rows]: any = await pool.query(chatSQL, [...params, limit, offset]);

  // Get total count
  const countSQL = `SELECT COUNT(*) as total FROM support_chats sc ${whereSQL}`;
  const [countResult]: any = await pool.query(countSQL, params);
  const total = countResult[0]?.total || 0;

  return { chats: rows, total };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: number,
  senderType: 'customer' | 'admin'
): Promise<void> {
  await pool.execute(
    `UPDATE support_messages 
     SET is_read = TRUE 
     WHERE chat_id = ? AND sender_type = ? AND is_read = FALSE`,
    [chatId, senderType]
  );
}

/**
 * Get unread message count for admin
 */
export async function getUnreadMessageCount(adminId?: number): Promise<number> {
  let sql = `
    SELECT COUNT(*) as count
    FROM support_messages sm
    JOIN support_chats sc ON sm.chat_id = sc.id
    WHERE sm.sender_type = 'customer' AND sm.is_read = FALSE
  `;

  const params: any[] = [];

  if (adminId) {
    sql += ` AND sc.assigned_admin_id = ?`;
    params.push(adminId);
  }

  const [rows]: any = await pool.query(sql, params);
  return rows[0]?.count || 0;
}
