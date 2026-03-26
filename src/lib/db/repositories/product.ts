import { db } from '../drizzle';
import {
  products,
  productVariants,
  inventory,
  productImages,
  categories,
  sports,
  productGenderCategories,
} from '../schema';
import {
  eq,
  and,
  sql,
  desc,
  asc,
  lt,
  gt,
  gte,
  lte,
  or,
  inArray,
  isNull,
  count,
  exists,
} from 'drizzle-orm';

/**
 * Repository xử lý các thao tác liên quan đến Sản phẩm (Products).
 */

// Product functions
export async function getProductSizes(productId: number) {
  return await db
    .select({
      size: productVariants.size,
      stock: sql<number>`SUM(COALESCE(${inventory.quantity}, 0))`,
      reserved: sql<number>`SUM(COALESCE(${inventory.reserved}, 0))`,
      priceAdjustment: sql<string>`MAX(${productVariants.price})`, // Pick one price
      allowBackorder: sql<number>`MAX(COALESCE(${inventory.allowBackorder}, 0))`,
      expectedRestockDate: sql<string>`MAX(${inventory.expectedRestockDate})`,
      sku: sql<string>`MAX(${productVariants.sku})`, // Pick one SKU
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.productVariantId, productVariants.id))
    .where(eq(productVariants.productId, productId))
    .groupBy(productVariants.size)
    .orderBy(sql`CAST(${productVariants.size} AS DECIMAL(10,1))`);
}

export async function getProductById(productId: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, 1), isNull(products.deletedAt)))
    .limit(1);
  return product || null;
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, 1), isNull(products.deletedAt)))
    .limit(1);
  return product || null;
}

/**
 * Hàm truy vấn danh sách sản phẩm chính cho trang Shop.
 */
