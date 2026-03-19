import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  inventory as inventoryTable,
  productVariants,
  products,
  wishlistItems,
  wishlists,
  users,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sendWishlistRestockEmail } from '@/lib/mail/email-templates';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Cập nhật số lượng tồn kho cho một bản ghi tồn kho cụ thể (Thường gắn với variant).
 * Chức năng:
 * - Cập nhật trực tiếp số lượng (quantity) trong bảng inventory.
 * - Tự động phát hiện trạng thái "Restock" (từ 0 lên >0).
 * - Gửi email thông báo cho tất cả khách hàng đang lưu sản phẩm này trong Wishlist.
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) {
      return ResponseWrapper.error('ID tồn kho không hợp lệ', 400);
    }

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || isNaN(quantity)) {
      return ResponseWrapper.error('Số lượng (quantity) không hợp lệ', 400);
    }

    // 1. Check previous quantity and get Product info
    const [inventoryItem] = await db
      .select({
        quantity: inventoryTable.quantity,
        productId: products.id,
        productName: products.name,
      })
      .from(inventoryTable)
      .innerJoin(productVariants, eq(inventoryTable.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(inventoryTable.id, id))
      .limit(1);

    if (!inventoryItem) {
      return ResponseWrapper.notFound('Không tìm thấy bản ghi tồn kho');
    }

    const oldQuantity = inventoryItem.quantity || 0;
    const newQuantity = quantity;

    // 2. Update Inventory
    await db
      .update(inventoryTable)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(inventoryTable.id, id));

    // 3. Trigger Restock Email if moving from 0 to > 0
    if (oldQuantity <= 0 && newQuantity > 0) {
      // Find users who have this product in wishlist
      const interestedUsers = await db
        .select({
          email: users.email,
          firstName: users.firstName,
        })
        .from(wishlistItems)
        .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
        .innerJoin(users, eq(wishlists.userId, users.id))
        .where(eq(wishlistItems.productId, inventoryItem.productId));

      if (interestedUsers.length > 0) {
        console.log(
          `Sending RESTOCK email to ${interestedUsers.length} users for product ${inventoryItem.productName}`
        );
        // Fire and forget emails to not block response
        interestedUsers.forEach((user) => {
          sendWishlistRestockEmail(
            user.email,
            user.firstName || 'Customer',
            inventoryItem.productName,
            inventoryItem.productId
          ).catch(console.error);
        });
      }
    }

    return ResponseWrapper.success(null, 'Inventory updated');
  } catch (error) {
    console.error('Error updating inventory:', error);
    return ResponseWrapper.serverError('Lỗi server khi cập nhật tồn kho', error);
  }
}
