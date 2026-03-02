'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  helpful_count: number;
  category_id: number;
  category_name: string;
  category_slug: string;
}

interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const url = selectedCategory
        ? `/api/faqs?categoryId=${selectedCategory}`
        : '/api/faqs';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setFaqs(data.data.faqs);
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const helpCategories = [
    {
      title: 'Đơn Hàng',
      links: [
        { name: 'Trạng Thái Đơn Hàng', href: '/orders' },
        { name: 'Vận Chuyển Và Giao Hàng', href: '/help/shipping-delivery' },
        { name: 'Trả Hàng', href: '/help/returns' },
        { name: 'Hủy Đơn', href: '/help/order-cancellation' },
      ]
    },
    {
      title: 'Thanh Toán',
      links: [
        { name: 'Tùy Chọn Thanh Toán', href: '/help/payment-options' },
        { name: 'Số Dư Thẻ Quà Tặng', href: '/gift-card-balance' },
      ]
    },
    {
      title: 'Tài Khoản',
      links: [
        { name: 'Quản Lý Tài Khoản', href: '/account' },
        { name: 'Đăng Ký Thành Viên', href: '/sign-up' },
      ]
    },
    {
      title: 'Sản Phẩm',
      links: [
        { name: 'Hướng Dẫn Chọn Size', href: '/help/size-guide' },
        { name: 'Chính Sách Bảo Hành', href: '/help/warranty' },
      ]
    },
    {
      title: 'Liên Hệ',
      links: [
        { name: 'Liên Hệ Chúng Tôi', href: '/help/contact' },
        { name: 'Tìm Cửa Hàng', href: '/store' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Trung Tâm Trợ Giúp</h1>
          <p className="text-gray-600 mb-8">
            Chúng tôi ở đây để giúp bạn. Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {helpCategories.map((category) => (
              <div key={category.title} className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-helvetica-medium mb-4">{category.title}</h2>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-600 hover:text-black transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-helvetica-medium">Câu Hỏi Thường Gặp</h2>
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${selectedCategory === null
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${selectedCategory === cat.id
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-8">Đang tải câu hỏi...</p>
            ) : faqs.length > 0 ? (
              <div className="space-y-6">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <h3 className="font-helvetica-medium mb-2 text-lg">{faq.question}</h3>
                    <p className="text-gray-600 mb-2">{faq.answer.replace(/<[^>]*>/g, '')}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-gray-100 rounded-full">{faq.category_name}</span>
                      {faq.helpful_count > 0 && (
                        <span>👍 {faq.helpful_count} người thấy hữu ích</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Không có câu hỏi nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

