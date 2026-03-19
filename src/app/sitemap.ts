import { MetadataRoute } from 'next';
import { db } from '@/lib/db/drizzle';
import { products as productsTable, categories as categoriesTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fetch all active products
  let products: any[] = [];
  try {
    products = await db
      .select({
        id: productsTable.id,
        slug: productsTable.slug,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .where(and(eq(productsTable.isActive, 1), isNull(productsTable.deletedAt)));
  } catch (error) {
    console.error('Sitemap Products Error:', error);
  }

  // Fetch all active categories
  let categories: any[] = [];
  try {
    categories = await db
      .select({
        slug: categoriesTable.slug,
        updatedAt: categoriesTable.updatedAt,
      })
      .from(categoriesTable)
      .where(and(eq(categoriesTable.isActive, 1), isNull(categoriesTable.deletedAt)));
  } catch (error) {
    console.error('Sitemap Categories Error:', error);
  }

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug || product.id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
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
