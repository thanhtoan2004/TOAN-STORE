import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeQuery(
      'SELECT id, name, slug, description, image_url, position, is_active FROM categories ORDER BY position ASC'
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
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, description, image_url, position } = await request.json();

    const result = await executeQuery(
      'INSERT INTO categories (name, slug, description, image_url, position, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name, slug, description, image_url || null, position]
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
