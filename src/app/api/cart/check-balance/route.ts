import { NextRequest, NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
  withErrorHandling,
} from '@/lib/api/api-utils';
import { checkGiftCardBalance } from '@/lib/db/mysql';
import { withRateLimit } from '@/lib/api/with-rate-limit';

async function balanceHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { cardNumber, pin } = body;

  const validation = validateRequiredFields(body, ['cardNumber', 'pin']);
  if (!validation.isValid) {
    return createErrorResponse(validation.error, 400);
  }

  if (!/^\d{16}$/.test(cardNumber)) {
    return createErrorResponse('Số thẻ quà tặng không hợp lệ', 400);
  }

  if (!/^\d{4}$/.test(pin)) {
    return createErrorResponse('Mã PIN không hợp lệ', 400);
  }

  const card = await checkGiftCardBalance(cardNumber, pin);

  if (!card) {
    return createErrorResponse('Thẻ quà tặng không tồn tại hoặc đã hết hạn', 404);
  }

  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    return createErrorResponse('Thẻ quà tặng đã hết hạn', 400);
  }

  return createSuccessResponse(
    {
      balance: card.current_balance,
      expiresAt: card.expires_at,
      status: card.status,
    },
    'Kiểm tra số dư thành công'
  );
}

// Rate limit: 10 requests per 60 seconds per IP to prevent brute-force card enumeration
export const POST = withRateLimit(withErrorHandling(balanceHandler), {
  tag: 'gift-card-balance',
  limit: 10,
  windowMs: 60_000,
});
