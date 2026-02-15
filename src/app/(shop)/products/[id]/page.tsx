// Force rebuild

import { Metadata, ResolvingMetadata } from 'next';
import { executeQuery } from '@/lib/db/mysql';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { ProductReviews } from '@/components/reviews/ProductReviews';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const productId = parseInt(id);

  // 1. Fetch default product data
  const products = await executeQuery(
    'SELECT name, description, category_id, retail_price, base_price, (SELECT url FROM product_images WHERE product_id = products.id AND is_main = 1 LIMIT 1) as image_url FROM products WHERE id = ?',
    [productId]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

  // 2. Fetch Dynamic SEO Metadata from repository
  const { getSeoMetadata } = await import('@/lib/db/repositories/seo');
  const dynamicSeo = await getSeoMetadata('product', productId);

  // 3. Merge Metadata (Dynamic > Database > Default)
  const title = dynamicSeo?.title || `${product.name} | TOAN`;
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
  const { id } = await params;

  // fetch data
  const products = await executeQuery(
    `SELECT 
      p.name, 
      p.description, 
      p.category_id, 
      p.retail_price, 
      p.base_price, 
      p.id,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?`,
    [id]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

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
          url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
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
            item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.id}`,
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
      <ProductDetailClient id={id} />

      {/* Product Reviews Section */}
      <ProductReviews productId={parseInt(id)} />
    </div>
  );
}
