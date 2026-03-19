import { db } from './drizzle';
import { supportChats, supportMessages, users, adminUsers } from './schema';
import { eq, and, or, inArray, sql, desc, asc, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hashEmail } from '../security/encryption';

// ==================== SUPPORT CHAT FUNCTIONS ====================

/**
 * Module cấu hình Hệ thống Live Chat CSKH.
 */

/**
 * Tạo một phiên Chat mới (Session).
 */
export async function createSupportChat(data: {
  userId?: number;
  guestEmail?: string;
  guestName?: string;
  initialMessage?: string;
}): Promise<{ chatId: number; accessToken: string }> {
  return await db.transaction(async (tx) => {
    const accessToken = randomUUID();
    const guestEmailHash = data.guestEmail ? hashEmail(data.guestEmail) : null;

    const [result] = await tx.insert(supportChats).values({
      userId: data.userId || null,
      guestEmail: '***',
      guestEmailHash,
      guestName: data.guestName || null,
      status: 'waiting',
      accessToken,
      lastMessageAt: new Date(),
    });

    const chatId = result.insertId;

    if (data.initialMessage) {
      await tx.insert(supportMessages).values({
        chatId,
        senderType: 'customer',
        senderId: data.userId || null,
        message: data.initialMessage,
      });
    }

    return { chatId, accessToken };
  });
}

/**
 * Get support chat by ID
 */
export async function getSupportChat(chatId: number): Promise<any> {
  const [row] = await db
    .select({
      id: supportChats.id,
      userId: supportChats.userId,
      guestEmail: supportChats.guestEmail,
      guestName: supportChats.guestName,
      status: supportChats.status,
      accessToken: supportChats.accessToken,
      assignedAdminId: supportChats.assignedAdminId,
      lastMessageAt: supportChats.lastMessageAt,
      createdAt: supportChats.createdAt,
      user_email: users.email,
      user_first_name: users.firstName,
      user_last_name: users.lastName,
      user_created_at: users.createdAt,
      admin_email: adminUsers.email,
      admin_full_name: adminUsers.fullName,
    })
    .from(supportChats)
    .leftJoin(users, eq(supportChats.userId, users.id))
    .leftJoin(adminUsers, eq(supportChats.assignedAdminId, adminUsers.id))
    .where(eq(supportChats.id, chatId))
    .limit(1);

  return row || null;
}

/**
 * Get user's active chat session
 */
export async function getUserActiveChat(userId: number): Promise<any> {
  const [row] = await db
    .select()
    .from(supportChats)
    .where(
      and(eq(supportChats.userId, userId), inArray(supportChats.status, ['waiting', 'active']))
    )
    .orderBy(desc(supportChats.createdAt))
    .limit(1);

  return row || null;
}

/**
 * Get guest's active chat by email
 */
export async function getGuestActiveChat(email: string): Promise<any> {
  const emailHash = hashEmail(email);
  const [row] = await db
    .select()
    .from(supportChats)
    .where(
      and(
        eq(supportChats.guestEmailHash, emailHash),
        inArray(supportChats.status, ['waiting', 'active'])
      )
    )
    .orderBy(desc(supportChats.createdAt))
    .limit(1);

  return row || null;
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
  return await db.transaction(async (tx) => {
    // Insert message
    const [result] = await tx.insert(supportMessages).values({
      chatId: data.chatId,
      senderType: data.senderType,
      senderId: data.senderId || null,
      message: data.message,
      imageUrl: data.imageUrl || null,
    });

    const messageId = result.insertId;

    // Update chat's last_message_at
    await tx
      .update(supportChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(supportChats.id, data.chatId));

    // If admin sends message, set status to active and update first_response_at
    if (data.senderType === 'admin') {
      await tx
        .update(supportChats)
        .set({
          status: 'active',
          firstResponseAt: sql`COALESCE(${supportChats.firstResponseAt}, NOW())`,
        })
        .where(and(eq(supportChats.id, data.chatId), eq(supportChats.status, 'waiting')));
    }

    return messageId;
  });
}

/**
 * Get messages for a chat
 */
