import { NextRequest } from 'next/server';
import { getCart, addToCart, clearCart } from '@/lib/db/mysql';
import { findVariantBySize, checkStock } from '@/lib/db/variants';
import { verifyAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { getCache, setCache, invalidateCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

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
      return ResponseWrapper.unauthorized();
    }
    const userId = session.userId;
    const cacheKey = `user:cart:${userId}`;

    // Try to get from cache
    const cachedCart = await getCache<any[]>(cacheKey);
    if (cachedCart) {
      return ResponseWrapper.success(cachedCart, undefined, 200, { cached: true });
    }

    // Lấy giỏ hàng từ database
    const cartItems = await getCart(userId);

    // Map to expected format
    const formattedItems = (cartItems as any[]).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      image: item.imageUrl || '/placeholder.png',
      price: parseFloat(item.price) || parseFloat(item.itemPrice) || 0,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      stock: item.available || 0,
    }));

    // Set cache (5 minutes)
    await setCache(cacheKey, formattedItems, 300);

    return ResponseWrapper.success(formattedItems);
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// DELETE - Xóa toàn bộ giỏ hàng của user
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = session.userId;

    // Xóa giỏ hàng từ database
    await clearCart(userId);

    // Invalidate cache
    await invalidateCache(`user:cart:${userId}`);

    return ResponseWrapper.success(null, 'Đã xóa tất cả sản phẩm khỏi giỏ hàng');
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// Export wrapped POST handler with Rate Limit to prevent Gift Card brute-force
export const POST = withRateLimit(
  async function postHandler(request: NextRequest) {
    try {
      const body = await request.json();

      // Xử lý thêm vào giỏ hàng (Hỗ trợ cả đơn lẻ và hàng loạt)
      const session = await verifyAuth();
      if (!session) return ResponseWrapper.unauthorized();
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
          return ResponseWrapper.error(
            'Không có sản phẩm nào khả dụng để đặt lại (có thể do hết hàng hoặc size không còn tồn tại).',
            400,
            { skipped: results.skippedItems }
          );
        }

        return ResponseWrapper.success(
          { skipped: results.skippedItems },
          `Đã thêm ${results.addedCount} sản phẩm vào giỏ hàng.`
        );
      }

      // Trường hợp 2: Thêm đơn lẻ (Single Add)
      if (!productId || !size) {
        return ResponseWrapper.error('Thiếu productId hoặc size', 400);
      }

      if (quantity < 1) {
        return ResponseWrapper.error('Số lượng phải lớn hơn 0', 400);
      }

      const variant = await findVariantBySize(parseInt(productId), size);
      if (!variant) {
        return ResponseWrapper.error('Size không tồn tại', 404);
      }

      const hasAvailable = await checkStock(variant.id, quantity);
      if (!hasAvailable) {
        return ResponseWrapper.error(
          `Sản phẩm này hiện đã hết hàng và không hỗ trợ đặt trước.`,
          400,
          { available: variant.available }
        );
      }

      await addToCart(userId, parseInt(productId), size, quantity);

      // Invalidate cache
      await invalidateCache(`user:cart:${userId}`);

      return ResponseWrapper.success(null, 'Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      return ResponseWrapper.serverError('Lỗi server nội bộ', error);
    }
  },
  {
    tag: 'cart-add',
    limit: 50,
    windowMs: 60 * 1000, // 50 requests per minute for cart operations
  }
);
