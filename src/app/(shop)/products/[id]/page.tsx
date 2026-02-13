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

  // fetch data
  const products = await executeQuery(
    'SELECT name, description, category_id, retail_price, base_price, (SELECT url FROM product_images WHERE product_id = products.id AND is_main = 1 LIMIT 1) as image_url FROM products WHERE id = ?',
    [id]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

  return {
    title: `${product.name} | Nike Clone`,
    description: product.description ? product.description.substring(0, 160) : `Mua ${product.name} tại Nike Clone Store`,
    openGraph: {
      title: product.name,
      description: product.description ? product.description.substring(0, 160) : `Mua ${product.name} tại Nike Clone Store`,
      images: [{
        url: product.image_url || '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: product.name
      }],
    },
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  // Verify product existence on server for correct 404 status/rendering
  const products = await executeQuery(
    'SELECT id FROM products WHERE id = ?',
    [id]
  ) as any[];

  if (products.length === 0) {
    return notFound();
  }

  const product = products[0];

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url || `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
    description: product.description,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: product.base_price,
      availability: 'https://schema.org/InStock', // Simplified for now
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
    },
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
