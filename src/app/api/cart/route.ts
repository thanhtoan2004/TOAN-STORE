import { NextRequest, NextResponse } from 'next/server';
import { getCart, addToCart, clearCart } from '@/lib/db/mysql';
import { findVariantBySize, checkStock } from '@/lib/db/variants';
import { verifyAuth } from '@/lib/auth';
import { withRateLimit } from '@/lib/with-rate-limit';
import { getCache, setCache, invalidateCache } from '@/lib/cache';

// GET - Lấy giỏ hàng của user
/**
 * API Lấy danh sách sản phẩm trong giỏ hàng.
 * Phụ thuộc: session token (verifyAuth).
 * Dữ liệu trả về đã được map chuẩn format UI (Price được ép kiểu Float).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;
    const cacheKey = `user:cart:${userId}`;

    // Try to get from cache
    const cachedCart = await getCache<any[]>(cacheKey);
    if (cachedCart) {
      return NextResponse.json({
        success: true,
        data: cachedCart,
        cached: true,
      });
    }

    // Lấy giỏ hàng từ database
    const cartItems = await getCart(userId);

    // Map to expected format
    const formattedItems = (cartItems as any[]).map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      image: item.image_url,
      price: parseFloat(item.price) || parseFloat(item.item_price) || 0,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      stock: item.available || 0,
    }));

    // Set cache (5 minutes)
    await setCache(cacheKey, formattedItems, 300);

    return NextResponse.json({
      success: true,
      data: formattedItems,
    });
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// DELETE - Xóa toàn bộ giỏ hàng của user
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    // Xóa giỏ hàng từ database
    await clearCart(userId);

    // Invalidate cache
    await invalidateCache(`user:cart:${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng',
    });
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// Export wrapped POST handler with Rate Limit to prevent Gift Card brute-force
export const POST = withRateLimit(
  async function postHandler(request: NextRequest) {
    try {
      const body = await request.json();

      // Xử lý thêm vào giỏ hàng (Hỗ trợ cả đơn lẻ và hàng loạt)
      const session = await verifyAuth();
      if (!session) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      const userId = session.userId;
      const { productId, quantity = 1, size, items } = body;

      // Trường hợp 1: Thêm hàng loạt (Bulk Add - Dùng cho Reorder)
      if (items && Array.isArray(items)) {
        const { bulkAddToCart } = await import('@/lib/db/repositories/cart');
        const results = await bulkAddToCart(userId, items);

        if (results.addedCount > 0) {
          await invalidateCache(`user:cart:${userId}`);
        }

        if (results.addedCount === 0 && items.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message:
                'Không có sản phẩm nào khả dụng để đặt lại (có thể do hết hàng hoặc size không còn tồn tại).',
              skipped: results.skippedItems,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Đã thêm ${results.addedCount} sản phẩm vào giỏ hàng.`,
          skipped: results.skippedItems,
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
            available: variant.available,
          },
          { status: 400 }
        );
      }

      await addToCart(userId, parseInt(productId), size, quantity);

      // Invalidate cache
      await invalidateCache(`user:cart:${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Đã thêm vào giỏ hàng',
      });
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
    }
  },
  {
    tag: 'cart-add',
    limit: 50,
    windowMs: 60 * 1000, // 50 requests per minute for cart operations
  }
);
