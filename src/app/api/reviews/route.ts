import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  productReviews,
  users as usersTable,
  products as productsTable,
  productImages,
  reviewMedia,
  orders as ordersTable,
  orderItems,
} from '@/lib/db/schema';
import { eq, and, sql, desc, count, inArray, isNull, avg, sum } from 'drizzle-orm';
import { checkAdminAuth, verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

export const dynamic = 'force-dynamic';

// GET - Lấy danh sách reviews của sản phẩm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get('productId');
    const statusParam = searchParams.get('status');
    const sortParam = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Admin view
    if (statusParam && !productIdStr) {
      const admin = await checkAdminAuth();
      if (!admin) {
        return ResponseWrapper.unauthorized();
      }

      const status = (statusParam || 'pending') as any;

      const reviews = await db
        .select({
          id: productReviews.id,
          product_id: productReviews.productId,
          user_id: productReviews.userId,
          rating: productReviews.rating,
          title: productReviews.title,
          comment: productReviews.comment,
          status: productReviews.status,
          admin_reply: productReviews.adminReply,
          is_verified_purchase: productReviews.isVerifiedPurchase,
          helpful_count: productReviews.helpfulCount,
          created_at: productReviews.createdAt,
          user_name: sql<string>`COALESCE(TRIM(CONCAT(COALESCE(${usersTable.firstName}, ''), ' ', COALESCE(${usersTable.lastName}, ''))), ${usersTable.fullName}, 'User')`,
          user_avatar: usersTable.avatarUrl,
          product_name: productsTable.name,
          product_image: productImages.url,
        })
        .from(productReviews)
        .leftJoin(usersTable, eq(productReviews.userId, usersTable.id))
        .leftJoin(productsTable, eq(productReviews.productId, productsTable.id))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, productsTable.id), eq(productImages.isMain, 1))
        )
        .where(eq(productReviews.status, status))
        .orderBy(desc(productReviews.createdAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ total: count() })
        .from(productReviews)
        .where(eq(productReviews.status, status));

      const total = countResult?.total || 0;

      // Batch media query
      if (reviews.length > 0) {
        const reviewIds = reviews.map((r) => r.id);
        const allMedia = await db
          .select({
            id: reviewMedia.id,
            review_id: reviewMedia.reviewId,
            media_url: reviewMedia.mediaUrl,
            media_type: reviewMedia.mediaType,
            position: reviewMedia.position,
            file_size: reviewMedia.fileSize,
          })
          .from(reviewMedia)
          .where(inArray(reviewMedia.reviewId, reviewIds))
          .orderBy(reviewMedia.position);

        const mediaMap = new Map<number, any[]>();
        allMedia.forEach((m) => {
          if (!mediaMap.has(m.review_id!)) mediaMap.set(m.review_id!, []);
          mediaMap.get(m.review_id!)!.push(m);
        });
        reviews.forEach((r: any) => {
          r.media = mediaMap.get(r.id) || [];
        });
      }

      return ResponseWrapper.success(reviews, undefined, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Product reviews
    if (!productIdStr) {
      return ResponseWrapper.error('Thiếu productId', 400);
    }

    const productId = parseInt(productIdStr);
    if (isNaN(productId)) {
      return ResponseWrapper.error('Invalid productId', 400);
    }

    const ordersMap: { [key: string]: any } = {
      highest: desc(productReviews.rating),
      lowest: productReviews.rating,
      newest: desc(productReviews.createdAt),
    };
    const finalOrder = ordersMap[sortParam] || desc(productReviews.createdAt);

    const ratingFilter = searchParams.get('rating');
    const ratingValue = ratingFilter ? parseInt(ratingFilter) : null;

    const conditions = [
      eq(productReviews.productId, productId),
      eq(productReviews.status, 'approved'),
    ];

    if (ratingValue && ratingValue >= 1 && ratingValue <= 5) {
      conditions.push(eq(productReviews.rating, ratingValue));
    }

    const reviews = await db
      .select({
        id: productReviews.id,
        product_id: productReviews.productId,
        user_id: productReviews.userId,
        rating: productReviews.rating,
        title: productReviews.title,
        comment: productReviews.comment,
        admin_reply: productReviews.adminReply,
        created_at: productReviews.createdAt,
        is_verified_purchase: productReviews.isVerifiedPurchase,
        helpful_count: productReviews.helpfulCount,
        user_name: sql<string>`COALESCE(TRIM(CONCAT(COALESCE(${usersTable.firstName}, ''), ' ', COALESCE(${usersTable.lastName}, ''))), ${usersTable.fullName}, 'User')`,
        user_email: usersTable.email,
        user_avatar: usersTable.avatarUrl,
      })
      .from(productReviews)
      .leftJoin(usersTable, eq(productReviews.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(finalOrder)
      .limit(limit)
      .offset(offset);

    // Batch media query
    if (reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id);
      const allMedia = await db
        .select({
          id: reviewMedia.id,
          review_id: reviewMedia.reviewId,
          media_url: reviewMedia.mediaUrl,
          media_type: reviewMedia.mediaType,
          position: reviewMedia.position,
          file_size: reviewMedia.fileSize,
        })
        .from(reviewMedia)
        .where(inArray(reviewMedia.reviewId, reviewIds))
        .orderBy(reviewMedia.position);

      const mediaMap = new Map<number, any[]>();
      allMedia.forEach((m) => {
        if (!mediaMap.has(m.review_id!)) mediaMap.set(m.review_id!, []);
        mediaMap.get(m.review_id!)!.push(m);
      });
      reviews.forEach((r: any) => {
        r.media = mediaMap.get(r.id) || [];
      });
    }

    const [countResult] = await db
      .select({ total: count() })
      .from(productReviews)
      .where(and(...conditions));

    const total = countResult?.total || 0;

    // Statistics
    const statsResult = await db
      .select({
        averageRating: avg(productReviews.rating),
        totalReviews: count(),
        fiveStar: sql<number>`SUM(CASE WHEN ${productReviews.rating} = 5 THEN 1 ELSE 0 END)`,
        fourStar: sql<number>`SUM(CASE WHEN ${productReviews.rating} = 4 THEN 1 ELSE 0 END)`,
        threeStar: sql<number>`SUM(CASE WHEN ${productReviews.rating} = 3 THEN 1 ELSE 0 END)`,
        twoStar: sql<number>`SUM(CASE WHEN ${productReviews.rating} = 2 THEN 1 ELSE 0 END)`,
        oneStar: sql<number>`SUM(CASE WHEN ${productReviews.rating} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.status, 'approved')));

    const rawStats = statsResult[0] || {};
    const statistics = {
      averageRating: parseFloat(rawStats.averageRating || '0'),
      totalReviews: Number(rawStats.totalReviews || 0),
      fiveStar: Number(rawStats.fiveStar || 0),
      fourStar: Number(rawStats.fourStar || 0),
      threeStar: Number(rawStats.threeStar || 0),
      twoStar: Number(rawStats.twoStar || 0),
      oneStar: Number(rawStats.oneStar || 0),
    };

    const responseData = {
      reviews,
      statistics,
    };

    return ResponseWrapper.success(responseData, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Lỗi khi lấy reviews:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// POST - Tạo review mới
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const body = await request.json();
    const { productId, rating, title, comment, media } = body;

    // Validate
    if (!productId || !rating) {
      return ResponseWrapper.error('Thiếu thông tin bắt buộc', 400);
    }

    // Check if user has purchased this product
    const purchaseResult = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .innerJoin(orderItems, eq(ordersTable.id, orderItems.orderId))
      .where(
        and(
          eq(ordersTable.userId, userId),
          eq(orderItems.productId, parseInt(productId)),
          sql`${ordersTable.status} NOT IN ('cancelled', 'failed')`
        )
      )
      .limit(1);

    const hasPurchased = purchaseResult.length > 0;

    if (!hasPurchased) {
      return ResponseWrapper.error('Bạn cần mua sản phẩm này trước khi có thể đánh giá', 403);
    }

    const existingReview = await db
      .select({ id: productReviews.id })
      .from(productReviews)
      .where(
        and(eq(productReviews.userId, userId), eq(productReviews.productId, parseInt(productId)))
      )
      .limit(1);

    if (existingReview.length > 0) {
      return ResponseWrapper.error('Bạn đã đánh giá sản phẩm này rồi', 400);
    }

    // Use transaction for Review + Media
    const reviewId = await db.transaction(async (tx) => {
      const [insertResult] = await tx.insert(productReviews).values({
        userId,
        productId: parseInt(productId),
        rating,
        title: title || '',
        comment: comment || '',
        status: 'pending',
        isVerifiedPurchase: 1,
      });

      const rId = (insertResult as any).insertId;

      if (media && Array.isArray(media)) {
        const mediaValues = media
          .filter((m) => m.url && m.type)
          .map((m, i) => ({
            reviewId: rId,
            mediaUrl: m.url,
            mediaType: m.type,
            position: i,
            fileSize: m.size || 0,
          }));

        if (mediaValues.length > 0) {
          await tx.insert(reviewMedia).values(mediaValues);
        }
      }
      return rId;
    });

    return ResponseWrapper.success({ reviewId }, 'Đánh giá của bạn đang chờ duyệt');
  } catch (error) {
    console.error('Lỗi khi tạo review:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// PUT - Cập nhật review
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, rating, title, comment, id, status } = body;

    // Admin side
    if (id && status) {
      const isAdmin = await checkAdminAuth();
      if (!isAdmin) {
        return ResponseWrapper.unauthorized();
      }

      await db
        .update(productReviews)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(productReviews.id, parseInt(id)));

      return ResponseWrapper.success(null, 'Cập nhật trạng thái thành công');
    }

    // User side
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const [existing] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, parseInt(reviewId)))
      .limit(1);

    if (!existing) {
      return ResponseWrapper.error('Không tìm thấy đánh giá', 404);
    }

    if (existing.userId !== userId) {
      return ResponseWrapper.error('Bạn không có quyền sửa đánh giá này', 403);
    }

    await db
      .update(productReviews)
      .set({
        rating,
        title: title || '',
        comment: comment || '',
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(productReviews.id, parseInt(reviewId)));

    return ResponseWrapper.success(null, 'Đánh giá đã được cập nhật và đang chờ duyệt lại');
  } catch (error) {
    console.error('Lỗi khi cập nhật review:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// DELETE - Xóa review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId') || searchParams.get('id');

    if (!reviewId) {
      return ResponseWrapper.error('Thiếu reviewId', 400);
    }

    const isAdmin = await checkAdminAuth();
    const session = await verifyAuth();
    const userId = session ? Number(session.userId) : null;

    const [existing] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, parseInt(reviewId)))
      .limit(1);

    if (!existing) {
      return ResponseWrapper.error('Không tìm thấy đánh giá', 404);
    }

    if (!isAdmin && (!userId || existing.userId !== userId)) {
      return ResponseWrapper.error('Bạn không có quyền xóa đánh giá này', 403);
    }

    // Atomic delete Review + Media
    await db.transaction(async (tx) => {
      await tx.delete(reviewMedia).where(eq(reviewMedia.reviewId, parseInt(reviewId)));
      await tx.delete(productReviews).where(eq(productReviews.id, parseInt(reviewId)));
    });

    return ResponseWrapper.success(null, 'Đánh giá đã được xóa');
  } catch (error) {
    console.error('Lỗi khi xóa review:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
