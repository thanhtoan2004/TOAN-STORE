import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { flashSales as flashSalesTable, flashSaleItems, products } from '@/lib/db/schema';
import { eq, and, ne, or, lt, gt, lte, gte, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * POST - Add product to flash sale
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { productId, flashPrice, quantityLimit, discountPercentage } = body;

    if (!productId || !flashPrice) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if product exists and get price
    const [product] = await db
      .select({
        id: products.id,
        priceCache: products.priceCache,
        msrpPrice: products.msrpPrice,
        name: products.name,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Validate Price and Quantity
    const fPrice = parseFloat(flashPrice);
    if (fPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'Flash price must be greater than 0' },
        { status: 400 }
      );
    }

    if (quantityLimit !== undefined && parseInt(quantityLimit) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Quantity limit must be greater than 0' },
        { status: 400 }
      );
    }

    const currentPrice = parseFloat(product.msrpPrice || product.priceCache || '0');
    if (fPrice >= currentPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Flash price (${fPrice}) must be lower than current price (${currentPrice})`,
        },
        { status: 400 }
      );
    }

    // Check for overlapping flash sales for this product
    const [currentSale] = await db
      .select({
        startTime: flashSalesTable.startTime,
        endTime: flashSalesTable.endTime,
      })
      .from(flashSalesTable)
      .where(eq(flashSalesTable.id, id))
      .limit(1);

    if (!currentSale) {
      return NextResponse.json(
        { success: false, message: 'Flash sale session not found' },
        { status: 404 }
      );
    }

    const overlappingSales = await db
      .select({
        name: flashSalesTable.name,
        startTime: flashSalesTable.startTime,
        endTime: flashSalesTable.endTime,
      })
      .from(flashSaleItems)
      .innerJoin(flashSalesTable, eq(flashSaleItems.flashSaleId, flashSalesTable.id))
      .where(
        and(
          eq(flashSaleItems.productId, productId),
          ne(flashSaleItems.flashSaleId, id),
          eq(flashSalesTable.isActive, 1),
          or(
            and(
              lte(flashSalesTable.startTime, currentSale.startTime),
              gt(flashSalesTable.endTime, currentSale.startTime)
            ),
            and(
              lt(flashSalesTable.startTime, currentSale.endTime),
              gte(flashSalesTable.endTime, currentSale.endTime)
            ),
            and(
              gte(flashSalesTable.startTime, currentSale.startTime),
              lte(flashSalesTable.endTime, currentSale.endTime)
            )
          )
        )
      )
      .limit(1);

    if (overlappingSales.length > 0) {
      const overlap = overlappingSales[0];
      return NextResponse.json(
        {
          success: false,
          message: `Sản phẩm này đã tham gia đợt sale "${overlap.name}" diễn ra từ ${overlap.startTime.toLocaleString()} đến ${overlap.endTime.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    // Insert or Update item
    await db
      .insert(flashSaleItems)
      .values({
        flashSaleId: id,
        productId: productId,
        flashPrice: String(flashPrice),
        quantityLimit: quantityLimit || 0,
        discountPercentage: String(discountPercentage || 0),
      })
      .onDuplicateKeyUpdate({
        set: {
          flashPrice: String(flashPrice),
          quantityLimit: quantityLimit || 0,
          discountPercentage: String(discountPercentage || 0),
        },
      });

    return NextResponse.json({ success: true, message: 'Product added to flash sale' });
  } catch (error) {
    console.error('Add flash sale item error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Remove product from flash sale
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

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get('productId');
    const productId = productIdStr ? parseInt(productIdStr) : NaN;

    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
    }

    await db
      .delete(flashSaleItems)
      .where(and(eq(flashSaleItems.flashSaleId, id), eq(flashSaleItems.productId, productId)));

    return NextResponse.json({ success: true, message: 'Product removed from flash sale' });
  } catch (error) {
    console.error('Delete flash sale item error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
