import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { db } from '@/lib/db/drizzle';
import { users as usersSchema } from '@/lib/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// GET - Lấy danh sách users (Admin)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    const filters = [sql`${usersSchema.deletedAt} IS NULL`];

    if (search) {
      filters.push(
        sql`(${usersSchema.email} LIKE ${`%%${search}%%`} OR CONCAT(${usersSchema.firstName}, ' ', ${usersSchema.lastName}) LIKE ${`%%${search}%%`} OR ${usersSchema.phone} LIKE ${`%%${search}%%`})`
      );
    }

    const data = await db.select({
      id: usersSchema.id,
      email: usersSchema.email,
      firstName: usersSchema.firstName,
      lastName: usersSchema.lastName,
      phone: usersSchema.phone,
      isActive: usersSchema.isActive,
      isVerified: usersSchema.isVerified,
      isBanned: usersSchema.isBanned,
      createdAt: usersSchema.createdAt,
      updatedAt: usersSchema.updatedAt,
    })
      .from(usersSchema)
      .where(and(...filters))
      .orderBy(desc(usersSchema.createdAt))
      .limit(limit)
      .offset(offset);

    // Decrypt PII data
    const decryptedUsers = data.map(user => ({
      ...user,
      phone: user.phone ? decrypt(user.phone) : null
    }));

    // Get total count
    const [countResult] = await db.select({ total: count() })
      .from(usersSchema)
      .where(and(...filters));

    const total = countResult?.total || 0;

    return ResponseWrapper.success(decryptedUsers, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(error, 'Error fetching users:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// PUT - Cập nhật user (Admin)
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return ResponseWrapper.error('User ID required', 400);

    // Filter updates
    const allowedFields = ['firstName', 'lastName', 'phone', 'isActive', 'isVerified', 'membershipTier'];
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return ResponseWrapper.error('No valid fields to update', 400);
    }

    await db.update(usersSchema)
      .set({
        ...filteredUpdates,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(usersSchema.id, id));

    return ResponseWrapper.success(null, 'User updated successfully');
  } catch (error) {
    logger.error(error, 'Error updating user:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// DELETE - Xóa người dùng (Soft Delete)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return ResponseWrapper.error('User ID required', 400);

    await db.update(usersSchema)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        isActive: 0
      })
      .where(eq(usersSchema.id, Number(id)));

    return ResponseWrapper.success(null, 'Người dùng đã được xóa tạm thời (Soft Deleted)');
  } catch (error) {
    logger.error(error, 'Error deleting user:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

