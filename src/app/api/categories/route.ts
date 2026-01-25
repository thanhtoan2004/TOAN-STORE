import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET() {
  try {
    const result = await executeQuery(
      'SELECT id, name, slug, description, position FROM categories WHERE is_active = 1 ORDER BY position ASC'
    );
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching categories' },
      { status: 500 }
    );
  }
}
