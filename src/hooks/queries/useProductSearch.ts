import { useQuery } from '@tanstack/react-query';

interface SearchParams {
  q: string;
  category?: string;
  limit?: number;
  offset?: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_cache: number;
  msrp_price: number | null;
  image_url: string | null;
  is_new_arrival: boolean;
  category: string;
}

interface SearchResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  query: string;
}

async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.category) searchParams.append('category', params.category);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const response = await fetch(`/api/products/search?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to search products');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to search products');
  }
  return data.data;
}

export function useProductSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['productSearch', params],
    queryFn: () => searchProducts(params),
    enabled: !!params.q && params.q.trim().length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}
