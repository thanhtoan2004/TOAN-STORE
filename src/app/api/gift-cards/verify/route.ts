import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { checkGiftCardBalance } from '@/lib/db/mysql';

async function giftcardHandler(req: NextRequest): Promise<NextResponse> {
  const body: any = await req.json();
  const { cardNumber, pin } = body;

  if (!cardNumber || !pin) {
    return createErrorResponse('Thiếu số thẻ hoặc mã PIN', 400);
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
      status: card.status
    },
    'Kiểm tra số dư thành công'
  );
}

export const POST = withErrorHandling(giftcardHandler);
