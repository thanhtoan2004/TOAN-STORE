'use client';

import { useState } from 'react';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';

interface ProductReviewsProps {
    productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <section id="reviews" className="py-12 border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <h2 className="text-2xl font-bold mb-8">Đánh giá sản phẩm</h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Review Form (Sticky on Desktop) */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24">
                            <ReviewForm
                                productId={productId}
                                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                            />
                        </div>
                    </div>

                    {/* Right Column: Review List */}
                    <div className="lg:col-span-8">
                        <ReviewList
                            productId={productId}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
