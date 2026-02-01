import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT 
        c.id, c.name, c.slug, c.description, c.position, 
        COALESCE(NULLIF(c.image_url, ''), (
          SELECT pi.url 
          FROM product_images pi 
          JOIN products p ON pi.product_id = p.id 
          WHERE p.category_id = c.id AND p.is_active = 1 
          ORDER BY p.id DESC 
          LIMIT 1
        )) as image_url 
      FROM categories c 
      WHERE c.is_active = 1 
      ORDER BY c.position ASC`
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
