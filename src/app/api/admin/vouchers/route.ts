import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { vouchers as vouchersTable, users, notifications } from '@/lib/db/schema';
import { eq, and, sql, desc, count, isNull, ne } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';
import { hashEmail, decrypt } from '@/lib/security/encryption';

/**
 * GET - Lấy danh sách Voucher (Mã giảm giá cá nhân).
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const vouchers = await db
      .select({
        id: vouchersTable.id,
        code: vouchersTable.code,
        value: vouchersTable.value,
        discount_type: vouchersTable.discountType,
        description: vouchersTable.description,
        status: vouchersTable.status,
        recipient_user_id: vouchersTable.recipientUserId,
        recipientEmailEnc: users.emailEncrypted,
        uEnc: users.isEncrypted,
        redeemed_by_user_id: vouchersTable.redeemedByUserId,
        min_order_value: vouchersTable.minOrderValue,
        applicable_categories: vouchersTable.applicableCategories,
        applicable_tier: vouchersTable.applicableTier,
        valid_from: vouchersTable.validFrom,
        valid_until: vouchersTable.validUntil,
        redeemed_at: vouchersTable.redeemedAt,
        created_at: vouchersTable.createdAt,
        updated_at: vouchersTable.updatedAt,
      })
      .from(vouchersTable)
      .leftJoin(users, eq(vouchersTable.recipientUserId, users.id))
      .where(isNull(vouchersTable.deletedAt))
      .orderBy(desc(vouchersTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Decrypt emails for display
    const processedVouchers = vouchers.map((v) => ({
      ...v,
      recipient_email: v.uEnc && v.recipientEmailEnc ? decrypt(v.recipientEmailEnc) : null,
    }));

    const [countResult] = await db
      .select({ total: count() })
      .from(vouchersTable)
      .where(isNull(vouchersTable.deletedAt));

    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return ResponseWrapper.success(processedVouchers, undefined, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return ResponseWrapper.serverError('Error fetching vouchers', error);
  }
}

/**
 * POST - Tạo Voucher mới.
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const {
      code,
      value,
      description,
      recipient_email,
      valid_until,
      discount_type,
      min_order_value,
      applicable_categories,
      applicable_tier,
    } = body;

    if (!code || !value) {
      return ResponseWrapper.error('Code and value are required', 400);
    }

    // Check if code already exists (including soft-deleted)
    const [existing] = await db
      .select({ id: vouchersTable.id, deletedAt: vouchersTable.deletedAt })
      .from(vouchersTable)
      .where(eq(vouchersTable.code, code))
      .limit(1);

    const isDeletedExist = existing && existing.deletedAt !== null;

    if (existing && !isDeletedExist) {
      return ResponseWrapper.error('Mã voucher này đã tồn tại và đang hoạt động.', 400);
    }

    // Validate and lookup recipient_email if provided
    let targetUserId = null;
    if (recipient_email) {
      const emailHash = hashEmail(recipient_email);
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.emailHash, emailHash))
        .limit(1);

      if (!user) {
        return ResponseWrapper.error('Email người nhận không tồn tại', 400);
      }
      targetUserId = user.id;
    }

    // Parse values
    const numValue = String(value);
    const numMinOrder = min_order_value ? String(min_order_value) : '0';
    const cats = applicable_categories || null;

    let voucherId: number;

    if (isDeletedExist) {
      // SMART RESTORE
      voucherId = existing.id;
      await db
        .update(vouchersTable)
        .set({
          value: numValue,
          description: description || null,
          recipientUserId: targetUserId,
          validUntil: valid_until ? new Date(valid_until) : null,
          discountType: discount_type || 'fixed',
          minOrderValue: numMinOrder,
          applicableCategories: cats,
          applicableTier: applicable_tier || 'bronze',
          status: 'active',
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(vouchersTable.id, voucherId));
    } else {
      // NORMAL INSERT
      const [insertResult] = await db.insert(vouchersTable).values({
        code,
        value: numValue,
        description: description || null,
        recipientUserId: targetUserId,
        validUntil: valid_until ? new Date(valid_until) : null,
        discountType: discount_type || 'fixed',
        minOrderValue: numMinOrder,
        applicableCategories: cats,
        applicableTier: applicable_tier || 'bronze',
        status: 'active',
        issuedByUserId: adminAuth.userId,
      });
      voucherId = insertResult.insertId;
    }

    await logAdminAction(
      adminAuth.userId,
      'CREATE_VOUCHER',
      'vouchers',
      voucherId,
      null,
      { code, value },
      request
    );

    // Send email/notifications if recipient provided
    if (recipient_email && targetUserId) {
      const { sendVoucherReceivedEmail } = await import('@/lib/mail/mail');

      const [userResult] = await db
        .select({ fullName: users.fullName, promoNotifications: users.emailNotifications }) // Using emailNotifications for now
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      const recipientName =
        userResult?.fullName?.trim().split(' ')[0] || recipient_email.split('@')[0];

      sendVoucherReceivedEmail(
        recipient_email,
        recipientName,
        code,
        parseFloat(numValue),
        discount_type || 'fixed',
        parseFloat(numMinOrder)
      ).catch(console.error);

      // Send In-app NOTIFICATION
      const promoValueStr =
        discount_type === 'percent'
          ? `${numValue}%`
          : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              parseFloat(numValue)
            );

      await db
        .insert(notifications)
        .values({
          userId: targetUserId,
          type: 'promo',
          title: 'Bạn vừa nhận được voucher mới!',
          message: `Chúc mừng! Bạn vừa nhận được mã giảm giá ${code} trị giá ${promoValueStr}. Hãy sử dụng ngay!`,
          linkUrl: '/account/vouchers',
          isRead: 0,
        })
        .catch((err) => console.error('Error inserting voucher notification:', err));
    }

    return ResponseWrapper.success(
      { id: voucherId, code, value, description },
      'Voucher created successfully'
    );
  } catch (error) {
    console.error('Error creating voucher:', error);
    return ResponseWrapper.serverError('Error creating voucher', error);
  }
}

/**
 * PUT - Cập nhật thông tin Voucher.
 */
