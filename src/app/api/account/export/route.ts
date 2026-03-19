import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userAddresses,
  orders as ordersTable,
  orderItems,
  productReviews,
  products,
  wishlists,
  wishlistItems,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { decrypt } from '@/lib/security/encryption';

/**
 * API Xuất dữ liệu cá nhân (Personal Data Export - GDPR Compliance).
 * Nhiệm vụ:
 * 1. Thu thập toàn bộ dữ liệu liên quan đến User từ nhiều bảng khác nhau.
 * 2. Giải mã (Decrypt) các thông tin nhạy cảm đã mã hóa trong DB (Phone, Address).
 * 3. Đóng gói thành file JSON và gửi về trình duyệt với header `attachment` để tự động tải về.
 */
export async function GET() {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.userId);

    // 1. Get User Profile and dependent data in parallel
    const [userProfile, addresses, orders, reviews, wishlist] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(userAddresses).where(eq(userAddresses.userId, userId)),
      db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.userId, userId))
        .orderBy(desc(ordersTable.placedAt)),
      db
        .select({
          review: productReviews,
          productName: products.name,
        })
        .from(productReviews)
        .leftJoin(products, eq(productReviews.productId, products.id))
        .where(eq(productReviews.userId, userId)),
      db
        .select({
          item: wishlistItems,
          productName: products.name,
          productSlug: products.slug,
        })
        .from(wishlistItems)
        .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
        .innerJoin(products, eq(wishlistItems.productId, products.id))
        .where(eq(wishlists.userId, userId)),
    ]);

    if (userProfile.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const profile = { ...userProfile[0] };
    // Decrypt profile phone/dob if they were encrypted
    if (profile.phone && profile.phone.includes(':')) {
      try {
        profile.phone = decrypt(profile.phone);
      } catch (e) {}
    }
    if (profile.dateOfBirthEncrypted) {
      try {
        profile.dateOfBirth = decrypt(profile.dateOfBirthEncrypted) as any;
      } catch (e) {}
    }

    // 2. Process Addresses
    const decodedAddresses = addresses.map((addr) => {
      const decoded = { ...addr };
      if (addr.phone && addr.phone.includes(':')) {
        try {
          decoded.phone = decrypt(addr.phone);
        } catch (e) {}
      }
      if (addr.addressLine && addr.addressLine.includes(':')) {
        try {
          decoded.addressLine = decrypt(addr.addressLine);
        } catch (e) {}
      }
      return decoded;
    });

    // 3. Get Order Items for each order
    const orderHistory = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return {
          ...order,
          items,
        };
      })
    );

    // Aggregate all data
    const exportData = {
      exportDate: new Date().toISOString(),
      profile: profile,
      addresses: decodedAddresses,
      orders: orderHistory,
      reviews: reviews.map((r) => ({ ...r.review, productName: r.productName })),
      wishlist: wishlist.map((i) => ({
        ...i.item,
        productName: i.productName,
        productSlug: i.productSlug,
      })),
    };

    // Return as JSON file download
    const dataStr = JSON.stringify(exportData, null, 2);
    const encoder = new TextEncoder();
    const response = new NextResponse(encoder.encode(dataStr));

    response.headers.set('Content-Type', 'application/json');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="toan_personal_data_${userId}.json"`
    );

    return response;
  } catch (error: any) {
    console.error('Error exporting personal data:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi xuất dữ liệu', error: error.message },
      { status: 500 }
    );
  }
}
