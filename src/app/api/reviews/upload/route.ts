import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { verifyAuth } from '@/lib/auth/auth';
import { uploadImage } from '@/lib/images/cloudinary';
import { ResponseWrapper } from '@/lib/api/api-response';

const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_VIDEO_TYPES = ['.mp4', '.webm', '.mov'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * API Tải lên hình ảnh/video cho đánh giá sản phẩm.
 * Hỗ trợ xác thực, kiểm tra định dạng và dung lượng trước khi đẩy lên Cloudinary.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ResponseWrapper.error('No file uploaded', 400);
    }

    const ext = path.extname(file.name).toLowerCase();
    let mediaType = 'image';

    // 2. Strict Type & Size Validation
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return ResponseWrapper.error('File type not allowed', 400);
    }

    if (file.type.startsWith('image/')) {
      if (file.size > MAX_IMAGE_SIZE) {
        return ResponseWrapper.error('Image too large (max 5MB)', 400);
      }
      if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
        return ResponseWrapper.error('Invalid image extension', 400);
      }
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_SIZE) {
        return ResponseWrapper.error('Video too large (max 50MB)', 400);
      }
      if (!ALLOWED_VIDEO_TYPES.includes(ext)) {
        return ResponseWrapper.error('Invalid video extension', 400);
      }
      mediaType = 'video';
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 3. Upload to Cloudinary
    const folder =
      mediaType === 'video' ? 'toan-store/reviews/videos' : 'toan-store/reviews/images';
    const result = await uploadImage(base64Image, folder);

    return ResponseWrapper.success({
      url: result.secure_url,
      type: mediaType,
      size: file.size,
    });
  } catch (error) {
    console.error('Review upload error:', error);
    return ResponseWrapper.serverError('Upload failed', error);
  }
}
