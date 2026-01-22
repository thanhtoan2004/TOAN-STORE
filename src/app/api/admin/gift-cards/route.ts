import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// Tạo gift card mới (Admin only)
export async function POST(req: NextRequest) {
  try {
    const { amount, quantity = 1 } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Số tiền không hợp lệ' },
        { status: 400 }
      );
    }

    const cards = [];
    
    for (let i = 0; i < quantity; i++) {
      // Generate random 16-digit card number
      const cardNumber = Array.from({ length: 16 }, () => 
        Math.floor(Math.random() * 10)
      ).join('');
      
      // Generate random 4-digit PIN
      const pin = Array.from({ length: 4 }, () => 
        Math.floor(Math.random() * 10)
      ).join('');

      // Set expiry date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await executeQuery(
        `INSERT INTO gift_cards (card_number, pin, initial_balance, current_balance, expires_at, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [cardNumber, pin, amount, amount, expiresAt]
      );

      cards.push({ cardNumber, pin, amount, expiresAt });
    }

    return NextResponse.json({
      success: true,
      message: `Đã tạo ${quantity} thẻ quà tặng thành công`,
      cards
    });
  } catch (error) {
    console.error('Error creating gift cards:', error);
    return NextResponse.json(
      { error: 'Không thể tạo thẻ quà tặng' },
      { status: 500 }
    );
  }
}
