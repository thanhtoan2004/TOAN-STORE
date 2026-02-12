
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// GET - Lấy chi tiết sản phẩm
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
            images
        };

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Cập nhật sản phẩm
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { image_url, gallery_images, ...updates } = body;

        // Remove immutable fields or fields handled separately if any
        delete updates.id;
        delete updates.created_at;
        delete updates.updated_at;

        const fields = Object.keys(updates);

        if (fields.length > 0) {
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = [...fields.map(f => updates[f]), id];

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
                await executeQuery(
                    'UPDATE product_images SET url = ?, alt_text = ? WHERE id = ?',
                    [image_url, altText, existingImages[0].id]
                );
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
            await executeQuery(
                'DELETE FROM product_images WHERE product_id = ? AND is_main = 0',
                [id]
            );

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

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
