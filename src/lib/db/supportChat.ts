import { pool } from './mysql';

// ==================== SUPPORT CHAT FUNCTIONS ====================

/**
 * Create a new support chat session
 */
export async function createSupportChat(data: {
    userId?: number;
    guestEmail?: string;
    guestName?: string;
    initialMessage?: string;
}): Promise<number> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Create chat session
        const [result]: any = await connection.execute(
            `INSERT INTO support_chats (user_id, guest_email, guest_name, status, last_message_at)
       VALUES (?, ?, ?, 'waiting', NOW())`,
            [data.userId || null, data.guestEmail || null, data.guestName || null]
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
        return chatId;
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
      admin.first_name as admin_first_name,
      admin.last_name as admin_last_name
     FROM support_chats sc
     LEFT JOIN users u ON sc.user_id = u.id
     LEFT JOIN users admin ON sc.assigned_admin_id = admin.id
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
        await connection.execute(
            `UPDATE support_chats SET last_message_at = NOW() WHERE id = ?`,
            [data.chatId]
        );

        // If admin sends message, set status to active
        if (data.senderType === 'admin') {
            await connection.execute(
                `UPDATE support_chats SET status = 'active' WHERE id = ? AND status = 'waiting'`,
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
      u.email as sender_email,
      u.first_name as sender_first_name,
      u.last_name as sender_last_name
    FROM support_messages sm
    LEFT JOIN users u ON sm.sender_id = u.id
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
    await pool.execute(
        `UPDATE support_chats SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, chatId]
    );
}

/**
 * Assign chat to admin
 */
export async function assignChatToAdmin(
    chatId: number,
    adminId: number
): Promise<void> {
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

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (filters.status) {
        whereClauses.push('sc.status = ?');
        params.push(filters.status);
    }

    if (filters.assignedAdminId) {
        whereClauses.push('sc.assigned_admin_id = ?');
        params.push(filters.assignedAdminId);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get chats
    const chatSQL = `
    SELECT 
      sc.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      admin.email as admin_email,
      admin.first_name as admin_first_name,
      admin.last_name as admin_last_name,
      (SELECT COUNT(*) FROM support_messages 
       WHERE chat_id = sc.id AND sender_type = 'customer' AND is_read = FALSE) as unread_count,
      (SELECT message FROM support_messages 
       WHERE chat_id = sc.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM support_chats sc
    LEFT JOIN users u ON sc.user_id = u.id
    LEFT JOIN users admin ON sc.assigned_admin_id = admin.id
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
