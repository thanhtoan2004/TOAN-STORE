import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

async function checkAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!authHeader) {
      return null;
    }

    // Parse JWT or get from database
    const token = authHeader.replace('Bearer ', '');
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    const result = await executeQuery('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]) as any[];
    return result.length > 0 && (result[0] as any).is_admin === 1 ? result[0] : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await executeQuery(
      'SELECT id, name, slug, description, position, is_active FROM categories ORDER BY position ASC'
    );
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'Error fetching categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, description, position } = await request.json();

    const result = await executeQuery(
      'INSERT INTO categories (name, slug, description, position, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, slug, description, position]
    ) as any;

    return NextResponse.json({
      success: true,
      message: 'Category created',
      id: result.insertId || Date.now()
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Error creating category' }, { status: 500 });
  }
}
