'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface NewsDetail {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image_url: string;
    category: string;
    author_name: string;
    published_at: string;
    views: number;
}

export default function NewsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [news, setNews] = useState<NewsDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const hasIncrementedView = React.useRef(false);

    useEffect(() => {
        if (slug && !hasIncrementedView.current) {
            hasIncrementedView.current = true;
            fetchNewsDetail();
        }
    }, [slug]);

    const fetchNewsDetail = async () => {
        try {
            const response = await fetch(`/api/news/${slug}`);
            const data = await response.json();

            if (data.success) {
                setNews(data.data);
            } else {
                setError('Không tìm thấy tin tức');
            }
        } catch (err) {
            console.error('Error fetching news:', err);
            setError('Lỗi khi tải tin tức');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Đang tải...</p>
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Không tìm thấy tin tức</h2>
                    <Link href="/news" className="text-black underline">
                        ← Quay lại danh sách tin tức
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="nike-container py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Link href="/news" className="text-gray-600 hover:text-black">
                            ← Quay lại tin tức
                        </Link>
                    </div>

                    {/* Article */}
                    <article className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Header Image */}
                        {news.image_url && (
                            <div className="relative h-96">
                                <Image
                                    src={news.image_url}
                                    alt={news.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}

                        <div className="p-8 md:p-12">
                            {/* Category Badge */}
                            {news.category && (
                                <span className="inline-block px-3 py-1 bg-black text-white text-sm rounded mb-4">
                                    {news.category}
                                </span>
                            )}

                            {/* Title */}
                            <h1 className="text-4xl font-bold mb-4">{news.title}</h1>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                                {news.author_name && (
                                    <span>Tác giả: {news.author_name}</span>
                                )}
                                <span>•</span>
                                <span>{formatDate(news.published_at)}</span>
                                <span>•</span>
                                <span>{news.views} lượt xem</span>
                            </div>

                            {/* Excerpt */}
                            {news.excerpt && (
                                <p className="text-xl text-gray-700 leading-relaxed mb-8 font-helvetica-medium">
                                    {news.excerpt}
                                </p>
                            )}

                            {/* Content */}
                            <div
                                className="prose prose-lg max-w-none"
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.8'
                                }}
                            >
                                {news.content}
                            </div>

                            {/* Share Buttons (Optional) */}
                            <div className="mt-12 pt-8 border-t">
                                <p className="text-sm text-gray-600 mb-4">Chia sẻ bài viết:</p>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        Facebook
                                    </button>
                                    <button className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">
                                        Twitter
                                    </button>
                                    <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                                        Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Back to News */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/news"
                            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                        >
                            Xem thêm tin tức khác
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
