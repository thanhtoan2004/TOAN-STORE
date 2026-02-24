import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { sendAbandonedCartEmail } from '@/lib/email-templates';

/**
 * Cron Job: Gửi Email nhắc nhở giỏ hàng bị bỏ quên (Abandoned Cart).
 * Tần suất: Chạy định kỳ (ví dụ: mỗi 1 giờ).
 * Logic: Tìm các giỏ hàng không hoạt động từ 24h - 72h và gửi email khuyến khích hoàn tất đơn hàng.
 * Bảo mật: Yêu cầu CRON_SECRET trong Header Authorization.
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Security: ALWAYS require CRON_SECRET
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find carts inactive for > 24 hours that have items and belong to active users
        const abandonedCarts = await executeQuery<any[]>(`
            SELECT 
                c.id as cart_id,
                c.user_id,
                c.updated_at,
                u.email,
                u.first_name,
                COUNT(ci.id) as item_count,
                SUM(ci.quantity * ci.price) as cart_total,
                GROUP_CONCAT(
                    CONCAT(p.name, ' (', ci.quantity, ')')
                    ORDER BY ci.created_at DESC
                    SEPARATOR ', '
                ) as product_names
            FROM carts c
            JOIN cart_items ci ON ci.cart_id = c.id
            JOIN users u ON u.id = c.user_id
            JOIN products p ON p.id = ci.product_id
            WHERE c.updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
              AND c.updated_at > DATE_SUB(NOW(), INTERVAL 72 HOUR)
              AND u.is_active = 1
              AND u.is_banned = 0
              AND u.deleted_at IS NULL
            GROUP BY c.id, c.user_id, c.updated_at, u.email, u.first_name
            HAVING item_count > 0
            LIMIT 50
        `);

        let sentCount = 0;

        for (const cart of abandonedCarts) {
            try {
                await sendAbandonedCartEmail(
                    cart.email,
                    cart.first_name || 'Bạn',
                    cart.item_count,
                    cart.cart_total,
                    cart.product_names
                );
                sentCount++;
            } catch (emailErr) {
                console.error(`Failed to send abandoned cart email to ${cart.email}:`, emailErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} abandoned cart emails out of ${abandonedCarts.length} found.`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Abandoned cart cron error:', error);
        return NextResponse.json({
            success: false,
            message: 'Abandoned cart cron failed'
        }, { status: 500 });
    }
}