export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return ResponseWrapper.unauthorized();
    }

    const {
      id,
      code,
      value,
      description,
      recipient_email,
      valid_until,
      status,
      discount_type,
      min_order_value,
      applicable_categories,
      applicable_tier,
    } = await request.json();

    if (!id) {
      return ResponseWrapper.error('ID is required', 400);
    }

    if (code) {
      const [existing] = await db
        .select({ id: vouchersTable.id, deletedAt: vouchersTable.deletedAt })
        .from(vouchersTable)
        .where(and(eq(vouchersTable.code, code), ne(vouchersTable.id, Number(id))))
        .limit(1);

      if (existing) {
        if (existing.deletedAt === null) {
          return ResponseWrapper.error('Mã voucher này đã tồn tại và đang hoạt động.', 400);
        } else {
          return ResponseWrapper.error('Mã mới này trùng với một voucher đã bị xóa.', 400);
        }
      }
    }

    let targetUserId = undefined;
    if (recipient_email !== undefined) {
      if (recipient_email) {
        const emailHash = hashEmail(recipient_email);
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.emailHash, emailHash))
          .limit(1);

        if (!user) {
          return ResponseWrapper.error('Email người nhận không tồn tại', 400);
        }
        targetUserId = user.id;
      } else {
        targetUserId = null;
      }
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (value !== undefined) updateData.value = String(value);
    if (description !== undefined) updateData.description = description || null;
    if (targetUserId !== undefined) updateData.recipientUserId = targetUserId;
    if (valid_until !== undefined)
      updateData.validUntil = valid_until ? new Date(valid_until) : null;
    if (status !== undefined) updateData.status = status;
    if (discount_type !== undefined) updateData.discountType = discount_type;
    if (min_order_value !== undefined) updateData.minOrderValue = String(min_order_value);
    if (applicable_categories !== undefined)
      updateData.applicableCategories = applicable_categories;
    if (applicable_tier !== undefined) updateData.applicableTier = applicable_tier;
    updateData.updatedAt = new Date();

    await db
      .update(vouchersTable)
      .set(updateData)
      .where(eq(vouchersTable.id, Number(id)));

    await logAdminAction(
      adminAuth.userId,
      'UPDATE_VOUCHER',
      'vouchers',
      id,
      null,
      { code, status },
      request
    );

    // If assigned to a user during update, send notification
    if (targetUserId) {
      const [v] = await db
        .select()
        .from(vouchersTable)
        .where(eq(vouchersTable.id, Number(id)))
        .limit(1);

      if (v && targetUserId) {
        const promoValueStr =
          v.discountType === 'percent'
            ? `${v.value}%`
            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                parseFloat(v.value)
              );

        await db
          .insert(notifications)
          .values({
            userId: targetUserId,
            type: 'promo',
            title: 'Bạn vừa nhận được voucher mới!',
            message: `Chúc mừng! Bạn vừa nhận được mã giảm giá ${v.code} trị giá ${promoValueStr}. Hãy sử dụng ngay!`,
            linkUrl: '/account/vouchers',
            isRead: 0,
          })
          .catch((err) => console.error('Error inserting voucher update notification:', err));
      }
    }

    return ResponseWrapper.success(null, 'Voucher updated successfully');
  } catch (error) {
    console.error('Error updating voucher:', error);
    return ResponseWrapper.serverError('Error updating voucher', error);
  }
}

/**
 * DELETE - Xóa Voucher (Soft Delete).
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await checkAdminAuth();
    if (!adminAuth) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ResponseWrapper.error('ID is required', 400);
    }

    await db
      .update(vouchersTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vouchersTable.id, Number(id)));

    await logAdminAction(
      adminAuth.userId,
      'DELETE_VOUCHER',
      'vouchers',
      id,
      null,
      { deleted: true },
      request
    );

    return ResponseWrapper.success(null, 'Voucher deleted successfully');
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return ResponseWrapper.serverError('Error deleting voucher', error);
  }
}
