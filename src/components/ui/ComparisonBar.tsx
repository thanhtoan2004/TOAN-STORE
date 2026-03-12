'use client';

import { useComparison } from '@/contexts/ComparisonContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { X, GitCompareArrows, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageService } from '@/lib/images/image-service';

export default function ComparisonBar() {
  const { items, removeFromCompare, clearAll } = useComparison();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[9997] bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="toan-container py-3">
          <div className="flex items-center gap-4">
            {/* Product thumbnails */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              {items.map((item) => (
                <div key={item.id} className="relative flex-shrink-0 group">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={imageService.getUrl(item.image_url, { preset: 'PRODUCT_CARD' })}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(item.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: 4 - items.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"
                />
              ))}
            </div>

            {/* Info */}
            <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">
              {items.length}/4 {isVi ? 'sản phẩm' : 'items'}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clearAll}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title={isVi ? 'Xóa tất cả' : 'Clear all'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Link
                href="/compare"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
                  items.length >= 2
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 pointer-events-none'
                }`}
              >
                <GitCompareArrows className="w-4 h-4" />
                {isVi ? 'So sánh' : 'Compare'}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
