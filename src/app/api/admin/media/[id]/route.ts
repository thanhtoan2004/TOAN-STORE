import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { deleteMedia } from '@/lib/db/repositories/media';

/**
 * API Xóa tệp tin media.
 * Lưu ý: Hiện tại chỉ xóa record trong DB.
 * Trong thực tế nên xóa cả trên Cloudinary (nếu cần tiết kiệm dung lượng).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteMedia(parseInt(id));

    return NextResponse.json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('[API_MEDIA_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
