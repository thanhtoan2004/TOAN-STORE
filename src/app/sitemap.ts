import { MetadataRoute } from 'next';
import { executeQuery } from '@/lib/db/mysql';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Fetch all active products
    let products: any[] = [];
    try {
        products = await executeQuery<any[]>(
            'SELECT id, updated_at FROM products WHERE is_active = 1'
        );
    } catch (error) {
        console.error('Sitemap Products Error:', error);
    }

    // Fetch all active categories
    let categories: any[] = [];
    try {
        categories = await executeQuery<any[]>(
            'SELECT slug, updated_at FROM categories WHERE is_active = 1'
        );
    } catch (error) {
        console.error('Sitemap Categories Error:', error);
    }

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
    }));

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/new-arrivals`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            // Add other main static pages here
            url: `${baseUrl}/cart`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    return [...staticEntries, ...categoryEntries, ...productEntries];
}
