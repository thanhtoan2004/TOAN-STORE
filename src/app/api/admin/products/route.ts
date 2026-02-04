import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWTPayload } from '@/types/auth';

// Middleware kiểm tra admin
async function checkAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JWTPayload;

    const users = await executeQuery(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (users.length === 0 || users[0].is_admin !== 1) return null;

    return { isAdmin: true, userId: decoded.userId };
  } catch {
    return null;
  }
}

// GET - Lấy danh sách sản phẩm (Admin)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        pi.url as primary_image,
        c.name as category_name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND p.is_active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = await executeQuery(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR sku LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += ' AND is_active = ?';
      countParams.push(status === 'active' ? 1 : 0);
    }

    const [countRow] = await executeQuery<any[]>(countQuery, countParams);
    const total = countRow?.total || 0;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo sản phẩm mới (Admin)
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sku,
      name,
      slug,
      base_price,
      retail_price,
      price, // legacy support
      sale_price, // legacy support
      description,
      short_description,
      brand_id,
      category_id,
      collection_id,
      is_active,
      image_url,
      gallery_images,
      is_new_arrival
    } = body;

    // Use base_price or fallback to price
    const finalBasePrice = base_price || price;
    const finalRetailPrice = retail_price || sale_price;

    // Validate required fields
    if (!name || !finalBasePrice) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name and base_price' },
        { status: 400 }
      );
    }

    // Insert product
    const result = await executeQuery<any>(
      `INSERT INTO products (sku, name, slug, base_price, retail_price, description, short_description, brand_id, category_id, collection_id, is_active, is_new_arrival)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku || `NK-${Date.now()}`,
        name,
        slug || name.toLowerCase().replace(/\s+/g, '-'),
        finalBasePrice,
        finalRetailPrice || null,
        description || '',
        short_description || '',
        brand_id || null,
        category_id || null,
        collection_id || null,
        is_active !== undefined ? is_active : 1,
        is_new_arrival ? 1 : 0
      ]
    );

    // Insert main image if provided
    if (image_url) {
      await executeQuery(
        'INSERT INTO product_images (product_id, url, is_main, alt_text) VALUES (?, ?, 1, ?)',
        [result.insertId, image_url, name]
      );
    }

    // Insert gallery images if provided
    if (Array.isArray(gallery_images)) {
      for (let i = 0; i < gallery_images.length; i++) {
        const url = gallery_images[i];
        if (url && url.trim()) {
          await executeQuery(
            'INSERT INTO product_images (product_id, url, is_main, position, alt_text) VALUES (?, ?, 0, ?, ?)',
            [result.insertId, url, i + 1, name]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật sản phẩm (Admin)
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    // Separate image_url from product fields
    const { image_url, ...productUpdates } = updates;
    const fields = Object.keys(productUpdates);

    if (fields.length > 0) {
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = [...fields.map(f => productUpdates[f]), id];

      await executeQuery(
        `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    // Update image if provided
    if (image_url !== undefined) {
      // Check if main image exists
      const existingImages = await executeQuery<any[]>(
        'SELECT id FROM product_images WHERE product_id = ? AND is_main = 1',
        [id]
      );

      if (existingImages.length > 0) {
        await executeQuery(
          'UPDATE product_images SET url = ? WHERE id = ?',
          [image_url, existingImages[0].id]
        );
      } else {
        await executeQuery(
          'INSERT INTO product_images (product_id, url, is_main) VALUES (?, ?, 1)',
          [id, image_url]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa sản phẩm (Admin)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID required' },
        { status: 400 }
      );
    }

    // Soft delete - chỉ set is_active = 0
    await executeQuery(
      'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
