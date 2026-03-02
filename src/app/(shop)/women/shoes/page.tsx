'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductsGrid } from '@/components/ui/products';
import ProductFilter from '@/components/ui/products/ProductFilter';



export default function WomenShoesPage() {
  const { t } = useLanguage();
  const [filterParams, setFilterParams] = useState<Record<string, string>>({
    gender: 'women',
    category: 'shoes'
  });

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilterParams({
      ...newFilters,
      gender: 'women',
      category: 'shoes'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="toan-container py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link href="/women" className="hover:text-black">Nữ</Link>
            <span className="mx-2">/</span>
            <span className="text-black">Giày</span>
          </nav>
          <h1 className="text-4xl font-bold mb-2">Giày Nữ</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập giày thể thao và lifestyle dành cho nữ</p>
        </div>
      </div>

      <div className="toan-container py-8">
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
              title="Tất cả sản phẩm giày nữ"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
