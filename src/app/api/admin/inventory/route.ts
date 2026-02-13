import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouseId');

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        pv.id as variant_id,
        pv.size as variant_size,
        pv.color as variant_color,
        i.quantity,
        i.reserved,
        w.name as warehouse_name,
        i.warehouse_id
      FROM inventory i
      JOIN product_variants pv ON i.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM inventory i JOIN product_variants pv ON i.product_variant_id = pv.id JOIN products p ON pv.product_id = p.id LEFT JOIN warehouses w ON i.warehouse_id = w.id WHERE 1=1';

    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR pv.size LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR pv.size LIKE ?)`;
    }

    if (warehouseId) {
      query += ` AND i.warehouse_id = ?`;
      countQuery += ` AND i.warehouse_id = ?`;
    }

    query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;

    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      params.push(search, search, search);
      countParams.push(search, search, search);
    }

    if (warehouseId) {
      params.push(warehouseId);
      countParams.push(warehouseId);
    }

    const countResult = await executeQuery(countQuery, countParams) as any[];
    const total = (countResult[0] as any)?.total || 0;

    params.push(limit, offset);
    const data = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    const { logSystemError } = await import('@/lib/audit');
    await logSystemError('API Error: Fetch Inventory', error, { query: request.url });
    return NextResponse.json({ success: false, message: 'Error fetching inventory' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, size, color, quantity, warehouse_id } = await request.json();

    // Default to Warehouse 1 (Main) if not specified
    const targetWarehouseId = warehouse_id || 1;

    if (!product_id || !size) {
      return NextResponse.json({ success: false, message: 'Product ID and Size are required' }, { status: 400 });
    }

    if (quantity !== undefined && typeof quantity !== 'number') {
      return NextResponse.json({ success: false, message: 'Quantity must be a number' }, { status: 400 });
    }

    // 1. Check if variant exists
    const variants = await executeQuery<any[]>(
      'SELECT id FROM product_variants WHERE product_id = ? AND size = ? AND (color = ? OR (color IS NULL AND ? IS NULL))',
      [product_id, size, color || null, color || null]
    );

    let variantId;
    if (variants.length > 0) {
      variantId = variants[0].id;
    } else {
      // Create new variant
      const result = await executeQuery<any>(
        'INSERT INTO product_variants (product_id, size, color) VALUES (?, ?, ?)',
        [product_id, size, color || null]
      );
      variantId = result.insertId;
    }

    // 2. Check if inventory record exists for this variant AND warehouse
    const existingInventory = await executeQuery<any[]>(
      'SELECT id, quantity FROM inventory WHERE product_variant_id = ? AND warehouse_id = ?',
      [variantId, targetWarehouseId]
    );

    if (existingInventory.length > 0) {
      // Update existing inventory
      // Update existing inventory
      const oldQuantity = Number(existingInventory[0].quantity || 0);
      const newQuantity = oldQuantity + (quantity || 0);

      await executeQuery(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [newQuantity, existingInventory[0].id]
      );

      // CHECK FOR RESTOCK (0 -> >0)
      if (oldQuantity <= 0 && newQuantity > 0) {
        try {
          // Get product info
          const products = await executeQuery<any[]>(
            'SELECT p.id, p.name FROM products p JOIN product_variants pv ON p.id = pv.product_id WHERE pv.id = ?',
            [variantId]
          );

          if (products.length > 0) {
            const product = products[0];

            // Get wishlist users
            const wishlistUsers = await executeQuery<any[]>(
              `SELECT u.email, u.name 
                   FROM wishlist w
                   JOIN users u ON w.user_id = u.id
                   WHERE w.product_id = ?`,
              [product.id]
            );

            if (wishlistUsers.length > 0) {
              const { sendWishlistRestockEmail } = await import('@/lib/email-templates');
              console.log(`Sending RESTOCK email to ${wishlistUsers.length} users for product ${product.id}`);
              wishlistUsers.forEach(user => {
                sendWishlistRestockEmail(
                  user.email,
                  user.name || 'Bạn',
                  product.name,
                  Number(product.id)
                ).catch(console.error);
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending restock emails:', emailError);
          // Don't block response
        }
      }
    } else {
      // Create new inventory record
      await executeQuery(
        'INSERT INTO inventory (product_variant_id, quantity, warehouse_id) VALUES (?, ?, ?)',
        [variantId, quantity || 0, targetWarehouseId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully'
    });
  } catch (error) {
    const { logSystemError } = await import('@/lib/audit');
    await logSystemError('API Error: Update Inventory', error, { body: await request.clone().json().catch(() => ({})) });
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
