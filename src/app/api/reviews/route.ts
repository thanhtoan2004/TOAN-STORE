import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// GET - Lấy danh sách reviews của sản phẩm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get('productId');
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Nếu là admin call (có status param), lấy all reviews
    if (statusParam && !productIdStr) {
      const status = statusParam || 'pending';
      const reviews = await executeQuery<any[]>(
        `SELECT r.*, u.full_name as user_name, p.name as product_name
         FROM product_reviews r
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE r.status = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      );

      const countResult = await executeQuery<any[]>(
        'SELECT COUNT(*) as total FROM product_reviews WHERE status = ?',
        [status]
      );

      const total = countResult[0]?.total || 0;

      return NextResponse.json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // Nếu là product reviews (productId)
    if (!productIdStr) {
      return NextResponse.json(
        { success: false, message: 'Thiếu productId' },
        { status: 400 }
      );
    }

    const productId = parseInt(productIdStr);

    // Get reviews from database
    const reviews = await executeQuery<any[]>(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.admin_reply, r.created_at, u.full_name as user_name, u.email as user_email
       FROM product_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    // Get total count
    const countResult = await executeQuery<any[]>(
      'SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ? AND status = "approved"',
      [productId]
    );

    const total = countResult[0]?.total || 0;

    // Get rating statistics
    const stats = await executeQuery<any[]>(
      `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_reviews,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM product_reviews 
       WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    // Handle null values and convert to numbers
    const rawStats = stats[0] || {};
    const statistics = {
      average_rating: parseFloat(rawStats.average_rating) || 0,
      total_reviews: parseInt(rawStats.total_reviews) || 0,
      five_star: parseInt(rawStats.five_star) || 0,
      four_star: parseInt(rawStats.four_star) || 0,
      three_star: parseInt(rawStats.three_star) || 0,
      two_star: parseInt(rawStats.two_star) || 0,
      one_star: parseInt(rawStats.one_star) || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        statistics,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy reviews:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// POST - Tạo review mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, rating, title, comment } = body;

    // Validate
    if (!userId || !productId || !rating) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating phải từ 1-5' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product
    const existing = await executeQuery<any[]>(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
      [parseInt(userId), parseInt(productId)]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' },
        { status: 400 }
      );
    }

    // Insert review
    await executeQuery(
      `INSERT INTO product_reviews (user_id, product_id, rating, title, comment, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [parseInt(userId), parseInt(productId), rating, title || '', comment || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Đánh giá của bạn đang chờ duyệt'
    });
  } catch (error) {
    console.error('Lỗi khi tạo review:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật review
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, userId, rating, title, comment } = body;

    // Validate
    if (!reviewId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu reviewId hoặc userId' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, message: 'Rating phải từ 1-5' },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to user
    const existing = await executeQuery<any[]>(
      'SELECT id, user_id FROM product_reviews WHERE id = ?',
      [parseInt(reviewId)]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đánh giá' },
        { status: 404 }
      );
    }

    if (existing[0].user_id !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền sửa đánh giá này' },
        { status: 403 }
      );
    }

    // Update review - set status back to pending for re-approval
    await executeQuery(
      `UPDATE product_reviews 
       SET rating = ?, title = ?, comment = ?, status = 'pending', updated_at = NOW()
       WHERE id = ?`,
      [rating, title || '', comment || '', parseInt(reviewId)]
    );

    return NextResponse.json({
      success: true,
      message: 'Đánh giá đã được cập nhật và đang chờ duyệt lại'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật review:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const userId = searchParams.get('userId');

    // Validate
    if (!reviewId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu reviewId hoặc userId' },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to user
    const existing = await executeQuery<any[]>(
      'SELECT id, user_id FROM product_reviews WHERE id = ?',
      [parseInt(reviewId)]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đánh giá' },
        { status: 404 }
      );
    }

    if (existing[0].user_id !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền xóa đánh giá này' },
        { status: 403 }
      );
    }

    // Delete review
    await executeQuery(
      'DELETE FROM product_reviews WHERE id = ?',
      [parseInt(reviewId)]
    );

    return NextResponse.json({
      success: true,
      message: 'Đánh giá đã được xóa'
    });
  } catch (error) {
    console.error('Lỗi khi xóa review:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
