
import { MetadataRoute } from 'next';
import { executeQuery } from '@/lib/db/mysql';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes = [
        '',
        '/women',
        '/men',
        '/kids',
        '/about',
        '/help',
        '/store',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    try {
        const products = await executeQuery(
            'SELECT id, updated_at FROM products WHERE is_active = 1'
        ) as any[];

        const productRoutes = products.map((product) => ({
            url: `${BASE_URL}/products/${product.id}`,
            lastModified: new Date(product.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        return [...routes, ...productRoutes];
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return routes;
    }
}
