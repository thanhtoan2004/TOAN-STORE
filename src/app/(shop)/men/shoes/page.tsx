'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  base_price: number;
  retail_price: number;
  image_url: string;
  category: string;
}

export default function MenShoesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?gender=men&category=shoes&limit=24');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="nike-container py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link href="/men" className="hover:text-black">Nam</Link>
            <span className="mx-2">/</span>
            <span className="text-black">Giày</span>
          </nav>
          <h1 className="text-4xl font-nike-futura mb-2">Giày Nam</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập giày thể thao và lifestyle dành cho nam</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="nike-container py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={product.image_url || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{product.category}</p>
                    <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {product.base_price < product.retail_price ? (
                        <>
                          <span className="font-medium">{formatPrice(product.base_price)}</span>
                          <span className="text-sm text-gray-500 line-through">{formatPrice(product.retail_price)}</span>
                        </>
                      ) : (
                        <span className="font-medium">{formatPrice(product.retail_price || product.base_price)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
