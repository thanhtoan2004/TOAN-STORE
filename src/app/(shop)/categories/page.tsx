"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductsGrid } from '@/components/ui/products';
import ProductFilter from '@/components/ui/products/ProductFilter';

interface FilterParams {
  [key: string]: string;
}

import { useLanguage } from '@/contexts/LanguageContext';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}

function CategoriesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL on mount
  useEffect(() => {
    const params: FilterParams = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setFilterParams(params);
  }, [searchParams]);

  const handleFilterChange = (newFilters: FilterParams) => {
    // Replace completely instead of merging to ensure proper state update
    const cleanedFilters: FilterParams = {};
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] && newFilters[key] !== '') {
        cleanedFilters[key] = newFilters[key];
      }
    });
    setFilterParams(cleanedFilters);
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [filterParams]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex justify-center items-center mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">{t.plp.error_title}</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            {t.plp.try_again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.plp.title}</h1>
        <p className="text-gray-600">{t.plp.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <ProductFilter
              filterParams={filterParams}
              onFilterChange={handleFilterChange}
            />
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProductsGrid
              title={t.plp.all_products}
              showSortOptions={true}
              filterParams={filterParams}
              onError={(err: Error) => setError(err.message)}
            />
          )}
        </div>
      </div>
    </div>
  );
}


