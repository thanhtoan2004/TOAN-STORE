import { NextResponse } from 'next/server';
import { getWishlistItemsWithPriceDrop } from '@/lib/db/repositories/wishlist';
import { sendWishlistSaleEmail } from '@/lib/email-templates';

/**
 * GET /api/cron/wishlist-alerts
 * Lấy tất cả các sản phẩm có trong Wishlist mà giá hiện tại rẻ hơn giá lúc thêm vào.
 * Gửi email thông báo cho User.
 * 
 * Lưu ý: Nên setup endpoint này được gọi tự động mỗi ngày (ví dụ 8h sáng) 
 * bằng Vercel Cron Jobs hoặc tương đương.
 */
export async function GET(request: Request) {
  try {
    // 1. Kiểm tra Vercel Cron Secret (hoặc authorization header) để bảo mật
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    // 2. Fetch data (Chỉ lấy các sản phẩm đang có giá < giá lúc thêm vào và đang active)
    const items = await getWishlistItemsWithPriceDrop();

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, message: 'No price drops found today', count: 0 });
    }

    // 3. Xử lý gửi email (Nhóm theo User để tránh spam nếu 1 user có nhiều sp giảm)
    // Để đơn giản trước mắt, chúng ta có thể gửi riêng từng email, hoặc gộp lại.
    // Vì template sendWishlistSaleEmail chỉ nhận 1 sản phẩm, ta sẽ gửi riêng (hoặc bạn có thể nâng cấp template).

    // Lưu ý: Trong môi trường production, hãy sử dụng Queue (với BullMQ hoặc Upstash) thay vì loop trực tiếp await.
    // Ở đây ta dùng Promise.allSettled để tránh 1 email lỗi làm hỏng toàn bộ cron.

    let sentCount = 0;
    const emailPromises = items.map(async (item) => {
      if (item.email) {
        await sendWishlistSaleEmail(
          item.email,
          item.first_name || 'Bạn',
          item.product_name,
          parseFloat(item.price_when_added),
          parseFloat(item.current_price),
          item.product_id
        );
        sentCount++;
      }
    });

    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      message: 'Price drop alerts processed successfully',
      processed: items.length,
      emailsSent: sentCount
    });

  } catch (error) {
    console.error('Error processing wishlist alerts cron:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
