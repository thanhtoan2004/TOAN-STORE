import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { sendWishlistSaleEmail } from '@/lib/email-templates';
import { syncProductToMeilisearch, deleteProductFromMeilisearch } from '@/lib/meilisearch';
import { logAdminAction } from '@/lib/audit';
import { invalidateCachePattern } from '@/lib/cache';

// ... (GET method unchanged)
// GET - Lấy chi tiết sản phẩm
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get product details
    const products = await executeQuery<any[]>(
      `SELECT p.*, c.name as category_name, b.name as brand_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Get images
    const images = await executeQuery<any[]>(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC',
      [id]
    );

    const product = {
      ...products[0],
      images,
    };

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật sản phẩm
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { image_url, gallery_images, ...updates } = body;

    // Get current product state BEFORE update for comparison
    const currentProducts = await executeQuery<any[]>('SELECT * FROM products WHERE id = ?', [id]);

    const currentProduct = currentProducts[0];

    // Remove immutable fields or fields handled separately if any
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const fields = Object.keys(updates);

    if (fields.length > 0) {
      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = [...fields.map((f) => updates[f]), id];

      await executeQuery(
        `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    // Handle Main Image Update
    if (image_url !== undefined) {
      const altText = updates.name || '';
      // Check if main image exists
      const existingImages = await executeQuery<any[]>(
        'SELECT id FROM product_images WHERE product_id = ? AND is_main = 1',
        [id]
      );

      if (existingImages.length > 0) {
        // Update existing main image
        await executeQuery('UPDATE product_images SET url = ?, alt_text = ? WHERE id = ?', [
          image_url,
          altText,
          existingImages[0].id,
        ]);
      } else {
        // Insert new main image
        await executeQuery(
          'INSERT INTO product_images (product_id, url, is_main, alt_text) VALUES (?, ?, 1, ?)',
          [id, image_url, altText]
        );
      }
    }

    // Handle Gallery Images Update
    if (Array.isArray(gallery_images)) {
      const altText = updates.name || '';
      // Simple approach: Delete old non-main images and insert new ones
      await executeQuery('DELETE FROM product_images WHERE product_id = ? AND is_main = 0', [id]);

      for (let i = 0; i < gallery_images.length; i++) {
        const url = gallery_images[i];
        if (url && url.trim()) {
          await executeQuery(
            'INSERT INTO product_images (product_id, url, is_main, position, alt_text) VALUES (?, ?, 0, ?, ?)',
            [id, url, i + 1, altText]
          );
        }
      }
    }

    // CHECK FOR PRICE DROP AND SEND EMAILS
    if (currentProduct && updates.msrp_price) {
      const oldPrice = parseFloat(currentProduct.msrp_price || currentProduct.price_cache);
      const newPrice = parseFloat(updates.msrp_price);

      // Detect valid price drop (more than 5% difference to avoid spam?)
      // For now, just any drop is fine.
      if (newPrice < oldPrice) {
        // Fetch users who have this product in wishlist
        const wishlistUsers = await executeQuery<any[]>(
          `SELECT u.email, u.name 
                      FROM wishlist w
                      JOIN users u ON w.user_id = u.id
                      WHERE w.product_id = ?`,
          [id]
        );

        // Send batched emails (simplified)
        if (wishlistUsers.length > 0) {
          console.log(`Sending SALE email to ${wishlistUsers.length} users for product ${id}`);
          wishlistUsers.forEach((user) => {
            sendWishlistSaleEmail(
              user.email,
              user.name || 'Bạn',
              currentProduct.name,
              oldPrice,
              newPrice,
              parseInt(id)
            ).catch(console.error);
          });
        }
      }
    }

    // Sync to Meilisearch
    await syncProductToMeilisearch(id);

    // Invalidate search query cache
    await invalidateCachePattern('search:query:*');

    // Audit Logging
    if (currentProduct) {
      const oldValues: any = {};
      const newValues: any = {};

      // Compare only the fields that were sent in the update
      Object.keys(updates).forEach((key) => {
        if (JSON.stringify(currentProduct[key]) !== JSON.stringify(updates[key])) {
          oldValues[key] = currentProduct[key];
          newValues[key] = updates[key];
        }
      });

      if (Object.keys(newValues).length > 0) {
        await logAdminAction(
          admin.userId,
          'UPDATE_PRODUCT',
          'products',
          id,
          oldValues,
          newValues,
          request
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa sản phẩm (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Thực hiện xóa mềm
    const result: any = await executeQuery(
      'UPDATE products SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Delete from Meilisearch
    await deleteProductFromMeilisearch(id);

    // Invalidate search query cache
    await invalidateCachePattern('search:query:*');

    // Audit Logging
    await logAdminAction(
      admin.userId,
      'DELETE_PRODUCT',
      'products',
      id,
      { is_active: 1, deleted_at: null },
      { is_active: 0, deleted_at: 'CURRENT_TIMESTAMP' },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Sản phẩm đã được xóa (Soft Deleted)',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
