// Force rebuild

import { Metadata, ResolvingMetadata } from 'next';
import { executeQuery } from '@/lib/db/mysql';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { ProductReviews } from '@/components/reviews/ProductReviews';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug;

  const isNumericId = /^\d+$/.test(slug);
  const condition = isNumericId ? 'id = ?' : 'slug = ?';
  const paramValue = isNumericId ? parseInt(slug) : slug;

  // 1. Fetch default product data
  const products = await executeQuery(
    `SELECT id, name, description, category_id, retail_price, base_price, (SELECT url FROM product_images WHERE product_id = products.id AND is_main = 1 LIMIT 1) as image_url FROM products WHERE ${condition}`,
    [paramValue]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

  // 3. Auto-redirect to Slug if accessed via ID
  if (isNumericId && product.slug) {
    const { redirect } = await import('next/navigation');
    return redirect(`/products/${product.slug}`);
  }

  const productId = product.id;

  // 2. Fetch Dynamic SEO Metadata from repository
  const { getSeoMetadata } = await import('@/lib/db/repositories/seo');
  const dynamicSeo = await getSeoMetadata('product', productId);

  // 3. Merge Metadata (Dynamic > Database > Default)
  const title = dynamicSeo?.title || `${product.name} | TOAN Store`;
  const description = dynamicSeo?.description || (product.description ? product.description.substring(0, 160) : `Mua ${product.name} tại TOAN Store`);
  const imageUrl = dynamicSeo?.og_image_url || product.image_url || '/og-image.jpg';

  return {
    title,
    description,
    keywords: dynamicSeo?.keywords,
    alternates: {
      canonical: dynamicSeo?.canonical_url,
    },
    openGraph: {
      title,
      description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: product.name
      }],
      type: 'website',
    },
    other: dynamicSeo?.structured_data ? {
      'structured-data': JSON.stringify(dynamicSeo.structured_data)
    } : undefined
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const isNumericId = /^\d+$/.test(slug);
  const condition = isNumericId ? 'p.id = ?' : 'p.slug = ?';
  const paramValue = isNumericId ? parseInt(slug) : slug;

  // fetch data
  const products = await executeQuery(
    `SELECT 
      p.name, 
      p.description, 
      p.category_id, 
      p.retail_price, 
      p.base_price, 
      p.id,
      p.slug,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${condition}`,
    [paramValue]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

  // 1. Auto-redirect to Slug if accessed via ID
  if (isNumericId && product.slug) {
    const { redirect } = await import('next/navigation');
    return redirect(`/products/${product.slug}`);
  }

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        image: product.image_url || `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
        description: product.description,
        sku: product.id,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'VND',
          price: product.base_price,
          availability: 'https://schema.org/InStock',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug || product.id}`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category_name || 'Category',
            item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/category/${product.category_slug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.slug || product.id}`,
          },
        ],
      }
    ]
  };

  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient slug={slug} initialProductId={product.id} />

      {/* Product Reviews Section - Rendered inside ProductDetailClient */}
      {/* <ProductReviews productId={product.id} /> */}
    </div>
  );
}
