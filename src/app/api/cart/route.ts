import { NextRequest, NextResponse } from 'next/server';
import { getCart, addToCart, clearCart } from '@/lib/db/mysql';
import { findVariantBySize, checkStock } from '@/lib/db/variants';

// GET - Lấy giỏ hàng của user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId' },
        { status: 400 }
      );
    }

    // Lấy giỏ hàng từ database
    const cartItems = await getCart(parseInt(userId));

    // Map to expected format
    const formattedItems = (cartItems as any[]).map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      image: item.image_url,
      price: parseFloat(item.price) || parseFloat(item.item_price) || 0,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      stock: item.available || 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// POST - Thêm sản phẩm vào giỏ hàng HOẶC kiểm tra số dư gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Nếu có cardNumber và pin => check gift card balance
    if (body.cardNumber && body.pin) {
      const { cardNumber, pin } = body;

      // Validate gift card
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

      // Import checkGiftCardBalance
      const { checkGiftCardBalance } = await import('@/lib/db/mysql');
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
          balance: card.current_balance,
          expiresAt: card.expires_at,
          status: card.status
        }
      });
    }

    // Xử lý thêm vào giỏ hàng bình thường
    const { userId, productId, quantity = 1, size } = body;

    // Validate dữ liệu đầu vào
    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId hoặc productId' },
        { status: 400 }
      );
    }

    if (!size) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn size' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, message: 'Số lượng phải lớn hơn 0' },
        { status: 400 }
      );
    }

    // Find the product variant by size
    const variant = await findVariantBySize(parseInt(productId), size);

    if (!variant) {
      return NextResponse.json(
        { success: false, message: 'Size không tồn tại' },
        { status: 404 }
      );
    }

    // Check stock availability
    const hasStock = await checkStock(variant.id, quantity);

    if (!hasStock) {
      return NextResponse.json(
        {
          success: false,
          message: `Không đủ hàng. Chỉ còn ${variant.available} sản phẩm`,
          available: variant.available
        },
        { status: 400 }
      );
    }

    // Thêm vào giỏ hàng trong database
    await addToCart(parseInt(userId), parseInt(productId), size, quantity);

    return NextResponse.json({
      success: true,
      message: 'Đã thêm vào giỏ hàng'
    });
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa toàn bộ giỏ hàng của user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId' },
        { status: 400 }
      );
    }

    // Xóa giỏ hàng từ database
    await clearCart(parseInt(userId));

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}