export async function getProducts(filters: {
  category?: string;
  sport?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isNewArrival?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(products.isActive, 1), isNull(products.deletedAt)];

  if (filters.search) {
    conditions.push(
      sql`MATCH(${products.name}, ${products.sku}, ${products.description}) AGAINST(${filters.search})`
    );
  }

  if (filters.category && filters.category !== 'all') {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(or(eq(categories.slug, filters.category), eq(categories.name, filters.category)))
      .limit(1);
    if (cat) {
      conditions.push(eq(products.categoryId, cat.id));
    } else {
      // Nếu không tìm thấy category, trả về mảng rỗng ngay
      return { items: [], total: 0 };
    }
  }

  if (filters.sport && filters.sport !== 'all') {
    const [sp] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(or(eq(sports.slug, filters.sport), eq(sports.name, filters.sport)))
      .limit(1);
    if (sp) {
      conditions.push(eq(products.sportId, sp.id));
    } else {
      // Nếu không tìm thấy sport, trả về mảng rỗng ngay
      return { items: [], total: 0 };
    }
  }

  if (filters.gender) {
    conditions.push(
      exists(
        db
          .select()
          .from(productGenderCategories)
          .where(
            and(
              eq(productGenderCategories.productId, products.id),
              eq(productGenderCategories.gender, filters.gender as any)
            )
          )
      )
    );
  }

  if (filters.minPrice !== undefined) {
    conditions.push(
      or(
        gte(products.msrpPrice, String(filters.minPrice)),
        and(isNull(products.msrpPrice), gte(products.priceCache, String(filters.minPrice)))!
      )!
    );
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(
      or(
        lte(products.msrpPrice, String(filters.maxPrice)),
        and(isNull(products.msrpPrice), lte(products.priceCache, String(filters.maxPrice)))!
      )!
    );
  }

  if (filters.isNewArrival) {
    conditions.push(gte(products.createdAt, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`));
  }

  // 1. Get Total Count
  const [countResult] = await db
    .select({ total: count() })
    .from(products)
    .where(and(...conditions));

  const total = Number(countResult?.total || 0);

  // 2. Build Query
  const selectFields: any = {
    id: products.id,
    name: products.name,
    slug: products.slug,
    priceCache: products.priceCache,
    msrpPrice: products.msrpPrice,
    shortDescription: products.shortDescription,
    description: products.description,
    sku: products.sku,
    categoryId: products.categoryId,
    sportId: products.sportId,
    createdAt: products.createdAt,
    imageUrl: sql<string>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
    mainMediaType: sql<string>`(SELECT media_type FROM product_images WHERE product_id = ${products.id} AND is_main = 1 LIMIT 1)`,
    variantCount: sql<number>`(SELECT COUNT(*) FROM ${productVariants} pv WHERE pv.product_id = ${products.id})`,
    category: categories.name,
    isNewArrival: products.isNewArrival,
  };

  if (filters.search) {
    selectFields.relevance = sql`MATCH(${products.name}, ${products.sku}, ${products.description}) AGAINST(${filters.search})`;
  }

  const sortMap: Record<string, any> = {
    'price-asc': asc(products.priceCache),
    'price-desc': desc(products.priceCache),
    discount: desc(
      sql`(COALESCE(${products.msrpPrice}, ${products.priceCache}) - ${products.priceCache})`
    ),
    name: asc(products.name),
    newest: desc(products.createdAt),
  };

  const orderBy: any[] = [];
  if (filters.search) {
    orderBy.push(desc(sql`relevance`));
  }
  orderBy.push(sortMap[filters.sort || 'newest'] || desc(products.createdAt));

  let finalQuery = db
    .select(selectFields)
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conditions))
    .orderBy(...orderBy);

  if (filters.limit) {
    finalQuery = finalQuery.limit(filters.limit) as any;
    if (filters.offset !== undefined) {
      finalQuery = finalQuery.offset(filters.offset) as any;
    }
  }

  const items = await finalQuery;
  return { items, total };
}

// Chatbot Search Function
export async function searchProductsForChat(keyword: string) {
  try {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price_cache: products.priceCache,
        msrp_price: products.msrpPrice,
        slug: products.slug,
        short_description: products.shortDescription,
        imageUrl: productImages.url,
        relevance: sql`MATCH(${products.name}, ${products.sku}, ${products.description}) AGAINST(${keyword})`,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isMain, 1))
      )
      .where(
        and(
          sql`MATCH(${products.name}, ${products.sku}, ${products.description}) AGAINST(${keyword})`,
          eq(products.isActive, 1),
          isNull(products.deletedAt)
        )
      )
      .orderBy(desc(sql`relevance`))
      .limit(5);

    return await formatProductsForChat(items);
  } catch (error) {
    console.error('Chatbot Search Error:', error);
    // Fallback to LIKE if FTS fails
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price_cache: products.priceCache,
        msrp_price: products.msrpPrice,
        slug: products.slug,
        short_description: products.shortDescription,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isMain, 1))
      )
      .where(
        and(
          sql`${products.name} LIKE ${`%${keyword}%`}`,
          eq(products.isActive, 1),
          isNull(products.deletedAt)
        )
      )
      .limit(5);
    return await formatProductsForChat(items);
  }
}

export async function getNewArrivalsForChat() {
  try {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price_cache: products.priceCache,
        msrp_price: products.msrpPrice,
        slug: products.slug,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isMain, 1))
      )
      .where(and(eq(products.isActive, 1), isNull(products.deletedAt)))
      .orderBy(desc(products.createdAt))
      .limit(5);
    return await formatProductsForChat(items);
  } catch (error) {
    console.error('Chatbot New Arrivals Error:', error);
    return [];
  }
}

export async function getDiscountedProductsForChat() {
  try {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price_cache: products.priceCache,
        msrp_price: products.msrpPrice,
        slug: products.slug,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isMain, 1))
      )
      .where(
        and(
          eq(products.isActive, 1),
          lt(products.msrpPrice, products.priceCache),
          isNull(products.deletedAt)
        )
      )
      .orderBy(desc(sql`(${products.priceCache} - ${products.msrpPrice})`))
      .limit(5);
    return await formatProductsForChat(items);
  } catch (error) {
    console.error('Chatbot Discount Error:', error);
    return [];
  }
}

export async function getProductsByCategoryForChat(categorySlug: string) {
  try {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price_cache: products.priceCache,
        msrp_price: products.msrpPrice,
        slug: products.slug,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isMain, 1))
      )
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, 1),
          or(
            eq(categories.slug, categorySlug),
            sql`${categories.name} LIKE ${`%${categorySlug}%`}`
          ),
          isNull(products.deletedAt)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(5);
    return await formatProductsForChat(items);
  } catch (error) {
    console.error('Chatbot Category Error:', error);
    return [];
  }
}

/**
 * Helper định dạng dữ liệu sản phẩm cho hội thoại Chatbot.
 */
export async function formatProductsForChat(productsList: any[]) {
  if (productsList.length === 0) return [];

  const productIds = productsList.map((p) => p.id);

  // Batch fetch available sizes for all products
  const allSizes = await db
    .select({
      productId: productVariants.productId,
      size: productVariants.size,
      stock: sql<number>`COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)`,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.productVariantId, productVariants.id))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        sql`(COALESCE(${inventory.quantity}, 0) - COALESCE(${inventory.reserved}, 0)) > 0`
      )
    )
    .orderBy(sql`CAST(${productVariants.size} AS DECIMAL(10,1))`);

  // Group sizes by productId
  const sizesByProduct: Record<string, string[]> = {};
  allSizes.forEach((s) => {
    if (!sizesByProduct[s.productId]) sizesByProduct[s.productId] = [];
    sizesByProduct[s.productId].push(s.size || '');
  });

  return productsList.map((p) => {
    const availableSizes = (sizesByProduct[p.id] || []).join(', ');
    const price = p.price_cache;
    const originalPrice =
      p.msrp_price && Number(p.msrp_price) > Number(p.price_cache) ? p.msrp_price : null;

    return {
      id: p.id,
      name: p.name,
      price: price,
      originalPrice: originalPrice,
      image_url: p.imageUrl || '/images/placeholder.png',
      sizes: availableSizes || 'Hết hàng',
      link: `/products/${p.slug || p.id}`,
    };
  });
}

export async function softDeleteProduct(productId: number) {
  return await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, productId));
}

export async function restoreProduct(productId: number) {
  return await db.update(products).set({ deletedAt: null }).where(eq(products.id, productId));
}
