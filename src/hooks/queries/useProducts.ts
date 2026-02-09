import { useQuery } from '@tanstack/react-query';

interface ProductFilters {
    page?: number;
    limit?: number;
    sort?: string;
    gender?: string;
    category?: string;
    sport?: string;
    price?: string;
    minPrice?: number;
    maxPrice?: number;
    isNewArrival?: boolean;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    retail_price: number | null;
    image_url: string;
    category: string;
    is_new_arrival: boolean;
    created_at: string;
}

interface ProductsResponse {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.category) params.append('category', filters.category);
    if (filters.sport) params.append('sport', filters.sport);
    if (filters.price) params.append('price', filters.price);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.isNewArrival) params.append('isNewArrival', 'true');

    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch products');
    }
    return {
        products: data.products,
        pagination: data.pagination
    };
}

export function useProducts(filters: ProductFilters) {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: () => fetchProducts(filters),
        staleTime: 60 * 1000, // 1 minute
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}
