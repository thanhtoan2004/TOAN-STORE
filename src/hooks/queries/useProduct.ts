import { useQuery } from '@tanstack/react-query';

interface Product {
    id: string | number;
    name: string;
    slug: string;
    category: string;
    price: number;
    sale_price?: number;
    base_price?: number;
    retail_price?: number;
    image_url: string;
    description?: string;
    is_new_arrival: boolean;
    created_at: string;
    images?: Array<{ url: string; alt_text?: string; media_type?: 'image' | 'video' }>;
    sizes?: Array<{
        size: string;
        stock: number;
        reserved?: number;
        allow_backorder?: number;
        expected_restock_date?: string | null;
    }>;
    attributes?: Array<{
        name: string;
        slug: string;
        type: string;
        value_text?: string;
        option_label?: string;
        option_value?: string;
    }>;
}

async function fetchProduct(id: string): Promise<Product | null> {
    const response = await fetch(`/api/products/${id}`);
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error('Failed to fetch product');
    }
    const result = await response.json();
    return result.data || result;
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => fetchProduct(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
