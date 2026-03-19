import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { flashSales as flashSalesTable, flashSaleItems, products } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { invalidateCache } from '@/lib/redis/cache';

/**
 * GET - Get individual flash sale detail for admin
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const [flashSale] = await db
      .select()
      .from(flashSalesTable)
      .where(and(eq(flashSalesTable.id, id), isNull(flashSalesTable.deletedAt)))
      .limit(1);

    if (!flashSale) {
      return NextResponse.json(
        { success: false, message: 'Flash sale not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select({
        id: flashSaleItems.id,
        flashSaleId: flashSaleItems.flashSaleId,
        productId: flashSaleItems.productId,
        flashPrice: flashSaleItems.flashPrice,
        quantityLimit: flashSaleItems.quantityLimit,
        quantitySold: flashSaleItems.quantitySold,
        discountPercentage: flashSaleItems.discountPercentage,
        productName: products.name,
        productSku: products.sku,
      })
      .from(flashSaleItems)
      .innerJoin(products, eq(flashSaleItems.productId, products.id))
      .where(eq(flashSaleItems.flashSaleId, id));

    return NextResponse.json({
      success: true,
      data: {
        ...flashSale,
        items,
      },
    });
  } catch (error) {
    console.error('Get flash sale error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update flash sale
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { name, description, startTime, endTime, isActive } = body;

    const setValues: any = {};
    if (name !== undefined) setValues.name = name;
    if (description !== undefined) setValues.description = description;
    if (startTime !== undefined) setValues.startTime = new Date(startTime);
    if (endTime !== undefined) setValues.endTime = new Date(endTime);
    if (isActive !== undefined) setValues.isActive = isActive ? 1 : 0;

    if (Object.keys(setValues).length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
    }

    setValues.updatedAt = new Date();

    await db.update(flashSalesTable).set(setValues).where(eq(flashSalesTable.id, id));

    // Log audit
    await logAdminAction(
      admin.userId,
      'update_flash_sale',
      'flash_sales',
      id,
      null,
      { name, isActive },
      request
    );

    // Invalidate active flash sale cache
    await invalidateCache('flash-sale:active');

    return NextResponse.json({ success: true, message: 'Flash sale updated' });
  } catch (error) {
    console.error('Update flash sale error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete flash sale
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

    await db
      .update(flashSalesTable)
      .set({ deletedAt: new Date() })
      .where(eq(flashSalesTable.id, id));

    // Log audit
    await logAdminAction(
      admin.userId,
      'soft_delete_flash_sale',
      'flash_sales',
      id,
      null,
      null,
      request
    );

    // Invalidate active flash sale cache
    await invalidateCache('flash-sale:active');

    return NextResponse.json({ success: true, message: 'Flash sale deleted' });
  } catch (error) {
    console.error('Delete flash sale error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
