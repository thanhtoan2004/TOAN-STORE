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

// Lấy wishlist
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Thiếu userId' },
      { status: 400 }
    );
  }

  try {
    const wishlist = await getWishlist(userId);
    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy wishlist' },
      { status: 500 }
    );
  }
}

// Thêm vào wishlist
export async function POST(request: Request) {
  const { userId, productId } = await request.json();

  if (!userId || !productId) {
    return NextResponse.json(
      { error: 'Thiếu userId hoặc productId' },
      { status: 400 }
    );
  }

  try {
    await addToWishlist(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi thêm vào wishlist:', error);
    return NextResponse.json(
      { error: 'Lỗi khi thêm vào wishlist' },
      { status: 500 }
    );
  }
}

// Xóa khỏi wishlist
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  const productId = Number(searchParams.get('productId'));

  if (!userId || !productId) {
    return NextResponse.json(
      { error: 'Thiếu userId hoặc productId' },
      { status: 400 }
    );
  }

  try {
    await removeFromWishlist(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi xóa khỏi wishlist:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa khỏi wishlist' },
      { status: 500 }
    );
  }
}