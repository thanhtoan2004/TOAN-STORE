'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useComparison, CompareProduct } from '@/contexts/ComparisonContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ArrowLeft, ShoppingBag } from 'lucide-react';
import { imageService } from '@/lib/images/image-service';

export default function ComparePage() {
  const { items, removeFromCompare, clearAll } = useComparison();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const formatPrice = (price: number) => price.toLocaleString('vi-VN');

  const hasDiscount = (p: CompareProduct) =>
    (p.sale_price || 0) > 0 && (p.sale_price || 0) < (p.price || 0);
  const discountPercent = (p: CompareProduct) =>
    hasDiscount(p)
      ? Math.round((((p.price || 0) - (p.sale_price || 0)) / (p.price || 1)) * 100)
      : 0;

  // Comparison attributes
  const attributes = [
    {
      label: isVi ? 'Danh mục' : 'Category',
      getValue: (p: CompareProduct) => p.category,
    },
    {
      label: isVi ? 'Giá gốc' : 'Original Price',
      getValue: (p: CompareProduct) => `${formatPrice(p.price || 0)} ₫`,
    },
    {
      label: isVi ? 'Giá bán' : 'Sale Price',
      getValue: (p: CompareProduct) =>
        hasDiscount(p) ? `${formatPrice(p.sale_price || 0)} ₫` : '—',
    },
    {
      label: isVi ? 'Giảm giá' : 'Discount',
      getValue: (p: CompareProduct) => (hasDiscount(p) ? `-${discountPercent(p)}%` : '—'),
    },
    {
      label: isVi ? 'Hàng mới' : 'New Arrival',
      getValue: (p: CompareProduct) =>
        p.is_new_arrival ? (
          <div className="flex items-center justify-center gap-1.5 text-green-600">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{isVi ? 'Có' : 'Yes'}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
            <span className="font-medium">{isVi ? 'Không' : 'No'}</span>
          </div>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="toan-container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/categories"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  {isVi ? 'So sánh sản phẩm' : 'Compare Products'}
                </h1>
                <p className="text-sm text-gray-500">
                  {items.length} {isVi ? 'sản phẩm' : 'products'}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                {isVi ? 'Xóa tất cả' : 'Clear All'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="toan-container py-6">
        {items.length < 2 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold mb-2">
              {isVi
                ? 'Chọn ít nhất 2 sản phẩm để so sánh'
                : 'Select at least 2 products to compare'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isVi
                ? 'Bấm nút so sánh trên trang sản phẩm để thêm sản phẩm vào đây'
                : 'Click the compare button on product pages to add products here'}
            </p>
            <Link
              href="/categories"
              className="inline-block px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
            >
              {isVi ? 'Xem sản phẩm' : 'Browse Products'}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {/* Product images + names */}
            <div
              className="grid border-b"
              style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
            >
              <div className="p-4 bg-gray-50 flex items-end">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  {isVi ? 'Sản phẩm' : 'Product'}
                </span>
              </div>
              {items.map((item) => (
                <div key={item.id} className="p-4 text-center relative group">
                  <button
                    onClick={() => removeFromCompare(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <Link href={`/products/${item.slug || item.id}`}>
                    <div className="w-32 h-32 mx-auto mb-3 rounded-xl overflow-hidden bg-[#f5f5f5]">
                      <Image
                        src={imageService.getUrl(item.image_url, { preset: 'PRODUCT_CARD' })}
                        alt={item.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 hover:text-gray-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="mt-2">
                    {hasDiscount(item) ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-red-600">
                          {formatPrice(item.sale_price || 0)} ₫
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item.price || 0)} ₫
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold">{formatPrice(item.price || 0)} ₫</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            {attributes.map((attr, i) => (
              <div
                key={attr.label}
                className={`grid ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
              >
                <div className="p-4 flex items-center">
                  <span className="text-sm font-medium text-gray-600">{attr.label}</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="p-4 text-center flex items-center justify-center">
                    <span className="text-sm text-gray-800">{attr.getValue(item)}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Row */}
            <div
              className="grid border-t"
              style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}
            >
              <div className="p-4" />
              {items.map((item) => (
                <div key={item.id} className="p-4 text-center">
                  <Link
                    href={`/products/${item.slug || item.id}`}
                    className="inline-block px-5 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"
                  >
                    {isVi ? 'Xem chi tiết' : 'View Details'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
