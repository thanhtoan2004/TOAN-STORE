import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create a simple connection for this endpoint
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nike_clone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
      }, { status: 400 });
    }

    const searchTerm = `%${q}%`;

    // Simple query without GROUP BY
    let sql = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.base_price,
        p.retail_price,
        p.is_new_arrival,
        p.created_at,
        c.name as category,
        c.slug as category_slug,
        b.name as brand
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = 1
        AND (
          p.name LIKE ?
          OR p.description LIKE ?
          OR c.name LIKE ?
          OR b.name LIKE ?
          OR p.slug LIKE ?
        )
    `;

    const params: any[] = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (category) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Use query instead of execute
    const [products] = await pool.query(sql, params);

    // Add images and keep original price field names
    const productsWithImages = await Promise.all(
      (Array.isArray(products) ? products : []).map(async (product: any) => {
        const [images] = await pool.query(
          'SELECT url FROM product_images WHERE product_id = ? AND is_main = 1 LIMIT 1',
          [product.id]
        );
        const imageRows = images as any[];
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          base_price: parseFloat(product.base_price) || 0,
          retail_price: product.retail_price ? parseFloat(product.retail_price) : null,
          image_url: Array.isArray(imageRows) && imageRows.length > 0 ? imageRows[0].url : null,
          is_new_arrival: product.is_new_arrival,
          created_at: product.created_at,
          category: product.category,
          category_slug: product.category_slug,
          brand: product.brand
        };
      })
    );

    // Get count
    let countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = 1
        AND (
          p.name LIKE ?
          OR p.description LIKE ?
          OR c.name LIKE ?
          OR b.name LIKE ?
          OR p.slug LIKE ?
        )
    `;

    const countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (category) {
      countSql += ` AND c.slug = ?`;
      countParams.push(category);
    }

    const [countResult] = await pool.query(countSql, countParams);
    const countRows = countResult as any[];
    const total = Array.isArray(countRows) && countRows.length > 0 ? countRows[0].total : 0;

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithImages,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        query: q
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi tìm kiếm sản phẩm'
    }, { status: 500 });
  }
}
