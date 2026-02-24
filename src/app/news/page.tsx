'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/date-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  category: string;
  published_at: string;
}

export default function NewsPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchNews = useCallback(async (category = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20' });
      if (category) params.set('category', category);

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNewsItems(data.data.news || []);

        // Extract unique categories on initial full load
        if (!category && categories.length === 0) {
          const cats = [...new Set((data.data.news || []).map((n: NewsItem) => n.category).filter(Boolean))] as string[];
          setCategories(cats);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory, fetchNews]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            {isVi ? 'Tin Tức' : 'News'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isVi ? 'Cập nhật những tin tức mới nhất từ TOAN Store' : 'Latest news from TOAN Store'}
          </p>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <button
                onClick={() => setActiveCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!activeCategory ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                  }`}
              >
                {isVi ? 'Tất cả' : 'All'}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải tin tức...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có tin tức nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsItems.map((item) => (
                <article key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    {item.category && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-black text-white text-xs px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">{formatDate(item.published_at)}</p>
                    <h2 className="text-xl font-helvetica-medium mb-3">{item.title}</h2>
                    <p className="text-gray-600 text-sm mb-4">{item.excerpt}</p>
                    <Link
                      href={`/news/${item.slug}`}
                      className="text-black font-helvetica-medium hover:underline text-sm"
                    >
                      Đọc thêm →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

