import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  products as productsTable,
  categories,
  brands,
  productImages,
  wishlistItems,
  wishlists,
  users,
} from '@/lib/db/schema';
import { eq, and, sql, desc, isNull } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sendWishlistSaleEmail } from '@/lib/mail/email-templates';
import { syncProductToMeilisearch, deleteProductFromMeilisearch } from '@/lib/search/meilisearch';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { invalidateCachePattern, invalidateCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy chi tiết sản phẩm (Admin).
 * Chức năng:
 * - Truy vấn thông tin sản phẩm đầy đủ bao gồm: Danh mục, Thương hiệu.
 * - Tích hợp danh sách hình ảnh (Images) sắp xếp theo độ ưu tiên.
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return ResponseWrapper.error('ID sản phẩm không hợp lệ', 400);
    }

    // Get product details
    const [productData] = await db
      .select({
        product: productsTable,
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(productsTable)
      .leftJoin(categories, eq(productsTable.categoryId, categories.id))
      .leftJoin(brands, eq(productsTable.brandId, brands.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!productData) {
      return ResponseWrapper.notFound('Không tìm thấy sản phẩm');
    }

    // Get images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(desc(productImages.isMain));

    const product = {
      ...productData.product,
      category_name: productData.categoryName,
      brand_name: productData.brandName,
      images,
    };

    return ResponseWrapper.success(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * PUT - Cập nhật sản phẩm (Admin).
 * Quy trình phức tạp:
 * 1. Kiểm tra quyền Admin.
 * 2. Cập nhật thông tin cơ bản của sản phẩm (Transaction).
 * 3. Xử lý cập nhật hình ảnh chính và danh sách hình ảnh gallery.
 * 4. Kiểm tra hạ giá (Price Drop) -> Tự động gửi Email thông báo cho khách hàng trong Wishlist.
 * 5. Đồng bộ dữ liệu sang Meilisearch phục vụ tìm kiếm.
 * 6. Xóa cache Redis (Product detail, Product list, Search results).
 * 7. Ghi log Audit chi tiết hành động.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { image_url, gallery_images, ...updates } = body;

    if (isNaN(id)) {
      return ResponseWrapper.error('ID sản phẩm không hợp lệ', 400);
    }

    // Get current product state BEFORE update
    const [currentProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!currentProduct) {
      return ResponseWrapper.notFound('Không tìm thấy sản phẩm để cập nhật');
    }

    // Mapping body fields to Drizzle camelCase schema fields
    const setClause: any = {};
    if (updates.name !== undefined) setClause.name = updates.name;
    if (updates.sku !== undefined) setClause.sku = updates.sku;
    if (updates.slug !== undefined) setClause.slug = updates.slug;
    if (updates.price_cache !== undefined) setClause.priceCache = String(updates.price_cache);
    if (updates.msrp_price !== undefined)
      setClause.msrpPrice = updates.msrp_price ? String(updates.msrp_price) : null;
    if (updates.cost_price !== undefined)
      setClause.costPrice = updates.cost_price ? String(updates.cost_price) : null;
    if (updates.description !== undefined) setClause.description = updates.description;
    if (updates.short_description !== undefined)
      setClause.shortDescription = updates.short_description;
    if (updates.category_id !== undefined) setClause.categoryId = updates.category_id;
    if (updates.brand_id !== undefined) setClause.brandId = updates.brand_id;
    if (updates.collection_id !== undefined) setClause.collectionId = updates.collection_id;
    if (updates.is_active !== undefined) setClause.isActive = updates.is_active ? 1 : 0;
    if (updates.is_new_arrival !== undefined)
      setClause.isNewArrival = updates.is_new_arrival ? 1 : 0;
    if (updates.gender !== undefined) setClause.gender = updates.gender;

    await db.transaction(async (tx) => {
      if (Object.keys(setClause).length > 0) {
        setClause.updatedAt = new Date();
        await tx.update(productsTable).set(setClause).where(eq(productsTable.id, id));
      }

      // Handle Main Image Update
      if (image_url !== undefined) {
        await tx
          .insert(productImages)
          .values({
            productId: id,
            url: image_url,
            isMain: 1,
            altText: updates.name || currentProduct.name,
          })
          .onDuplicateKeyUpdate({
            set: {
              url: image_url,
              altText: updates.name || currentProduct.name,
            },
          });
      }

      // Handle Gallery Images Update
      if (Array.isArray(gallery_images)) {
        await tx
          .delete(productImages)
          .where(and(eq(productImages.productId, id), eq(productImages.isMain, 0)));
        for (let i = 0; i < gallery_images.length; i++) {
          const url = gallery_images[i];
          if (url && url.trim()) {
            await tx.insert(productImages).values({
              productId: id,
              url: url,
              isMain: 0,
              position: i + 1,
              altText: updates.name || currentProduct.name,
            });
          }
        }
      }
    });

    // CHECK FOR PRICE DROP AND SEND EMAILS
    if (updates.msrp_price) {
      const oldPrice = parseFloat(currentProduct.msrpPrice || currentProduct.priceCache || '0');
      const newPrice = parseFloat(updates.msrp_price);

      if (newPrice < oldPrice) {
        const interestedUsers = await db
          .select({
            email: users.email,
            firstName: users.firstName,
          })
          .from(wishlistItems)
          .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
          .innerJoin(users, eq(wishlists.userId, users.id))
          .where(eq(wishlistItems.productId, id));

        if (interestedUsers.length > 0) {
          console.log(`Sending SALE email to ${interestedUsers.length} users for product ${id}`);
          interestedUsers.forEach((user) => {
            sendWishlistSaleEmail(
              user.email,
              user.firstName || 'Customer',
              currentProduct.name,
              oldPrice,
              newPrice,
              id
            ).catch(console.error);
          });
        }
      }
    }

    // Sync & Invalidate
    await syncProductToMeilisearch(id);
    await invalidateCachePattern('search:query:*');
    await invalidateCache(`product:detail:${id}`);
    await invalidateCachePattern('products:list:*');

    // Audit Logging
    await logAdminAction(
      admin.userId,
      'UPDATE_PRODUCT',
      'products',
      id,
      null,
      { ...setClause, image_url, gallery_images },
      request
    );

    return ResponseWrapper.success(null, 'Product updated successfully');
  } catch (error) {
    console.error('Error updating product:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * DELETE - Xóa sản phẩm (Soft Delete).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return ResponseWrapper.error('ID sản phẩm không hợp lệ', 400);
    }

    const [result] = await db
      .update(productsTable)
      .set({
        deletedAt: new Date(),
        isActive: 0,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, id));

    if (result.affectedRows === 0) {
      return ResponseWrapper.notFound('Không tìm thấy sản phẩm để gợi xóa');
    }

    // Delete from Meilisearch
    await deleteProductFromMeilisearch(id);

    // Invalidate caches
    await invalidateCachePattern('search:query:*');
    await invalidateCache(`product:detail:${id}`);
    await invalidateCachePattern('products:list:*');

    // Audit Logging
    await logAdminAction(
      admin.userId,
      'DELETE_PRODUCT',
      'products',
      id,
      null,
      { isActive: 0, deleted: true },
      request
    );

    return ResponseWrapper.success(null, 'Sản phẩm đã được xóa (Soft Deleted)');
  } catch (error) {
    console.error('Error deleting product:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
