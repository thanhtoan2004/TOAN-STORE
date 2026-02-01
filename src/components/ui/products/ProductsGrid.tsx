'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  onError
}: ProductsGridProps) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [sortOrder, setSortOrder] = useState('newest');

  // Memoize filter params string to avoid unnecessary re-fetches
  const filterParamsString = useMemo(
    () => JSON.stringify(filterParams),
    [filterParams]
  );

  const fetchProducts = useCallback(async (page: number = 1, sort: string = 'newest') => {
    try {
      setLoading(true);
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

      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.plp.generic_error;
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [filterParams, onError, t]);

  useEffect(() => {
    fetchProducts(1, sortOrder);
  }, [filterParamsString, sortOrder, fetchProducts]);

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

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title || t.plp.all_products}</h2>

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

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id.toString()}
                name={product.name}
                category={product.category}
                price={product.retail_price || product.base_price || product.price}
                sale_price={product.base_price && product.retail_price && product.base_price < product.retail_price ? product.base_price : product.sale_price}
                image_url={product.image_url}
                is_new_arrival={product.is_new_arrival}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(ProductsGrid);
