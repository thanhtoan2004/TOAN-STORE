'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ui/products/ProductCard';
import { useProductSearch } from '@/hooks/queries/useProductSearch';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: searchData, isLoading: loading } = useProductSearch({
    q: query,
    limit: 12
  });

  const products = searchData?.products || [];

  const [searchQuery, setSearchQuery] = useState(query);

  // Effect to sync search query input when URL matches
  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Tìm Kiếm</h1>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Tìm Kiếm
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-600">Đang tìm kiếm...</p>
            </div>
          ) : query ? (
            <>
              <p className="text-gray-600 mb-6">
                Tìm thấy {products.length} kết quả cho "{query}"
              </p>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={String(product.id)}
                      name={product.name}
                      category={product.category || ''}
                      price={product.retail_price || product.base_price || 0}
                      sale_price={product.base_price && product.retail_price && product.base_price < product.retail_price ? product.base_price : undefined}
                      image_url={product.image_url || '/placeholder.png'}
                      is_new_arrival={product.is_new_arrival}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-600 mb-4">Không tìm thấy sản phẩm nào.</p>
                  <Link href="/" className="text-black underline">
                    Quay lại trang chủ
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">Nhập từ khóa để tìm kiếm sản phẩm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

