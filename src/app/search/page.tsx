'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ui/products/ProductCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      // Search products by name or category
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery)}`);
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Tìm Kiếm</h1>

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
                      id={product.id}
                      name={product.name}
                      category={product.category}
                      price={product.price}
                      sale_price={product.sale_price}
                      image_url={product.image_url}
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

