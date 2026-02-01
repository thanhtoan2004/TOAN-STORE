
import { Metadata, ResolvingMetadata } from 'next';
import { executeQuery } from '@/lib/db/mysql';
import ProductDetailClient from './ProductDetailClient';

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
    return {
      title: 'Sản phẩm không tồn tại',
    }
  }

  const product = products[0];

  return {
    title: product.name,
    description: product.description ? product.description.substring(0, 160) : `Mua ${product.name} tại Nike Clone Store`,
    openGraph: {
      title: product.name,
      description: product.description ? product.description.substring(0, 160) : `Mua ${product.name} tại Nike Clone Store`,
      images: [product.image_url || '/og-image.jpg'],
    },
  }
}

export default async function Page({ params }: Props) {
  const id = (await params).id;
  return <ProductDetailClient id={id} />
}
