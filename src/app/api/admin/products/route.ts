import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { invalidateCache, invalidateCachePattern } from '@/lib/cache';
import { syncProductToMeilisearch, deleteProductFromMeilisearch } from '@/lib/meilisearch';
import { logAdminAction } from '@/lib/audit';
import { db } from '@/lib/db/drizzle';
import { products, productImages, categories } from '@/lib/db/schema';
import { eq, and, like, sql, desc } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// GET - Lấy danh sách sản phẩm (Admin)
/**
 * API Lấy danh sách sản phẩm phục vụ trang Quản lý (Admin).
 * Khác với API Public, Endpoint này dùng thư viện Drizzle ORM để query 
 * và bắt buộc phải qua lớp xác thực `checkAdminAuth`.
 * Hỗ trợ các filter: Tìm theo tên/SKU, lọc theo Trạng thái (Active/Inactive).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Building query with Drizzle
    const whereClause = eq(products.isActive, status === 'active' ? 1 : 0);
    // Note: Drizzle handles Soft Delete better but for now we follow the existing pattern
    const filters = [sql`${products.deletedAt} IS NULL`];

    if (search) {
      filters.push(sql`(${products.name} LIKE ${`%%${search}%%`} OR ${products.sku} LIKE ${`%%${search}%%`})`);
    }
    if (status) {
      filters.push(eq(products.isActive, status === 'active' ? 1 : 0));
    }

    const data = await db.select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      retailPrice: products.retailPrice,
      isActive: products.isActive,
      createdAt: products.createdAt,
      primaryImage: sql<string>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
      categoryName: categories.name,
    })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...filters))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...filters));

    const total = countResult?.count || 0;

    return ResponseWrapper.success(data, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(error, 'Error fetching products:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// POST - Tạo sản phẩm mới (Admin)
/**
 * API Tạo mới sản phẩm (Admin).
 * Quy trình xử lý phức tạp:
 * 1. Insert bảng products (Dữ liệu chính).
 * 2. Insert bảng product_images (Ảnh chính).
 * 3. Invalidate Cache: Xóa các bản cache "products:list:*" để UI cập nhật ngay lập tức.
 * 4. Sync Meilisearch: Đẩy sản phẩm mới lên bộ máy tìm kiếm RAM.
 * 5. Audit Log: Ghi lại log xem admin nào đã thực hiện hành động này.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const {
      sku,
      name,
      slug,
      base_price,
      retail_price,
      description,
      short_description,
      brand_id,
      category_id,
      collection_id,
      is_active,
      image_url,
      gallery_images,
      main_media_type,
      is_new_arrival
    } = body;

    // Validate using ResponseWrapper
    if (!name?.trim()) return ResponseWrapper.error('Invalid product name', 400);

    const [result] = await db.insert(products).values({
      sku: sku || `NK-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      basePrice: String(base_price || 0),
      retailPrice: retail_price ? String(retail_price) : null,
      description: description || '',
      shortDescription: short_description || '',
      brandId: brand_id ? Number(brand_id) : null,
      categoryId: category_id ? Number(category_id) : null,
      collectionId: collection_id ? Number(collection_id) : null,
      isActive: is_active !== undefined ? Number(is_active) : 1,
      isNewArrival: is_new_arrival ? 1 : 0
    });

    const productId = result.insertId;

    // Insert main image
    if (image_url) {
      await db.insert(productImages).values({
        productId,
        url: image_url,
        isMain: 1,
        altText: name
      });
    }

    // Invalidate & Sync
    await invalidateCachePattern('products:list:*');
    await invalidateCachePattern('search:query:*');
    await syncProductToMeilisearch(productId);

    // Audit Logging
    await logAdminAction(
      admin.userId,
      'CREATE_PRODUCT',
      'products',
      productId,
      null,
      { sku, name, slug, base_price, is_active: is_active ?? 1 },
      request
    );

    return ResponseWrapper.success({ id: productId }, 'Product created successfully', 201);
  } catch (error) {
    logger.error(error, 'Error creating product:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// PUT and DELETE follow similar pattern, but keep them for full conversion
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return ResponseWrapper.error('Product ID required', 400);

    // Transition logic: simplified for this proof of concept
    // In a real "Full" upgrade, we'd use a repository pattern
    const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!current) return ResponseWrapper.notFound('Product not found');

    await db.update(products)
      .set({
        ...updates,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(products.id, id));

    await invalidateCache(`product:detail:${id}`);
    await invalidateCachePattern('products:list:*');
    await invalidateCachePattern('search:query:*');
    await syncProductToMeilisearch(id);

    return ResponseWrapper.success(null, 'Product updated successfully');
  } catch (error) {
    logger.error(error, 'Error updating product:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return ResponseWrapper.error('Product ID required', 400);

    await db.update(products)
      .set({
        isActive: 0,
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(products.id, Number(id)));

    await invalidateCache(`product:detail:${id}`);
    await invalidateCachePattern('products:list:*');
    await invalidateCachePattern('search:query:*');
    await deleteProductFromMeilisearch(id);

    return ResponseWrapper.success(null, 'Product deleted successfully');
  } catch (error) {
    logger.error(error, 'Error deleting product:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
