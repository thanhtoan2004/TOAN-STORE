'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/date-utils';

interface AuthorInfo {
    id: number;
    full_name: string;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    role: string;
}

interface NewsArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image_url: string;
    category: string;
    published_at: string;
    views: number;
}

export default function AuthorProfilePage() {
    const params = useParams();
    const authorId = params?.id as string;

    const [author, setAuthor] = useState<AuthorInfo | null>(null);
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authorId) {
            fetchAuthorProfile();
        }
    }, [authorId]);

    const fetchAuthorProfile = async () => {
        try {
            const response = await fetch(`/api/news/author/${authorId}`);
            const data = await response.json();

            if (data.success) {
                setAuthor(data.data.author);
                setArticles(data.data.articles);
            } else {
                setError('Không tìm thấy tác giả');
            }
        } catch (err) {
            console.error('Error fetching author:', err);
            setError('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            </div>
        );
    }

    if (error || !author) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Không tìm thấy tác giả</h2>
                    <Link href="/news" className="text-black underline">
                        ← Quay lại tin tức
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-12">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <Link href="/news" className="text-gray-500 hover:text-black text-sm">
                        ← Quay lại tin tức
                    </Link>
                </div>

                {/* Author Card */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
                            {author.avatar_url ? (
                                <Image
                                    src={author.avatar_url}
                                    alt={author.full_name || author.username}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (author.full_name || author.username || 'A').charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {author.full_name || author.username}
                            </h1>
                            <p className="text-gray-500 mt-1 capitalize">{author.role || 'Writer'}</p>

                            {author.bio && (
                                <p className="text-gray-600 mt-4 leading-relaxed max-w-2xl">
                                    {author.bio}
                                </p>
                            )}

                            <div className="mt-4 flex items-center gap-4 justify-center md:justify-start">
                                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                                    <span className="font-bold text-gray-900">{articles.length}</span>
                                    <span className="text-gray-500 ml-1">bài viết</span>
                                </div>
                                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                                    <span className="font-bold text-gray-900">
                                        {articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString('vi-VN')}
                                    </span>
                                    <span className="text-gray-500 ml-1">lượt xem</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Articles */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Bài viết của {author.full_name || author.username}
                </h2>

                {articles.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500">Tác giả chưa có bài viết nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <article
                                key={article.id}
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="relative h-44">
                                    {article.image_url ? (
                                        <Image
                                            src={article.image_url}
                                            alt={article.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">No Image</span>
                                        </div>
                                    )}
                                    {article.category && (
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-black text-white text-xs px-2 py-1 rounded">
                                                {article.category}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                        <span>{formatDate(article.published_at)}</span>
                                        <span>•</span>
                                        <span>{article.views || 0} views</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {article.title}
                                    </h3>
                                    {article.excerpt && (
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                            {article.excerpt}
                                        </p>
                                    )}
                                    <Link
                                        href={`/news/${article.slug}`}
                                        className="text-black text-sm font-medium hover:underline"
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
    );
}
