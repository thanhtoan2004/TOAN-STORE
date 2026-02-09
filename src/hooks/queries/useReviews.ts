import { useQuery } from '@tanstack/react-query';

interface ReviewMedia {
    id: number;
    media_type: 'image' | 'video';
    media_url: string;
    thumbnail_url?: string;
}

interface Review {
    id: number;
    user_id: number;
    user_name: string;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    helpful_count: number;
    is_verified_purchase: boolean;
    media?: ReviewMedia[];
    admin_reply?: string;
}

interface ReviewStats {
    average_rating: number;
    total_reviews: number;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
}

interface ReviewsResponse {
    success: boolean;
    data: {
        reviews: Review[];
        statistics: ReviewStats;
        pagination: {
            total: number;
            pages: number;
            page: number;
            limit: number;
        };
    };
}

async function fetchReviews(productId: string, page: number = 1, limit: number = 10): Promise<ReviewsResponse['data']> {
    const response = await fetch(`/api/reviews?productId=${productId}&page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch reviews');
    }
    const result = await response.json();
    return result.data;
}

export function useReviews(productId: string, page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: ['reviews', productId, page, limit],
        queryFn: () => fetchReviews(productId, page, limit),
        enabled: !!productId,
        staleTime: 60 * 1000, // 1 minute
    });
}
