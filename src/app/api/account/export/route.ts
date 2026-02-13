import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { getUserAddresses } from '@/lib/db/repositories/user';
import { getOrdersByUserId, getOrderByNumber } from '@/lib/db/repositories/order';
import { decrypt } from '@/lib/encryption';

/**
 * GET /api/account/export - Export all user data (GDPR Compliance)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // 1. Get User Profile
        const users: any = await executeQuery(
            'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const user = users[0];
        const profile = {
            ...user,
            phone: decrypt(user.phone)
        };

        // 2. Get Addresses
        const addresses = await getUserAddresses(userId);

        // 3. Get Orders
        const basicOrders: any = await getOrdersByUserId(userId);
        const fullOrders = [];

        // Fetch details for each order (to get items and decrypted info)
        for (const order of basicOrders) {
            const detail = await getOrderByNumber(order.order_number);
            if (detail && detail.length > 0) {
                fullOrders.push(detail[0]);
            }
        }

        // 4. Combine data
        const exportData = {
            export_date: new Date().toISOString(),
            profile,
            addresses,
            orders: fullOrders
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="nike_clone_data_export_${userId}.json"`
            }
        });

    } catch (error) {
        console.error('Data export error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
