'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import ReviewMediaUpload from './ReviewMediaUpload';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
    productId: number;
    onSuccess: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (!title.trim() || !comment.trim()) {
            toast.error('Vui lòng nhập tiêu đề và nội dung đánh giá');
            return;
        }

        try {
            setSubmitting(true);
            const uploadedMedia: { url: string; type: string; size: number }[] = [];

            // 1. Upload media if any
            if (mediaFiles.length > 0) {
                const uploadPromises = mediaFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);

                    const res = await fetch('/api/reviews/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) {
                        throw new Error(`Lỗi upload ảnh: ${file.name}`);
                    }

                    const data = await res.json();
                    if (data.success && data.data) {
                        return data.data; // { url, type, size }
                    }
                    return null;
                });

                const results = await Promise.all(uploadPromises);
                results.forEach(item => {
                    if (item) uploadedMedia.push(item);
                });
            }

            // 2. Submit Review
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    rating,
                    title,
                    comment,
                    media: uploadedMedia
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            // Success
            toast.success('Gửi đánh giá thành công! Đang chờ duyệt.');
            setRating(0);
            setTitle('');
            setComment('');
            setMediaFiles([]);
            onSuccess();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Đánh giá chung</label>
                <div
                    className="flex items-center gap-2"
                    onMouseLeave={() => setHoverRating(0)}
                >
                    <StarRating
                        rating={hoverRating || rating}
                        size={24}
                        interactive
                        onChange={setRating}
                        className="hover:text-yellow-500"
                    />
                    <span className="text-sm text-gray-500 min-w-[100px]">
                        {rating ? (
                            rating === 5 ? 'Tuyệt vời' :
                                rating === 4 ? 'Hài lòng' :
                                    rating === 3 ? 'Bình thường' :
                                        rating === 2 ? 'Không hài lòng' : 'Tệ'
                        ) : 'Chọn số sao'}
                    </span>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tóm tắt trải nghiệm của bạn"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    maxLength={100}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nội dung</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bạn thích điều gì về sản phẩm này? Bạn có lời khuyên gì cho người mua khác không?"
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    maxLength={1000}
                />
            </div>

            {/* Media Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Thêm hình ảnh/video (Tối đa 3)</label>
                <ReviewMediaUpload
                    onMediaChange={setMediaFiles}
                    maxImages={3}
                    maxVideos={1}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Gửi đánh giá'}
            </button>
        </form>
    );
}
