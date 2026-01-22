import { NextRequest, NextResponse } from 'next/server';
import { removeFromCart, updateCartItemQuantity } from '@/lib/db/mysql';

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
    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { success: false, message: 'ID không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Số lượng không hợp lệ' },
        { status: 400 }
      );
    }

    // Cập nhật số lượng trong database
    await updateCartItemQuantity(cartItemId, quantity);

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
    const { id } = await params;
    const cartItemId = parseInt(id);

    if (isNaN(cartItemId)) {
      return NextResponse.json(
        { success: false, message: 'ID không hợp lệ' },
        { status: 400 }
      );
    }

    // Xóa item từ database
    await removeFromCart(cartItemId);

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

