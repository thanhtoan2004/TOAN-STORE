import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { decrypt } = await import('@/lib/encryption');
    const data = (await executeQuery(
      `SELECT id, card_number, pin, initial_balance, current_balance, status, expires_at, created_at 
       FROM gift_cards ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[]).map(card => ({
      ...card,
      pin: decrypt(card.pin) // Decrypt for Admin view
    }));

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM gift_cards') as any[];
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching gift cards:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { card_number, pin, initial_balance, expires_at } = await request.json();

    const { encrypt } = await import('@/lib/encryption');
    const hashedPin = encrypt(pin);

    const result = await executeQuery(
      'INSERT INTO gift_cards (card_number, pin, initial_balance, current_balance, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [card_number, hashedPin, initial_balance, initial_balance, 'active', expires_at]
    ) as any;

    const giftCardId = result.insertId;

    // Ghi lại giao dịch khởi tạo
    await executeQuery(
      `INSERT INTO gift_card_transactions 
       (gift_card_id, transaction_type, amount, balance_before, balance_after, description)
       VALUES (?, 'purchase', ?, 0, ?, 'Khởi tạo thẻ quà tặng')`,
      [giftCardId, initial_balance, initial_balance]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating gift card:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
