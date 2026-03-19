import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  searchAnalytics,
  categories,
  products as productsTable,
  brands,
  orderItems,
} from '@/lib/db/schema';
import { eq, and, sql, desc, count, isNull, gte, asc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Search analytics & facet usage statistics.
 * API Phân tích Tìm kiếm và Bộ lọc (Search Analytics).
 * Cung cấp dữ liệu cho Dashboard về:
 * - Top từ khóa tìm kiếm.
 * - Từ khóa tìm kiếm không ra kết quả (Zero-result queries) để tối ưu hóa SEO/Catalog.
 * - Xu hướng tìm kiếm theo thời gian.
 * - Phân tích hiệu quả của các bộ lọc (Danh mục, Thương hiệu, Khoảng giá).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Top search queries
    const topQueries = await db
      .select({
        query: searchAnalytics.query,
        search_count: count(),
        avg_results: sql<number>`ROUND(AVG(${searchAnalytics.resultsCount}))`,
        avg_time_ms: sql<number>`ROUND(AVG(${searchAnalytics.processingTimeMs}))`,
        zero_result_count: sql<number>`SUM(CASE WHEN ${searchAnalytics.resultsCount} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(searchAnalytics)
      .where(gte(searchAnalytics.createdAt, startDate))
      .groupBy(searchAnalytics.query)
      .orderBy(desc(sql`search_count`))
      .limit(20);

    // 2. Zero-result queries
    const zeroResultQueries = await db
      .select({
        query: searchAnalytics.query,
        search_count: count(),
      })
      .from(searchAnalytics)
      .where(and(gte(searchAnalytics.createdAt, startDate), eq(searchAnalytics.resultsCount, 0)))
      .groupBy(searchAnalytics.query)
      .orderBy(desc(sql`search_count`))
      .limit(10);

    // 3. Search volume over time
    const searchTrend = await db
      .select({
        date: sql<string>`DATE(${searchAnalytics.createdAt})`,
        searches: count(),
        avg_time_ms: sql<number>`ROUND(AVG(${searchAnalytics.processingTimeMs}))`,
        zero_results: sql<number>`SUM(CASE WHEN ${searchAnalytics.resultsCount} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(searchAnalytics)
      .where(gte(searchAnalytics.createdAt, startDate))
      .groupBy(sql`date`)
      .orderBy(asc(sql`date`));

    // 4. Category filter usage
    const categoryFacets = await db
      .select({
        category: sql<string>`COALESCE(${searchAnalytics.categoryFilter}, 'No filter')`,
        usage_count: count(),
      })
      .from(searchAnalytics)
      .where(gte(searchAnalytics.createdAt, startDate))
      .groupBy(searchAnalytics.categoryFilter)
      .orderBy(desc(sql`usage_count`));

    // 5. Overall stats
    const [overview] = await db
      .select({
        total_searches: count(),
        unique_queries: sql<number>`COUNT(DISTINCT ${searchAnalytics.query})`,
        avg_response_ms: sql<number>`ROUND(AVG(${searchAnalytics.processingTimeMs}))`,
        avg_results: sql<number>`ROUND(AVG(${searchAnalytics.resultsCount}))`,
        total_zero_results: sql<number>`SUM(CASE WHEN ${searchAnalytics.resultsCount} = 0 THEN 1 ELSE 0 END)`,
        unique_searchers: sql<number>`COUNT(DISTINCT ${searchAnalytics.ipAddress})`,
      })
      .from(searchAnalytics)
      .where(gte(searchAnalytics.createdAt, startDate));

    // 6. Product category distribution
    const productFacets = await db
      .select({
        category: categories.name,
        product_count: sql<number>`COUNT(DISTINCT ${productsTable.id})`,
        items_sold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      })
      .from(categories)
      .leftJoin(
        productsTable,
        and(
          eq(productsTable.categoryId, categories.id),
          eq(productsTable.isActive, 1),
          isNull(productsTable.deletedAt)
        )
      )
      .leftJoin(orderItems, eq(orderItems.productId, productsTable.id))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`product_count`));

    // 7. Brand distribution
    const brandFacets = await db
      .select({
        brand: brands.name,
        product_count: sql<number>`COUNT(DISTINCT ${productsTable.id})`,
        items_sold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      })
      .from(brands)
      .leftJoin(
        productsTable,
        and(
          eq(productsTable.brandId, brands.id),
          eq(productsTable.isActive, 1),
          isNull(productsTable.deletedAt)
        )
      )
      .leftJoin(orderItems, eq(orderItems.productId, productsTable.id))
      .groupBy(brands.id, brands.name)
      .orderBy(desc(sql`product_count`));

    // 8. Price range distribution
    const priceRanges = await db
      .select({
        price_range: sql<string>`
          CASE 
            WHEN CAST(${productsTable.msrpPrice} AS UNSIGNED) < 1000000 THEN 'Under 1M'
            WHEN CAST(${productsTable.msrpPrice} AS UNSIGNED) < 2000000 THEN '1M - 2M'
            WHEN CAST(${productsTable.msrpPrice} AS UNSIGNED) < 3000000 THEN '2M - 3M'
            WHEN CAST(${productsTable.msrpPrice} AS UNSIGNED) < 5000000 THEN '3M - 5M'
            ELSE 'Over 5M'
          END`,
        product_count: count(),
        min_price: sql<number>`MIN(CAST(${productsTable.msrpPrice} AS UNSIGNED))`,
      })
      .from(productsTable)
      .where(and(eq(productsTable.isActive, 1), isNull(productsTable.deletedAt)))
      .groupBy(sql`price_range`)
      .orderBy(asc(sql`min_price`));

    const result = {
      overview: overview || {},
      topQueries,
      zeroResultQueries,
      searchTrend,
      facets: {
        categoryFilter: categoryFacets,
        productCategories: productFacets,
        brands: brandFacets,
        priceRanges,
      },
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Search analytics error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