export async function getSupportMessages(
  chatId: number,
  options?: { since?: Date; limit?: number }
): Promise<any[]> {
  const filters = [eq(supportMessages.chatId, chatId)];

  if (options?.since) {
    filters.push(sql`${supportMessages.createdAt} > ${options.since}`);
  }

  const query = db
    .select({
      id: supportMessages.id,
      chatId: supportMessages.chatId,
      senderType: supportMessages.senderType,
      senderId: supportMessages.senderId,
      message: supportMessages.message,
      imageUrl: supportMessages.imageUrl,
      isRead: supportMessages.isRead,
      createdAt: supportMessages.createdAt,
      sender_first_name: sql<string>`
        CASE 
          WHEN ${supportMessages.senderType} = 'admin' THEN ${adminUsers.fullName}
          ELSE ${users.firstName} 
        END
      `,
      sender_last_name: sql<string>`
        CASE 
          WHEN ${supportMessages.senderType} = 'admin' THEN ''
          ELSE ${users.lastName} 
        END
      `,
    })
    .from(supportMessages)
    .leftJoin(
      users,
      and(eq(supportMessages.senderId, users.id), eq(supportMessages.senderType, 'customer'))
    )
    .leftJoin(
      adminUsers,
      and(eq(supportMessages.senderId, adminUsers.id), eq(supportMessages.senderType, 'admin'))
    )
    .where(and(...filters))
    .orderBy(asc(supportMessages.createdAt));

  if (options?.limit) {
    query.limit(options.limit);
  }

  return await query;
}

/**
 * Update chat status
 */
export async function updateChatStatus(
  chatId: number,
  status: 'active' | 'waiting' | 'resolved' | 'closed'
): Promise<void> {
  await db
    .update(supportChats)
    .set({ status, lastMessageAt: new Date() }) // Using lastMessageAt for updated timestamp
    .where(eq(supportChats.id, chatId));
}

/**
 * Assign chat to admin
 */
export async function assignChatToAdmin(chatId: number, adminId: number): Promise<void> {
  await db
    .update(supportChats)
    .set({ assignedAdminId: adminId, status: 'active', lastMessageAt: new Date() })
    .where(eq(supportChats.id, chatId));
}

/**
 * Get admin chats with filters
 */
export async function getAdminChats(filters: {
  status?: string;
  assignedAdminId?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ chats: any[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const whereClauses = [];

  if (filters.status) {
    whereClauses.push(eq(supportChats.status, filters.status as any));
  }

  if (filters.assignedAdminId) {
    whereClauses.push(eq(supportChats.assignedAdminId, filters.assignedAdminId));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    whereClauses.push(
      or(
        sql`${users.firstName} LIKE ${searchTerm}`,
        sql`${users.lastName} LIKE ${searchTerm}`,
        sql`${users.email} LIKE ${searchTerm}`,
        sql`${supportChats.guestName} LIKE ${searchTerm}`,
        sql`${supportChats.guestEmail} LIKE ${searchTerm}`
      )
    );
  }

  // Only shows chats with messages
  whereClauses.push(
    sql`(SELECT COUNT(*) FROM support_messages WHERE chat_id = ${supportChats.id}) > 0`
  );

  const chats = await db
    .select({
      id: supportChats.id,
      userId: supportChats.userId,
      guestEmail: supportChats.guestEmail,
      guestName: supportChats.guestName,
      status: supportChats.status,
      accessToken: supportChats.accessToken,
      assignedAdminId: supportChats.assignedAdminId,
      lastMessageAt: supportChats.lastMessageAt,
      createdAt: supportChats.createdAt,
      user_email: users.email,
      user_first_name: users.firstName,
      user_last_name: users.lastName,
      admin_email: adminUsers.email,
      admin_full_name: adminUsers.fullName,
      unread_count: sql<number>`(SELECT COUNT(*) FROM support_messages WHERE chat_id = ${supportChats.id} AND sender_type = 'customer' AND is_read = 0)`,
      last_message: sql<string>`(SELECT message FROM support_messages WHERE chat_id = ${supportChats.id} ORDER BY created_at DESC LIMIT 1)`,
    })
    .from(supportChats)
    .leftJoin(users, eq(supportChats.userId, users.id))
    .leftJoin(adminUsers, eq(supportChats.assignedAdminId, adminUsers.id))
    .where(and(...whereClauses))
    .orderBy(desc(supportChats.lastMessageAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ total: count() })
    .from(supportChats)
    .where(and(...whereClauses));

  return { chats, total: totalResult?.total || 0 };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: number,
  senderType: 'customer' | 'admin'
): Promise<void> {
  await db
    .update(supportMessages)
    .set({ isRead: 1 })
    .where(
      and(
        eq(supportMessages.chatId, chatId),
        eq(supportMessages.senderType, senderType),
        eq(supportMessages.isRead, 0)
      )
    );
}

/**
 * Get unread message count for admin
 */
export async function getUnreadMessageCount(adminId?: number): Promise<number> {
  const whereClauses = [eq(supportMessages.senderType, 'customer'), eq(supportMessages.isRead, 0)];

  if (adminId) {
    whereClauses.push(eq(supportChats.assignedAdminId, adminId));
  }

  const [result] = await db
    .select({ count: count() })
    .from(supportMessages)
    .innerJoin(supportChats, eq(supportMessages.chatId, supportChats.id))
    .where(and(...whereClauses));

  return result?.count || 0;
}
