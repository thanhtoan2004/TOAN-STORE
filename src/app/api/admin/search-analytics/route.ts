import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

// GET - Search analytics & facet usage statistics
/**
 * API Phân tích xu hướng tìm kiếm (Search Analytics).
 * Thống kê các từ khóa được tìm nhiều nhất, các từ khóa không trả về kết quả (Zero results)
 * và hành vi sử dụng bộ lọc của khách hàng trong 30 ngày qua (mặc định).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Top search queries
    const topQueries = await executeQuery<any[]>(`
      SELECT 
        query,
        COUNT(*) as search_count,
        ROUND(AVG(results_count)) as avg_results,
        ROUND(AVG(processing_time_ms)) as avg_time_ms,
        SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as zero_result_count
      FROM search_analytics
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT 20
    `, [days]);

    // Zero-result queries (important for synonym/content gap analysis)
    const zeroResultQueries = await executeQuery<any[]>(`
      SELECT 
        query,
        COUNT(*) as search_count
      FROM search_analytics
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND results_count = 0
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT 10
    `, [days]);

    // Search volume over time
    const searchTrend = await executeQuery<any[]>(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as searches,
        ROUND(AVG(processing_time_ms)) as avg_time_ms,
        SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as zero_results
      FROM search_analytics
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Category filter usage (facet analytics)
    const categoryFacets = await executeQuery<any[]>(`
      SELECT 
        COALESCE(category_filter, 'No filter') as category,
        COUNT(*) as usage_count
      FROM search_analytics
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY category_filter
      ORDER BY usage_count DESC
    `, [days]);

    // Overall stats
    const overview = await executeQuery<any[]>(`
      SELECT
        COUNT(*) as total_searches,
        COUNT(DISTINCT query) as unique_queries,
        ROUND(AVG(processing_time_ms)) as avg_response_ms,
        ROUND(AVG(results_count)) as avg_results,
        SUM(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) as total_zero_results,
        COUNT(DISTINCT ip_address) as unique_searchers
      FROM search_analytics
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    // Product category distribution (from actual catalog — facet data)
    const productFacets = await executeQuery<any[]>(`
      SELECT 
        c.name as category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(oi.quantity), 0) as items_sold
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 AND p.deleted_at IS NULL
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `);

    // Brand distribution
    const brandFacets = await executeQuery<any[]>(`
      SELECT 
        b.name as brand,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(oi.quantity), 0) as items_sold
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.is_active = 1 AND p.deleted_at IS NULL
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY b.id, b.name
      ORDER BY product_count DESC
    `);

    // Price range distribution
    const priceRanges = await executeQuery<any[]>(`
      SELECT 
        CASE 
          WHEN CAST(retail_price AS UNSIGNED) < 1000000 THEN 'Under 1M'
          WHEN CAST(retail_price AS UNSIGNED) < 2000000 THEN '1M - 2M'
          WHEN CAST(retail_price AS UNSIGNED) < 3000000 THEN '2M - 3M'
          WHEN CAST(retail_price AS UNSIGNED) < 5000000 THEN '3M - 5M'
          ELSE 'Over 5M'
        END as price_range,
        COUNT(*) as product_count
      FROM products
      WHERE is_active = 1 AND deleted_at IS NULL
      GROUP BY price_range
      ORDER BY MIN(CAST(retail_price AS UNSIGNED))
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: overview[0] || {},
        topQueries,
        zeroResultQueries,
        searchTrend,
        facets: {
          categoryFilter: categoryFacets,
          productCategories: productFacets,
          brands: brandFacets,
          priceRanges
        }
      }
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
