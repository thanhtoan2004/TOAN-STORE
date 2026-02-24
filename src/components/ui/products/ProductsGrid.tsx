'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import ProductCard from './ProductCard';
import Pagination from './Pagination';

interface ProductType {
  id: number;
  name: string;
  category: string;
  price: number;
  sale_price?: number;
  image_url: string;
  is_new_arrival?: boolean;
  created_at: string;
  base_price?: number;
  retail_price?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsGridProps {
  title?: string;
  showSortOptions?: boolean;
  filterParams?: Record<string, string>;
  onError?: (error: Error) => void;
  enableInfiniteScroll?: boolean;
}

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// Error state component
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

import { useLanguage } from '@/contexts/LanguageContext';

const ErrorState = memo(({ error, onRetry }: ErrorStateProps) => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-red-800 mb-2">{t.plp.error_title}</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {t.plp.try_again}
        </button>
      </div>
    </div>
  );
});
ErrorState.displayName = 'ErrorState';

// Empty state component
const EmptyState = memo(() => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-12">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.plp.empty_title}</h3>
        <p className="text-gray-600">{t.plp.empty_desc}</p>
      </div>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';

const ProductsGrid = ({
  title,
  showSortOptions = true,
  filterParams = {},
  onError,
  enableInfiniteScroll: enableInfiniteScrollProp = true
}: ProductsGridProps) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [sortOrder, setSortOrder] = useState('newest');
  const [infiniteScroll, setInfiniteScroll] = useState(enableInfiniteScrollProp);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Memoize filter params string to avoid unnecessary re-fetches
  const filterParamsString = useMemo(
    () => JSON.stringify(filterParams),
    [filterParams]
  );

  const fetchProducts = useCallback(async (page: number = 1, sort: string = 'newest', append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
        ...filterParams
      });

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error(t.plp.loading_error);
      }

      const data = await response.json();
      const newProducts = data.products || [];
      const newPagination = data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      setPagination(newPagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.plp.generic_error;
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterParams, onError, t]);

  useEffect(() => {
    fetchProducts(1, sortOrder);
  }, [filterParamsString, sortOrder, fetchProducts]);

  // Infinite scroll: IntersectionObserver
  useEffect(() => {
    if (!infiniteScroll || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && pagination.page < pagination.totalPages) {
          fetchProducts(pagination.page + 1, sortOrder, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [infiniteScroll, loadingMore, pagination.page, pagination.totalPages, sortOrder, fetchProducts]);

  const handleSortChange = useCallback((newSort: string) => {
    setSortOrder(newSort);
    fetchProducts(1, newSort);
  }, [fetchProducts]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchProducts(newPage, sortOrder);
  }, [fetchProducts, sortOrder]);

  const handleRetry = useCallback(() => {
    fetchProducts(pagination.page, sortOrder);
  }, [fetchProducts, pagination.page, sortOrder]);

  const toggleScrollMode = useCallback(() => {
    setInfiniteScroll(prev => {
      const next = !prev;
      localStorage.setItem('nike_scroll_mode', next ? 'infinite' : 'pagination');
      // Reset to page 1 when switching modes
      fetchProducts(1, sortOrder);
      return next;
    });
  }, [fetchProducts, sortOrder]);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nike_scroll_mode');
    if (saved === 'infinite') setInfiniteScroll(true);
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">{title || t.plp.all_products}</h2>

        <div className="flex items-center gap-3">
          {/* Scroll mode toggle */}
          <button
            onClick={toggleScrollMode}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:border-gray-400 transition-all"
            title={infiniteScroll ? 'Switch to Pagination' : 'Switch to Infinite Scroll'}
          >
            {infiniteScroll ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Pagination
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                Infinite Scroll
              </>
            )}
          </button>

          {showSortOptions && (
            <select
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="newest">{t.plp.sort_newest}</option>
              <option value="price-asc">{t.plp.sort_price_asc}</option>
              <option value="price-desc">{t.plp.sort_price_desc}</option>
              <option value="discount">{t.plp.sort_discount}</option>
            </select>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => {
              // Ensure retail_price/base_price parsing and correct display mapping
              const originalPrice = product.retail_price ? Number(product.retail_price) : Number(product.base_price || product.price || 0);
              const salePriceValue = (product.base_price && product.retail_price && product.base_price < product.retail_price)
                ? Number(product.base_price)
                : (product.sale_price ? Number(product.sale_price) : undefined);

              return (
                <ProductCard
                  key={`${product.id}-${index}`}
                  id={product.id.toString()}
                  name={product.name}
                  category={product.category}
                  price={originalPrice}
                  sale_price={salePriceValue}
                  image_url={product.image_url}
                  is_new_arrival={Boolean(product.is_new_arrival)}
                />
              );
            })}
          </div>

          {infiniteScroll ? (
            <div className="w-full mt-8">
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4 w-full" />
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-3 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    <span className="text-sm font-medium">Đang tải thêm...</span>
                  </div>
                </div>
              )}
              {pagination.page >= pagination.totalPages && products.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-8">
                  Đã hiển thị tất cả {pagination.total} sản phẩm
                </p>
              )}
            </div>
          ) : (
            pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default memo(ProductsGrid);
