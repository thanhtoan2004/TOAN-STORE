// import { NextResponse } from "next/server";
// import { executeQuery } from "@/lib/db/mysql"; // Import executeQuery

// export async function POST(req: Request) {
//   const { userId, productId } = await req.json();

//   try {
//     await executeQuery(
//       "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)",
//       [userId, productId]
//     );
//     return NextResponse.json({ message: "Đã thêm vào danh sách yêu thích" }, { status: 201 });
//   } catch (error) {
//     return NextResponse.json({ error: "Lỗi thêm vào danh sách yêu thích" }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     const wishlistItems = await executeQuery("SELECT * FROM wishlist");
//     return NextResponse.json(wishlistItems);
//   } catch (error) {
//     return NextResponse.json({ error: "Lỗi lấy dữ liệu wishlist" }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';

// Lấy wishlist
/**
 * API Lấy danh sách sản phẩm yêu thích (Wishlist) của User.
 */
export async function GET(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.userId);

    const wishlist = await getWishlist(userId);
    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy wishlist' }, { status: 500 });
  }
}

// Thêm vào wishlist
/**
 * API Thêm sản phẩm vào Wishlist.
 * Nếu sản phẩm đã tồn tại thì DB sẽ bỏ qua (duplication check).
 */
export async function POST(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.userId);

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Thiếu productId' }, { status: 400 });
    }

    await addToWishlist(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi thêm vào wishlist:', error);
    return NextResponse.json({ error: 'Lỗi khi thêm vào wishlist' }, { status: 500 });
  }
}

// Xóa khỏi wishlist
/**
 * API Xóa sản phẩm khỏi Wishlist.
 * Sử dụng `productId` từ query string.
 */
export async function DELETE(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = Number(session.userId);

    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get('productId'));

    if (!productId) {
      return NextResponse.json({ error: 'Thiếu productId' }, { status: 400 });
    }

    await removeFromWishlist(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi xóa khỏi wishlist:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa khỏi wishlist' }, { status: 500 });
  }
}
