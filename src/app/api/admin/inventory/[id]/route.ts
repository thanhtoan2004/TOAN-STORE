import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { quantity } = await request.json();

    await executeQuery(
      'UPDATE inventory SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    return NextResponse.json({ success: true, message: 'Inventory updated' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ success: false, message: 'Error updating inventory' }, { status: 500 });
  }
}
