import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

async function checkAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const result = await executeQuery('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]) as any[];
    return result.length > 0 && (result[0] as any).is_admin === 1 ? result[0] : null;
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth(request);
    const { id } = await params;
    const reviewId = id;
    const body = await request.json();
    const { admin_reply } = body;

    if (!admin_reply) {
      return NextResponse.json(
        { success: false, message: 'Thiếu nội dung trả lời' },
        { status: 400 }
      );
    }

    await executeQuery(
      'UPDATE product_reviews SET admin_reply = ? WHERE id = ?',
      [admin_reply, reviewId]
    );

    return NextResponse.json({
      success: true,
      message: 'Trả lời review thành công'
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
