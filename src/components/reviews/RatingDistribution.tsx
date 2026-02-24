'use client';

import { Star } from 'lucide-react';

interface RatingDistributionProps {
    statistics: {
        average_rating: number;
        total_reviews: number;
        five_star: number;
        four_star: number;
        three_star: number;
        two_star: number;
        one_star: number;
    };
    onFilterByRating: (rating: number | null) => void;
    currentFilter: number | null;
}

export function RatingDistribution({ statistics, onFilterByRating, currentFilter }: RatingDistributionProps) {
    const { average_rating, total_reviews, five_star, four_star, three_star, two_star, one_star } = statistics;

    const distribution = [
        { stars: 5, count: five_star },
        { stars: 4, count: four_star },
        { stars: 3, count: three_star },
        { stars: 2, count: two_star },
        { stars: 1, count: one_star },
    ];

    return (
        <div className="bg-white p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">

                {/* Average Rating */}
                <div className="text-center md:text-left">
                    <div className="flex items-end gap-2 justify-center md:justify-start">
                        <span className="text-5xl font-bold">{average_rating.toFixed(1)}</span>
                        <span className="text-gray-500 mb-2">/ 5</span>
                    </div>

                    <div className="flex justify-center md:justify-start gap-1 my-2 text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={20}
                                fill={star <= Math.round(average_rating) ? "currentColor" : "none"}
                                className={star <= Math.round(average_rating) ? "" : "text-gray-300"}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500">{total_reviews} đánh giá</p>
                </div>

                {/* Rating Distribution Bars */}
                <div className="lg:col-span-2 space-y-2">
                    {distribution.map(({ stars, count }) => {
                        const percentage = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
                        const isSelected = currentFilter === stars;

                        return (
                            <button
                                key={stars}
                                onClick={() => onFilterByRating(isSelected ? null : stars)}
                                className={`w-full flex items-center gap-3 text-sm group hover:bg-gray-50 p-1 rounded transition-colors ${isSelected ? 'bg-gray-100 ring-1 ring-black' : ''}`}
                            >
                                <span className={`flex items-center w-12 font-medium ${isSelected ? 'text-black' : 'text-gray-600'}`}>
                                    {stars} <Star size={12} className="ml-1 fill-current" />
                                </span>

                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <span className="w-10 text-right text-gray-500 text-xs">
                                    {count} ({Math.round(percentage)}%)
                                </span>
                            </button>
                        );
                    })}

                    {currentFilter && (
                        <div className="text-right mt-2">
                            <button
                                onClick={() => onFilterByRating(null)}
                                className="text-xs text-gray-500 hover:text-black underline"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
