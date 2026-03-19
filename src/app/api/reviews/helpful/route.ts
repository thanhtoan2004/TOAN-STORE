import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productReviews } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Cập nhật lượt "Hữu ích" (Helpful) cho một bài đánh giá.
 * Hỗ trợ các hành động tăng/giảm lượt thích mà không gây giá trị âm.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, action } = body; // action: 'like' | 'unlike'

    if (!reviewId) {
      return ResponseWrapper.error('Missing reviewId', 400);
    }

    const isUnlike = action === 'unlike';

    if (isUnlike) {
      await db
        .update(productReviews)
        .set({
          helpfulCount: sql`GREATEST(0, ${productReviews.helpfulCount} - 1)`,
        })
        .where(eq(productReviews.id, reviewId));
    } else {
      await db
        .update(productReviews)
        .set({
          helpfulCount: sql`${productReviews.helpfulCount} + 1`,
        })
        .where(eq(productReviews.id, reviewId));
    }

    return ResponseWrapper.success(null, `Successfully ${isUnlike ? 'unliked' : 'liked'} review`);
  } catch (error) {
    console.error('Error updating helpful count:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
