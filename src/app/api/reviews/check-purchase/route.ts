import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';

// GET - Check if user has purchased a product
export async function GET(request: NextRequest) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }
        const userId = Number(session.userId);

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                { success: false, message: 'Missing productId' },
                { status: 400 }
            );
        }

        // Check if user has purchased this product
        const purchaseCheck = await executeQuery<any[]>(
            `SELECT DISTINCT o.id, o.order_number, o.placed_at
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? 
         AND oi.product_id = ? 
         AND o.status NOT IN ('cancelled', 'failed')
       ORDER BY o.placed_at DESC
       LIMIT 1`,
            [userId, parseInt(productId)]
        );

        const hasPurchased = purchaseCheck && purchaseCheck.length > 0;

        return NextResponse.json({
            success: true,
            data: {
                hasPurchased,
                purchaseInfo: hasPurchased ? purchaseCheck[0] : null
            }
        });
    } catch (error) {
        console.error('Error checking purchase status:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
