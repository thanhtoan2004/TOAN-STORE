'use client';

import { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import { ThumbsUp, CheckCircle, MoreVertical } from 'lucide-react';

interface Review {
    id: number;
    user_name: string;
    user_avatar?: string;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    is_verified_purchase: boolean;
    helpful_count: number;
    media: {
        id: number;
        media_url: string;
        media_type: 'image' | 'video';
    }[];
}

interface ReviewListProps {
    productId: number;
    refreshTrigger?: number;
    filterRating: number | null;
    onStatsLoaded?: (stats: any) => void;
}

export function ReviewList({ productId, refreshTrigger, filterRating, onStatsLoaded }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        setPage(1); // Reset page when filter changes
    }, [filterRating, sortBy]);

    useEffect(() => {
        fetchReviews();
    }, [productId, page, sortBy, refreshTrigger, filterRating]);

    const fetchReviews = async () => {
        if (!productId || isNaN(productId)) return;
        try {
            setLoading(true);
            let url = `/api/reviews?productId=${productId}&page=${page}&limit=5&sort=${sortBy}`;
            if (filterRating) {
                url += `&rating=${filterRating}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setReviews(data.data.reviews);
                setTotalPages(data.data.pagination.totalPages);
                if (data.data.statistics && onStatsLoaded) {
                    onStatsLoaded(data.data.statistics);
                }
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpful = async (reviewId: number) => {
        try {
            await fetch('/api/reviews/helpful', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId })
            });
            // Optimistic update
            setReviews(prev => prev.map(r =>
                r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
            ));
        } catch (error) {
            console.error('Failed to mark helpful:', error);
        }
    };

    if (loading && reviews.length === 0) {
        return <div className="text-center py-8">Đang tải đánh giá...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">Chưa có đánh giá nào cho sản phẩm này.</p>
                <p className="text-sm text-gray-400">Hãy là người đầu tiên chia sẻ cảm nhận của bạn!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="font-semibold text-lg">{reviews.length} Đánh giá</h3>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border rounded-md px-3 py-1 text-sm bg-white"
                >
                    <option value="newest">Mới nhất</option>
                    <option value="highest">Điểm cao nhất</option>
                    <option value="lowest">Điểm thấp nhất</option>
                </select>
            </div>

            <div className="space-y-8">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} size={14} />
                                <span className="font-medium text-sm">{review.title}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: vi })}
                            </span>
                        </div>

                        <div className="mb-3">
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {review.comment}
                            </p>
                        </div>

                        {review.media && review.media.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                {review.media.map((item) => (
                                    <div key={item.id} className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border">
                                        <Image
                                            src={item.media_url}
                                            alt="Review image"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-4 bg-gray-50/50 p-3 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm flex-shrink-0">
                                    {review.user_avatar ? (
                                        <Image
                                            src={review.user_avatar}
                                            alt={review.user_name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black text-white text-[10px] font-bold">
                                            {(review.user_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-gray-900 leading-none">
                                        {(review.user_name && review.user_name !== '0') ? review.user_name : 'Người dùng ẩn danh'}
                                    </span>
                                    {review.is_verified_purchase && (
                                        <div className="flex items-center gap-1 text-green-600 text-[10px] font-medium">
                                            <CheckCircle size={10} />
                                            <span>Đã xác thực mua hàng</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleHelpful(review.id)}
                                className="flex items-center gap-1.5 hover:text-black transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm active:scale-95"
                            >
                                <ThumbsUp size={12} className="text-gray-400" />
                                <span className="font-helvetica-bold">Hữu ích ({review.helpful_count})</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <span className="px-3 py-1 text-sm flex items-center">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}
