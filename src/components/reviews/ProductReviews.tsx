"use client";

import { useState, useEffect } from 'react';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { RatingDistribution } from './RatingDistribution';

interface ProductReviewsProps {
    productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [statistics, setStatistics] = useState<any>(null);

    // Fetch stats separately or pass back from ReviewList? 
    // To keep it simple, we can fetch stats here or inside RatingDistribution if we pass productId.
    // Better strategy: ReviewList fetches data including stats, and we might need to lift state up.
    // OR: Just fetch stats once here for the distribution.

    // Let's refactor: ReviewList fetches everything. 
    // BUT RatingDistribution needs stats. 
    // We will let ReviewList pass stats up to parent.

    const handleStatsLoaded = (stats: any) => {
        setStatistics(stats);
    };

    return (
        <section id="reviews" className="py-12 border-t mt-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <h2 className="text-2xl font-bold mb-8">Đánh giá sản phẩm</h2>

                {statistics && (
                    <RatingDistribution
                        statistics={statistics}
                        onFilterByRating={setFilterRating}
                        currentFilter={filterRating}
                    />
                )}

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
                            filterRating={filterRating}
                            onStatsLoaded={handleStatsLoaded}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
