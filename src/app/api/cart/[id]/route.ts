import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { cartItems as cartItemsTable, carts as cartsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { removeFromCart, updateCartItemQuantity } from '@/lib/db/repositories/cart';
import { verifyAuth } from '@/lib/auth/auth';
import { invalidateCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Interface cho Cart Item
 */
interface CartItem {
  id: number;
  productId: number;
  userId: number;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  stock: number;
}

/**
 * PUT - Cập nhật số lượng sản phẩm trong giỏ hàng.
 * Bảo mật:
 * - Kiểm tra quyền sở hữu (Ownership check) để đảm bảo User chỉ sửa được giỏ hàng của mình.
 * - Invalidate cache sau khi cập nhật để đảm bảo tính nhất quán dữ liệu.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return ResponseWrapper.error('ID không hợp lệ', 400);
    }

    // Ownership check
    const [item] = await db
      .select({ userId: cartsTable.userId })
      .from(cartItemsTable)
      .innerJoin(cartsTable, eq(cartItemsTable.cartId, cartsTable.id))
      .where(eq(cartItemsTable.id, cartItemId))
      .limit(1);

    if (!item) {
      return ResponseWrapper.notFound('Sản phẩm không tồn tại trong giỏ hàng');
    }

    if (item.userId !== Number(session.userId)) {
      return ResponseWrapper.forbidden();
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 0) {
      return ResponseWrapper.error('Số lượng không hợp lệ', 400);
    }

    // Cập nhật số lượng
    await updateCartItemQuantity(cartItemId, quantity, Number(session.userId));

    // Invalidate cache
    await invalidateCache(`user:cart:${session.userId}`);

    return ResponseWrapper.success(
      null,
      quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật số lượng'
    );
  } catch (error) {
    console.error('Lỗi khi cập nhật giỏ hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * DELETE - Xóa vĩnh viễn sản phẩm khỏi giỏ hàng.
 * Bảo mật:
 * - Kiểm tra quyền sở hữu.
 * - Invalidate cache cục bộ cho người dùng.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return ResponseWrapper.error('ID không hợp lệ', 400);
    }

    // Ownership check
    const [item] = await db
      .select({ userId: cartsTable.userId })
      .from(cartItemsTable)
      .innerJoin(cartsTable, eq(cartItemsTable.cartId, cartsTable.id))
      .where(eq(cartItemsTable.id, cartItemId))
      .limit(1);

    if (!item) {
      return ResponseWrapper.notFound('Sản phẩm không tồn tại trong giỏ hàng');
    }

    if (item.userId !== Number(session.userId)) {
      return ResponseWrapper.forbidden();
    }

    // Xóa item
    await removeFromCart(cartItemId, Number(session.userId));

    // Invalidate cache
    await invalidateCache(`user:cart:${session.userId}`);

    return ResponseWrapper.success(null, 'Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
