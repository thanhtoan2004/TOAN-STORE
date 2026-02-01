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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAdminAuth(request);
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { status } = await request.json();

    await executeQuery('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
