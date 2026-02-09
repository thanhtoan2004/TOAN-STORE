import { useQuery } from '@tanstack/react-query';

interface Banner {
    id: number;
    title: string;
    description: string;
    image_url: string;
    link_text: string;
    link_url: string;
    position: string;
    is_active: boolean;
}

async function fetchBanners(position?: string, activeOnly: boolean = true): Promise<Banner[]> {
    const params = new URLSearchParams();
    if (position) params.append('position', position);
    if (activeOnly) params.append('activeOnly', 'true');

    const response = await fetch(`/api/banners?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch banners');
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch banners');
    }
    return data.data;
}

export function useBanners(position?: string, activeOnly: boolean = true) {
    return useQuery({
        queryKey: ['banners', position, activeOnly],
        queryFn: () => fetchBanners(position, activeOnly),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
