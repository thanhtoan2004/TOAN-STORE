import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productReviews, reviewMedia } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Tải lên tệp tin (Hình ảnh/Video) cho đánh giá sản phẩm (Lưu trữ cục bộ).
 * Chức năng:
 * 1. Kiểm tra mã đánh giá bài viết (reviewId).
 * 2. Validate định dạng tệp và dung lượng (Ảnh 5MB, Video 50MB).
 * 3. Lưu trữ tệp tin vào thư mục /public/uploads/reviews.
 * 4. Lưu thông tin tệp tin vào cơ sở dữ liệu.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const reviewId = formData.get('reviewId') as string;
    const files = formData.getAll('media') as File[];

    if (!reviewId) {
      return ResponseWrapper.error('Missing reviewId', 400);
    }

    if (!files || files.length === 0) {
      return ResponseWrapper.error('No files provided', 400);
    }

    // Verify review exists
    const [review] = await db
      .select({ id: productReviews.id })
      .from(productReviews)
      .where(eq(productReviews.id, parseInt(reviewId)))
      .limit(1);

    if (!review) {
      return ResponseWrapper.notFound('Review not found');
    }

    const uploadedMedia = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reviews');

    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // Validate file
      const validationResult = validateFile(file);
      if (!validationResult.valid) {
        return ResponseWrapper.error(validationResult.error!, 400);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const ext = path.extname(file.name);
      const filename = `review_${reviewId}_${timestamp}_${randomString}${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Determine media type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      const mediaUrl = `/uploads/reviews/${filename}`;

      // Insert into database
      await db.insert(reviewMedia).values({
        reviewId: parseInt(reviewId),
        mediaType: mediaType as any,
        mediaUrl: mediaUrl,
        fileSize: file.size,
        mimeType: file.type,
        position: uploadedMedia.length,
      });

      uploadedMedia.push({
        url: mediaUrl,
        type: mediaType,
        size: file.size,
      });
    }

    return ResponseWrapper.success(uploadedMedia, 'Media uploaded successfully');
  } catch (error) {
    console.error('Error uploading media:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// Helper function to validate file
function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  const isImage = allowedImageTypes.includes(file.type);
  const isVideo = allowedVideoTypes.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: JPG, PNG, WEBP, MP4, WEBM',
    };
  }

  // Double extension check (e.g., image.png.php)
  const nameParts = file.name.split('.');
  if (nameParts.length > 2) {
    return {
      valid: false,
      error: 'Security alert: Multiple extensions detected',
    };
  }

  // Explicitly block SVG just in case (as it can contain XML/Script)
  if (file.name.toLowerCase().endsWith('.svg') || file.type.includes('svg')) {
    return {
      valid: false,
      error: 'SVG files are not allowed for security reasons',
    };
  }

  if (isImage && file.size > maxImageSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB',
    };
  }

  if (isVideo && file.size > maxVideoSize) {
    return {
      valid: false,
      error: 'Video size must be less than 50MB',
    };
  }

  return { valid: true };
}
