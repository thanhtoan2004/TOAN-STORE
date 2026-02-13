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
    refreshTrigger?: number; // Used to trigger reload when new review added
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        fetchReviews();
    }, [productId, page, sortBy, refreshTrigger]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reviews?productId=${productId}&page=${page}&limit=5&sort=${sortBy}`);
            const data = await res.json();

            if (data.success) {
                setReviews(data.data.reviews);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
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

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <div className="flex items-center gap-4">
                                <span>{review.user_name || 'Người dùng ẩn danh'}</span>
                                {review.is_verified_purchase && (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle size={12} />
                                        <span>Đã mua hàng</span>
                                    </div>
                                )}
                            </div>
                            {/* Helpful button placeholder for future V2 */}
                            {/* <button className="flex items-center gap-1 hover:text-black">
                                <ThumbsUp size={12} />
                                <span>Hữu ích ({review.helpful_count})</span>
                            </button> */}
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
