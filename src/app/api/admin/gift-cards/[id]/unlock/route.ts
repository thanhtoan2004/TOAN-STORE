import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';
import { withErrorHandling, createSuccessResponse, createErrorResponse } from '@/lib/api/api-utils';

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
  const cards = await executeQuery<any[]>(
    `SELECT id, status, current_balance, expires_at FROM gift_cards WHERE id = ?`,
    [id]
  );

  if (!cards || cards.length === 0) {
    return createErrorResponse('Gift card not found', 404);
  }

  const card = cards[0];

  // Nếu thẻ đã hết hạn hoặc đã tiêu hết
  if (card.status === 'used' || card.status === 'expired') {
    return createErrorResponse('Cannot unlock a used or expired gift card', 400);
  }

  // Bật lại trạng thái and Reset failed attempts
  await executeQuery(`UPDATE gift_cards SET status = 'active', failed_attempts = 0 WHERE id = ?`, [
    id,
  ]);

  // Xóa toàn bộ lịch sử khóa IP nếu có (Anti Brute Force Lockout)
  // Tùy chọn: Hoặc chỉ để thẻ hoạt động lại, vẫn phạt IP. Ở đây ta khoan dung, không reset IP lockout.

  // Thêm log admin (Tùy chọn)
  await executeQuery(
    `INSERT INTO admin_activity_logs (admin_user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)`,
    [admin.userId, 'unlock_gift_card', 'gift_cards', id]
  );

  return createSuccessResponse(null, 'Gift card unlocked successfully');
}

export const PATCH = withErrorHandling(unlockGiftCardHandler);
