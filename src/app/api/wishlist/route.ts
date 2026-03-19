import { db } from '@/lib/db/drizzle';
import { cartItems as cartItemsTable, carts as cartsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/lib/db/repositories/wishlist';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET - Lấy wishlist
export async function GET(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const wishlist = await getWishlist(userId);
    return ResponseWrapper.success(wishlist);
  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    return ResponseWrapper.serverError('Lỗi khi lấy wishlist', error);
  }
}

// POST - Thêm vào wishlist
export async function POST(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const { productId } = await request.json();

    if (!productId) {
      return ResponseWrapper.error('Thiếu productId', 400);
    }

    await addToWishlist(userId, productId);
    return ResponseWrapper.success(null, 'Đã thêm vào danh sách yêu thích');
  } catch (error) {
    console.error('Lỗi thêm vào wishlist:', error);
    return ResponseWrapper.serverError('Lỗi khi thêm vào wishlist', error);
  }
}

// DELETE - Xóa khỏi wishlist
export async function DELETE(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get('productId'));

    if (!productId) {
      return ResponseWrapper.error('Thiếu productId', 400);
    }

    await removeFromWishlist(userId, productId);
    return ResponseWrapper.success(null, 'Đã xóa khỏi danh sách yêu thích');
  } catch (error) {
    console.error('Lỗi xóa khỏi wishlist:', error);
    return ResponseWrapper.serverError('Lỗi khi xóa khỏi wishlist', error);
  }
}
