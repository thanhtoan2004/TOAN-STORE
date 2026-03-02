import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { decrypt } from '@/lib/encryption';

/**
 * API Xuất dữ liệu cá nhân (Personal Data Export - GDPR Compliance).
 * Nhiệm vụ:
 * 1. Thu thập toàn bộ dữ liệu liên quan đến User từ 5-6 bảng khác nhau.
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

        // 1. Get User Profile
        const userProfile = await executeQuery<any[]>(
            'SELECT email, first_name, last_name, phone, date_of_birth, gender, accumulated_points, membership_tier, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (userProfile.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const profile = userProfile[0];
        // Decrypt profile phone if it was encrypted
        if (profile.phone && profile.phone.includes(':')) {
            try {
                profile.phone = decrypt(profile.phone);
            } catch (e) {
                // Ignore decryption errors
            }
        }

        // 2. Get Addresses
        const userAddresses = await executeQuery<any[]>(
            'SELECT * FROM user_addresses WHERE user_id = ?',
            [userId]
        );

        const decodedAddresses = userAddresses.map(addr => {
            const decoded = { ...addr };
            if (addr.phone && addr.phone.includes(':')) {
                try { decoded.phone = decrypt(addr.phone); } catch (e) { }
            }
            if (addr.address_line && addr.address_line.includes(':')) {
                try { decoded.address_line = decrypt(addr.address_line); } catch (e) { }
            }
            return decoded;
        });

        // 3. Get Orders and Items
        const orders = await executeQuery<any[]>(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC',
            [userId]
        );

        const orderHistory = await Promise.all(orders.map(async (order) => {
            const items = await executeQuery<any[]>(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );
            return {
                ...order,
                items
            };
        }));

        // 4. Get Reviews
        const reviews = await executeQuery<any[]>(
            'SELECT r.*, p.name as product_name FROM product_reviews r JOIN products p ON r.product_id = p.id WHERE r.user_id = ?',
            [userId]
        );

        // 5. Get Wishlist
        const wishlistItems = await executeQuery<any[]>(
            'SELECT wi.*, p.name as product_name, p.slug as product_slug FROM wishlist_items wi JOIN wishlists w ON wi.wishlist_id = w.id JOIN products p ON wi.product_id = p.id WHERE w.user_id = ?',
            [userId]
        );

        // Aggregate all data
        const exportData = {
            export_date: new Date().toISOString(),
            profile: profile,
            addresses: decodedAddresses,
            orders: orderHistory,
            reviews: reviews,
            wishlist: wishlistItems
        };

        // Return as JSON file download
        const dataStr = JSON.stringify(exportData, null, 2);
        const encoder = new TextEncoder();
        const response = new NextResponse(encoder.encode(dataStr));

        response.headers.set('Content-Type', 'application/json');
        response.headers.set('Content-Disposition', `attachment; filename="toan_personal_data_${userId}.json"`);

        return response;

    } catch (error: any) {
        console.error('Error exporting personal data:', error);
        return NextResponse.json(
            { message: 'Có lỗi xảy ra khi xuất dữ liệu', error: error.message },
            { status: 500 }
        );
    }
}
