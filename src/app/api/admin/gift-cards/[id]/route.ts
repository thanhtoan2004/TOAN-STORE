import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Xóa vĩnh viễn thẻ quà tặng khỏi hệ thống.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await executeQuery('DELETE FROM gift_cards WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift card:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
