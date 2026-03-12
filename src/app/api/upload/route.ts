import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { uploadImage } from '@/lib/images/cloudinary';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * API Tải lên tệp tin (Hình ảnh/Video) lên Cloudinary.
 * Quy trình:
 * 1. Kiểm tra xác thực.
 * 2. Validate định dạng tệp (Chỉ cho phép ảnh và video) và dung lượng tối đa (50MB).
 * 3. Chuyển đổi sang Base64 và tải lên thư mục tương ứng trên Cloudinary.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // 2. Strict Type & Size Validation
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    // 3. Convert to Base64 for Cloudinary (Server-side)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 4. Upload to Cloudinary with metadata
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const folder = resourceType === 'video' ? 'toan-store/videos' : 'toan-store/products';

    const result = await uploadImage(base64Image, folder);

    // Add tagging logic or other metadata if needed via a separate call if your uploadImage helper doesn't support it
    // For now, we use the folder and automatic optimization during upload.

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
