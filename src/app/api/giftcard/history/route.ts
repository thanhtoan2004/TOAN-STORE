import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';

// GET - Lấy lịch sử giao dịch thẻ quà tặng
async function giftcardHistoryHandler(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const cardNumber = searchParams.get('cardNumber');
  const pin = searchParams.get('pin');

  if (!cardNumber || !pin) {
    return createErrorResponse('Thiếu số thẻ hoặc mã PIN', 400);
  }

  // Verify gift card
  const cards = await executeQuery<any[]>(
    `SELECT id, card_number, current_balance, status, expires_at, created_at 
     FROM gift_cards WHERE card_number = ? AND pin = ?`,
    [cardNumber, pin]
  );

  if (!cards || cards.length === 0) {
    return createErrorResponse('Thẻ quà tặng không tồn tại', 404);
  }

  const card = cards[0];

  // Get transaction history
  const transactions = await executeQuery<any[]>(
    `SELECT 
      id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description,
      created_at,
      order_id
     FROM gift_card_transactions 
     WHERE gift_card_id = ? 
     ORDER BY created_at DESC`,
    [card.id]
  );

  return createSuccessResponse(
    {
      card: {
        cardNumber: card.card_number,
        currentBalance: card.current_balance,
        status: card.status,
        expiresAt: card.expires_at,
        createdAt: card.created_at
      },
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.transaction_type,
        amount: t.amount,
        balanceBefore: t.balance_before,
        balanceAfter: t.balance_after,
        description: t.description,
        orderId: t.order_id,
        createdAt: t.created_at
      }))
    },
    'Lấy lịch sử thành công'
  );
}

export const GET = withErrorHandling(giftcardHistoryHandler);
