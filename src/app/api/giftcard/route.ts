import { NextResponse } from 'next/server';
import { checkGiftCardBalance } from '@/lib/db/mysql';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cardNumber, pin } = body;

    if (!cardNumber || !pin) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin thẻ quà tặng' },
        { status: 400 }
      );
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      return NextResponse.json(
        { success: false, message: 'Số thẻ quà tặng không hợp lệ' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: 'Mã PIN không hợp lệ' },
        { status: 400 }
      );
    }

    const card = await checkGiftCardBalance(cardNumber, pin);
    
    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Thẻ quà tặng không tồn tại hoặc đã hết hạn' },
        { status: 404 }
      );
    }

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Thẻ quà tặng đã hết hạn' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kiểm tra số dư thành công',
      data: {
        cardNumber: cardNumber,
        balance: card.current_balance,
        expiresAt: card.expires_at,
        status: card.status
      }
    });
  } catch (error) {
    console.error('Lỗi kiểm tra gift card:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
