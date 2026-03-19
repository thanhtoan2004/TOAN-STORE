import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getMedia, addMedia, deleteMedia, getMediaStats } from '@/lib/db/repositories/media';
import { uploadImage } from '@/lib/images/cloudinary';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý Media tập trung (Admin).
 * Chức năng:
 * - GET: Liệt kê danh sách tệp tin (Paginated, hỗ trợ tìm kiếm và lọc theo thư mục).
 * - POST: Tải lên tệp mới (Cloudinary) và lưu thông tin vào database.
 * Bảo mật: Yêu cầu quyền Admin.
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const [result, stats] = await Promise.all([
      getMedia({ folder, search, page, limit }),
      getMediaStats(),
    ]);

    const pagination = {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    };

    return ResponseWrapper.success(result.data, undefined, 200, pagination, { stats });
  } catch (error: any) {
    console.error('[API_MEDIA_GET] Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải danh sách media', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderName = (formData.get('folder') as string) || 'general';

    if (!file) {
      return ResponseWrapper.error('Chưa chọn tệp tin để tải lên', 400);
    }

    // 1. Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Cloudinary automatically handles compression and format optimization
    const cloudinaryResponse = await uploadImage(base64Image, `toan-store/${folderName}`);

    // 2. Save to Media table
    const mediaId = await addMedia({
      fileName: file.name,
      filePath: cloudinaryResponse.secure_url,
      fileSize: file.size,
      mimeType: file.type,
      width: cloudinaryResponse.width,
      height: cloudinaryResponse.height,
      folder: folderName,
      altText: file.name.split('.')[0],
    });

    const result = {
      id: mediaId,
      url: cloudinaryResponse.secure_url,
      fileName: file.name,
    };

    return ResponseWrapper.success(result, 'Đã tải lên tệp tin thành công');
  } catch (error: any) {
    console.error('[API_MEDIA_POST] Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải lên media', error);
  }
}
