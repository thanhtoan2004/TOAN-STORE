import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  inventory as inventorySchema,
  inventoryLogs,
  productVariants,
  products,
  warehouses,
} from '@/lib/db/schema';
import { eq, and, sql, asc, count, like, or } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import { withPermission } from '@/lib/auth/rbac-api';

/**
 * API Lấy danh sách tồn kho tại các chi nhánh/kho hàng.
 */
export const GET = withPermission('manage:inventory', async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouseId');
    const offset = (page - 1) * limit;

    const filters = [];
    if (search) {
      filters.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(productVariants.size, `%${search}%`)
        )!
      );
    }
    if (warehouseId) {
      filters.push(eq(inventorySchema.warehouseId, Number(warehouseId)));
    }

    const data = await db
      .select({
        id: inventorySchema.id,
        product_id: products.id,
        product_name: products.name,
        product_sku: products.sku,
        variant_id: productVariants.id,
        variant_size: productVariants.size,
        variant_color: productVariants.colorId,
        quantity: inventorySchema.quantity,
        reserved: inventorySchema.reserved,
        warehouse_name: warehouses.name,
        warehouse_id: inventorySchema.warehouseId,
      })
      .from(inventorySchema)
      .innerJoin(productVariants, eq(inventorySchema.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(warehouses, eq(inventorySchema.warehouseId, warehouses.id))
      .where(and(...filters))
      .orderBy(products.name)
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ total: count() })
      .from(inventorySchema)
      .innerJoin(productVariants, eq(inventorySchema.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(warehouses, eq(inventorySchema.warehouseId, warehouses.id))
      .where(and(...filters));

    const total = countResult?.total || 0;

    return ResponseWrapper.success(data, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(error, 'Error fetching inventory');
    return ResponseWrapper.serverError('Error fetching inventory');
  }
});

/**
 * API Nhập hàng vào kho (Restock / Initialize).
 * Logic đặc biệt: Khi số lượng tồn kho chuyển từ 0 lên > 0, hệ thống sẽ tự động quét
 * danh sách Wishlist và gửi Email thông báo "Hàng đã về" cho khách hàng đang chờ.
 */
export const POST = withPermission('manage:inventory', async (request: Request) => {
  try {
    const { product_id, size, color, quantity, warehouse_id, reason, notes, inventory_id, mode } =
      await request.json();
    const targetWarehouseId = warehouse_id || 1;
    const auth = await import('@/lib/auth/auth').then((m) => m.checkAdminAuth());
    const adminId = auth?.userId;

    // Direct adjustment by Inventory ID
    if (mode === 'adjust' && inventory_id) {
      await db
        .update(inventorySchema)
        .set({ quantity: sql`${inventorySchema.quantity} + ${quantity || 0}` })
        .where(eq(inventorySchema.id, inventory_id));

      await db.insert(inventoryLogs).values({
        inventoryId: inventory_id,
        adminId: adminId as any,
        quantityChange: quantity || 0,
        reason: reason || 'adjustment',
        notes: notes || null,
      });

      return ResponseWrapper.success(null, 'Inventory adjusted successfully');
    }

    if (!product_id || !size) {
      return ResponseWrapper.error('Product ID and Size are required', 400);
    }

    await db.transaction(async (tx) => {
      // 1. Get or Create Variant
      let variantId: number;
      const [existingVariant] = await (
        tx
          .select()
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, product_id),
              eq(productVariants.size, size),
              color ? eq(productVariants.colorId, color) : sql`${productVariants.colorId} IS NULL`
            )
          ) as any
      ).forUpdate();

      if (existingVariant) {
        variantId = existingVariant.id;
      } else {
        const [insertResult] = await tx.insert(productVariants).values({
          productId: product_id,
          size,
          colorId: color || null,
        });
        variantId = (insertResult as any).insertId;
      }

      // 2. Update or Create Inventory
      const [existingInv] = await (
        tx
          .select()
          .from(inventorySchema)
          .where(
            and(
              eq(inventorySchema.productVariantId, variantId),
              eq(inventorySchema.warehouseId, targetWarehouseId)
            )
          ) as any
      ).forUpdate();

      if (existingInv) {
        const oldQty = existingInv.quantity;
        const newQty = oldQty + (quantity || 0);

        await tx
          .update(inventorySchema)
          .set({ quantity: newQty })
          .where(eq(inventorySchema.id, existingInv.id));

        // Log the change
        await tx.insert(inventoryLogs).values({
          inventoryId: existingInv.id,
          adminId: adminId as any,
          quantityChange: quantity || 0,
          reason: reason || 'restock',
          notes: notes || null,
        });

        // RESTOCK TRIGGER (As a follow-up after transaction commit would be better, but we can do it here if careful)
        if (oldQty <= 0 && newQty > 0) {
          // Note: Restock logic remains same, will fire post-transaction if needed or in-transaction if lightweight
          try {
            const product = await tx
              .select()
              .from(products)
              .where(eq(products.id, product_id))
              .then((r) => r[0]);

            if (product) {
              const { wishlists, wishlistItems, users } = await import('@/lib/db/schema');
              const interestedUsers = await tx
                .select({
                  email: users.email,
                  firstName: users.firstName,
                })
                .from(wishlistItems)
                .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
                .innerJoin(users, eq(wishlists.userId, users.id))
                .where(eq(wishlistItems.productId, product.id));

              if (interestedUsers.length > 0) {
                const { sendWishlistRestockEmail } = await import('@/lib/mail/email-templates');
                interestedUsers.forEach((user) => {
                  sendWishlistRestockEmail(
                    user.email,
                    user.firstName || 'Customer',
                    product.name,
                    product.id
                  ).catch(logger.error);
                });
              }
            }
          } catch (e) {
            logger.error(e, 'Failed to process restock emails');
          }
        }
      } else {
        const [insertResult] = await tx.insert(inventorySchema).values({
          productVariantId: variantId,
          quantity: quantity || 0,
          warehouseId: targetWarehouseId,
        });
        const newInvId = (insertResult as any).insertId;

        // Log the initialization
        await tx.insert(inventoryLogs).values({
          inventoryId: newInvId,
          adminId: adminId as any,
          quantityChange: quantity || 0,
          reason: 'init',
          notes: notes || 'Initial stock entry',
        });
      }
    });

    return ResponseWrapper.success(null, 'Inventory updated successfully');
  } catch (error) {
    logger.error(error, 'Error updating inventory');
    return ResponseWrapper.serverError('Internal server error');
  }
});
