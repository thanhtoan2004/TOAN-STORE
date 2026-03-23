import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

export default async function DynamicHelpPage({ params }: Props) {
  const { slug } = params;

  // Lấy nội dung trang tương ứng từ database
  const [pageData] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.isActive, 1)))
    .limit(1);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/help"
            className="text-gray-600 hover:text-black mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>

          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{pageData.title}</h1>
            <p className="text-sm text-gray-500 italic">
              Cập nhật lần cuối: {new Date(pageData.createdAt || '').toLocaleDateString('vi-VN')}
            </p>
          </header>

          <div
            className="bg-white rounded-xl p-8 shadow-sm prose prose-zinc max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: pageData.content || '' }}
          />

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 mb-4">Bài viết này có giúp ích cho bạn không?</p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-2 border border-gray-300 rounded-full hover:bg-black hover:text-white transition-all">
                Có
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-full hover:bg-black hover:text-white transition-all">
                Không
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
