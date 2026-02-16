import { NextRequest, NextResponse } from 'next/server';
import { getCart, addToCart, clearCart } from '@/lib/db/mysql';
import { findVariantBySize, checkStock } from '@/lib/db/variants';
import { verifyAuth } from '@/lib/auth';

// GET - Lấy giỏ hàng của user
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.userId;

    // Lấy giỏ hàng từ database
    const cartItems = await getCart(userId);

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

    // Xử lý thêm vào giỏ hàng (Hỗ trợ cả đơn lẻ và hàng loạt)
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.userId;
    const { productId, quantity = 1, size, items } = body;

    // Trường hợp 1: Thêm hàng loạt (Bulk Add - Dùng cho Reorder)
    if (items && Array.isArray(items)) {
      let addedCount = 0;
      let skippedItems = [];

      for (const item of items) {
        const { productId: pId, quantity: qty = 1, size: s } = item;

        if (!pId || !s) {
          console.log(`[Reorder Debug] Skip item due to missing data: pId=${pId}, size=${s}`);
          continue;
        }

        const variant = await findVariantBySize(parseInt(pId), s);
        if (!variant) {
          console.log(`[Reorder Debug] Skip item: Variant not found for pId=${pId}, size=${s}`);
          skippedItems.push({ productId: pId, size: s, reason: 'Size không tồn tại' });
          continue;
        }

        const hasAvailable = await checkStock(variant.id, qty);
        if (!hasAvailable) {
          console.log(`[Reorder Debug] Skip item: Out of stock for variant ${variant.id}`);
          skippedItems.push({ productId: pId, size: s, reason: 'Hết hàng' });
          continue;
        }

        await addToCart(userId, parseInt(pId), s, qty);
        addedCount++;
      }

      if (addedCount === 0 && items.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Không có sản phẩm nào khả dụng để đặt lại (có thể do hết hàng hoặc size không còn tồn tại).',
          skipped: skippedItems
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Đã thêm ${addedCount} sản phẩm vào giỏ hàng.`,
        skipped: skippedItems
      });
    }

    // Trường hợp 2: Thêm đơn lẻ (Single Add)
    if (!productId || !size) {
      return NextResponse.json(
        { success: false, message: 'Thiếu productId hoặc size' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, message: 'Số lượng phải lớn hơn 0' },
        { status: 400 }
      );
    }

    const variant = await findVariantBySize(parseInt(productId), size);
    if (!variant) {
      return NextResponse.json(
        { success: false, message: 'Size không tồn tại' },
        { status: 404 }
      );
    }

    const hasAvailable = await checkStock(variant.id, quantity);
    if (!hasAvailable) {
      return NextResponse.json(
        {
          success: false,
          message: `Sản phẩm này hiện đã hết hàng và không hỗ trợ đặt trước.`,
          available: variant.available
        },
        { status: 400 }
      );
    }

    await addToCart(userId, parseInt(productId), size, quantity);

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
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.userId;

    // Xóa giỏ hàng từ database
    await clearCart(userId);

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