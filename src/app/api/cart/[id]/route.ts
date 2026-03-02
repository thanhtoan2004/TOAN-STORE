import { NextRequest, NextResponse } from 'next/server';
import { removeFromCart, updateCartItemQuantity, executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

// Interface cho Cart Item
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

// PUT - Cập nhật số lượng sản phẩm trong giỏ hàng
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { success: false, message: 'ID không hợp lệ' },
        { status: 400 }
      );
    }

    // Ownership check - join with carts table to get user_id
    const items = await executeQuery(
      'SELECT c.user_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE ci.id = ?',
      [cartItemId]
    ) as any[];

    if (items.length === 0) {
      return NextResponse.json({ success: false, message: 'Sản phẩm không tồn tại' }, { status: 404 });
    }

    if (items[0].user_id !== session.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Số lượng không hợp lệ' },
        { status: 400 }
      );
    }

    // Cập nhật số lượng trong database - PASS userId for security check
    await updateCartItemQuantity(cartItemId, quantity, Number(session.userId));

    // Invalidate cache
    await invalidateCache(`user:cart:${session.userId}`);

    return NextResponse.json({
      success: true,
      message: quantity === 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng' : 'Đã cập nhật số lượng'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật giỏ hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa sản phẩm khỏi giỏ hàng
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { success: false, message: 'ID không hợp lệ' },
        { status: 400 }
      );
    }

    // Ownership check - join with carts table to get user_id
    const items = await executeQuery(
      'SELECT c.user_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE ci.id = ?',
      [cartItemId]
    ) as any[];

    if (items.length === 0) {
      return NextResponse.json({ success: false, message: 'Sản phẩm không tồn tại' }, { status: 404 });
    }

    if (items[0].user_id !== session.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Xóa item từ database - PASS userId for security check
    await removeFromCart(cartItemId, Number(session.userId));

    // Invalidate cache
    await invalidateCache(`user:cart:${session.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng'
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

