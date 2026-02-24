import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewId, action } = body; // action: 'like' | 'unlike'

        if (!reviewId) {
            return NextResponse.json(
                { success: false, message: 'Missing reviewId' },
                { status: 400 }
            );
        }

        const isUnlike = action === 'unlike';
        const operator = isUnlike ? '-' : '+';

        // Ensure count doesn't go below 0 when unliking
        const query = isUnlike
            ? 'UPDATE product_reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = ?'
            : 'UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?';

        await executeQuery(query, [reviewId]);

        return NextResponse.json({
            success: true,
            message: `Successfully ${isUnlike ? 'unliked' : 'liked'} review`
        });
    } catch (error) {
        console.error('Error updating helpful count:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
