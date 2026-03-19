import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { giftCards } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { withErrorHandling, createSuccessResponse, createErrorResponse } from '@/lib/api/api-utils';
import { logAdminAction } from '@/lib/db/repositories/audit';

/**
 * API Mở khóa thẻ quà tặng đã bị khóa do nhập sai PIN quá số lần.
 * Quyền: Admin
 */
async function unlockGiftCardHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await checkAdminAuth();
  if (!admin) {
    return createErrorResponse('Unauthorized', 401);
  }

  const { id: paramId } = await params;
  const id = parseInt(paramId);
  if (isNaN(id)) {
    return createErrorResponse('Invalid ID', 400);
  }

  // Kiểm tra xem thẻ có trong DB không và đang ở trạng thái nào
  const [card] = await db
    .select({
      id: giftCards.id,
      status: giftCards.status,
      currentBalance: giftCards.currentBalance,
      expiresAt: giftCards.expiresAt,
    })
    .from(giftCards)
    .where(eq(giftCards.id, id))
    .limit(1);

  if (!card) {
    return createErrorResponse('Gift card not found', 404);
  }

  // Nếu thẻ đã hết hạn hoặc đã tiêu hết
  if (card.status === 'used' || card.status === 'expired') {
    return createErrorResponse('Cannot unlock a used or expired gift card', 400);
  }

  // Bật lại trạng thái and Reset failed attempts
  await db
    .update(giftCards)
    .set({
      status: 'active' as any,
      failedAttempts: 0,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, id));

  // Thêm log admin
  await logAdminAction(
    admin.userId,
    'unlock_gift_card',
    'gift_cards',
    id,
    null,
    { status: 'active' },
    req
  );

  return createSuccessResponse(null, 'Gift card unlocked successfully');
}

export const PATCH = withErrorHandling(unlockGiftCardHandler);
