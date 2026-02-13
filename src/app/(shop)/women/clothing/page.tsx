'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductsGrid } from '@/components/ui/products';
import ProductFilter from '@/components/ui/products/ProductFilter';



export default function WomenClothingPage() {
  const { t } = useLanguage();
  const [filterParams, setFilterParams] = useState<Record<string, string>>({
    gender: 'women',
    category: 'clothing'
  });

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilterParams({
      ...newFilters,
      gender: 'women',
      category: 'clothing'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="nike-container py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link href="/women" className="hover:text-black">Nữ</Link>
            <span className="mx-2">/</span>
            <span className="text-black">Quần áo</span>
          </nav>
          <h1 className="text-4xl font-bold mb-2">Quần áo Nữ</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập quần áo thể thao và lifestyle dành cho nữ</p>
        </div>
      </div>

      <div className="nike-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <ProductFilter
              filterParams={filterParams}
              onFilterChange={handleFilterChange}
            />
          </aside>

          <div className="flex-1">
            <ProductsGrid
              filterParams={filterParams}
              title="Tất cả sản phẩm quần áo nữ"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
