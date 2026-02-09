import { useQuery } from '@tanstack/react-query';

async function checkPurchase(userId: string | number | undefined, productId: string | number): Promise<boolean> {
    if (!userId || !productId) return false;
    const response = await fetch(`/api/reviews/check-purchase?userId=${userId}&productId=${productId}`);
    if (!response.ok) {
        return false;
    }
    const result = await response.json();
    return result.success ? result.data.hasPurchased : false;
}

export function useCheckPurchase(userId: string | number | undefined, productId: string | number) {
    return useQuery({
        queryKey: ['check-purchase', userId, productId],
        queryFn: () => checkPurchase(userId, productId),
        enabled: !!userId && !!productId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
