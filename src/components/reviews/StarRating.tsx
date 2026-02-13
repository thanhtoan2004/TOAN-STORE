import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
    className?: string;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 16,
    interactive = false,
    onChange,
    className
}: StarRatingProps) {
    const stars = [];

    // Ensure rating is between 0 and maxRating
    const validRating = Math.max(0, Math.min(rating, maxRating));

    for (let i = 1; i <= maxRating; i++) {
        const isFull = i <= validRating;
        const isHalf = !isFull && i - 0.5 <= validRating;

        stars.push(
            <button
                key={i}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onChange?.(i)}
                className={cn(
                    "focus:outline-none transition-colors",
                    interactive ? "cursor-pointer hover:scale-110" : "cursor-default",
                    className
                )}
            >
                {isFull ? (
                    <Star
                        size={size}
                        fill="currentColor"
                        className="text-yellow-400"
                    />
                ) : isHalf ? (
                    <div className="relative">
                        <Star
                            size={size}
                            className="text-gray-300"
                        />
                        <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                            <Star
                                size={size}
                                fill="currentColor"
                                className="text-yellow-400"
                            />
                        </div>
                    </div>
                ) : (
                    <Star
                        size={size}
                        className="text-gray-300"
                    />
                )}
            </button>
        );
    }

    return (
        <div className="flex items-center space-x-0.5">
            {stars}
        </div>
    );
}
