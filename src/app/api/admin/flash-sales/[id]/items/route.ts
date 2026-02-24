import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

/**
 * POST - Add product to flash sale
 */
/**
 * API Thêm sản phẩm vào đợt Flash Sale hiện tại.
 * Ràng buộc bảo mật (Conflict Check):
 * - Không cho phép 1 sản phẩm tham gia 2 đợt Flash Sale trùng khung giờ.
 * - Giá Flash Sale phải thấp hơn giá bán lẻ hiện tại.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;
        const body = await request.json();
        const { productId, flashPrice, quantityLimit, discountPercentage } = body;

        if (!productId || !flashPrice) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Check if product exists and get price
        const [product] = await executeQuery<any[]>(
            `SELECT id, base_price, retail_price, name FROM products WHERE id = ?`,
            [productId]
        );

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        // Validate Price and Quantity
        if (flashPrice <= 0) {
            return NextResponse.json({ success: false, message: 'Flash price must be greater than 0' }, { status: 400 });
        }

        if (quantityLimit !== undefined && quantityLimit <= 0) {
            return NextResponse.json({ success: false, message: 'Quantity limit must be greater than 0' }, { status: 400 });
        }

        const currentPrice = parseFloat(product.retail_price || product.base_price);
        if (flashPrice >= currentPrice) {
            return NextResponse.json({
                success: false,
                message: `Flash price (${flashPrice}) must be lower than current price (${currentPrice})`
            }, { status: 400 });
        }

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        // Check for overlapping flash sales for this product
        const [currentSale]: any = await executeQuery(
            `SELECT start_time, end_time FROM flash_sales WHERE id = ?`,
            [id]
        );

        if (!currentSale || currentSale.length === 0) {
            return NextResponse.json({ success: false, message: 'Flash sale session not found' }, { status: 404 });
        }

        const [overlappingSales]: any = await executeQuery(
            `SELECT fs.name, fs.start_time, fs.end_time 
             FROM flash_sale_items fsi
             JOIN flash_sales fs ON fsi.flash_sale_id = fs.id
             WHERE fsi.product_id = ? 
               AND fsi.flash_sale_id != ?
               AND fs.is_active = 1
               AND (
                 (fs.start_time <= ? AND fs.end_time > ?) OR
                 (fs.start_time < ? AND fs.end_time >= ?) OR
                 (fs.start_time >= ? AND fs.end_time <= ?)
               )
             LIMIT 1`,
            [
                productId, id,
                currentSale[0].start_time, currentSale[0].start_time,
                currentSale[0].end_time, currentSale[0].end_time,
                currentSale[0].start_time, currentSale[0].end_time
            ]
        );

        if (overlappingSales.length > 0) {
            const overlap = overlappingSales[0];
            return NextResponse.json({
                success: false,
                message: `Sản phẩm này đã tham gia đợt sale "${overlap.name}" diễn ra từ ${new Date(overlap.start_time).toLocaleString()} đến ${new Date(overlap.end_time).toLocaleString()}.`
            }, { status: 400 });
        }

        // Insert or Update item
        await executeQuery(
            `INSERT INTO flash_sale_items (flash_sale_id, product_id, flash_price, quantity_limit, discount_percentage)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                flash_price = VALUES(flash_price),
                quantity_limit = VALUES(quantity_limit),
                discount_percentage = VALUES(discount_percentage)`,
            [id, productId, flashPrice, quantityLimit || 0, discountPercentage || null]
        );

        return NextResponse.json({ success: true, message: 'Product added to flash sale' });
    } catch (error) {
        console.error('Add flash sale item error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Remove product from flash sale
 */
/**
 * API Loại bỏ sản phẩm khỏi đợt Flash Sale.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Missing productId' }, { status: 400 });
        }

        await executeQuery(
            `DELETE FROM flash_sale_items WHERE flash_sale_id = ? AND product_id = ?`,
            [id, productId]
        );

        return NextResponse.json({ success: true, message: 'Product removed from flash sale' });
    } catch (error) {
        console.error('Delete flash sale item error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
