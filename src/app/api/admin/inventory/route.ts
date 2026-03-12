import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  inventory as inventorySchema,
  productVariants,
  products,
  stores as warehouses,
} from '@/lib/db/schema';
import { eq, and, sql, asc, count } from 'drizzle-orm';
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
        sql`(${products.name} LIKE ${`%%${search}%%`} OR ${products.sku} LIKE ${`%%${search}%%`} OR ${productVariants.size} LIKE ${`%%${search}%%`})`
      );
    }
    if (warehouseId) {
      filters.push(eq(inventorySchema.warehouseId, Number(warehouseId)));
    }

    const data = await db
      .select({
        id: inventorySchema.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        variantId: productVariants.id,
        variantSize: productVariants.size,
        variantColor: productVariants.colorId,
        quantity: inventorySchema.quantity,
        reserved: inventorySchema.reserved,
        warehouseName: warehouses.name,
        warehouseId: inventorySchema.warehouseId,
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
    const { product_id, size, color, quantity, warehouse_id } = await request.json();
    const targetWarehouseId = warehouse_id || 1;

    if (!product_id || !size) {
      return ResponseWrapper.error('Product ID and Size are required', 400);
    }

    // 1. Get or Create Variant
    let variantId: number;
    const existingVariants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, product_id),
          eq(productVariants.size, size),
          color ? eq(productVariants.colorId, color) : sql`${productVariants.colorId} IS NULL`
        )
      );

    if (existingVariants.length > 0) {
      variantId = existingVariants[0].id;
    } else {
      const [insertResult] = await db.insert(productVariants).values({
        productId: product_id,
        size,
        colorId: color || null,
      });
      variantId = (insertResult as any).insertId;
    }

    // 2. Update or Create Inventory
    const existingInv = await db
      .select()
      .from(inventorySchema)
      .where(
        and(
          eq(inventorySchema.productVariantId, variantId),
          eq(inventorySchema.warehouseId, targetWarehouseId)
        )
      );

    if (existingInv.length > 0) {
      const oldQty = existingInv[0].quantity;
      const newQty = oldQty + (quantity || 0);

      await db
        .update(inventorySchema)
        .set({ quantity: newQty })
        .where(eq(inventorySchema.id, existingInv[0].id));

      // RESTOCK TRIGGER
      if (oldQty <= 0 && newQty > 0) {
        // Trigger restock emails in background
        try {
          const product = await db
            .select()
            .from(products)
            .where(eq(products.id, product_id))
            .then((r) => r[0]);
          if (product) {
            const { wishlists, wishlistItems, users } = await import('@/lib/db/schema');
            const interestedUsers = await db
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
              // Fire and forget (or at least don't block response)
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
      await db.insert(inventorySchema).values({
        productVariantId: variantId,
        quantity: quantity || 0,
        warehouseId: targetWarehouseId,
      });
    }

    return ResponseWrapper.success(null, 'Inventory updated successfully');
  } catch (error) {
    logger.error(error, 'Error updating inventory');
    return ResponseWrapper.serverError('Internal server error');
  }
});
