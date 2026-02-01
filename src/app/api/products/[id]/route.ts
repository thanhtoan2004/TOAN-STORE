import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getProductSizes, executeQuery } from '@/lib/db/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get product details from database
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get product sizes and stock
    const sizes = await getProductSizes(productId);

    // Get product images
    const images = await executeQuery<any[]>(
      'SELECT id, url, alt_text, position, is_main FROM product_images WHERE product_id = ? ORDER BY position',
      [productId]
    );

    // Calculate available stock
    const availableSizes = sizes.filter((s: any) => (s.stock - s.reserved) > 0);

    const response = {
      success: true,
      data: {
        ...product,
        base_price: product.base_price ? parseFloat(product.base_price) : 0,
        retail_price: product.retail_price ? parseFloat(product.retail_price) : 0,
        sizes: sizes,
        images: images,
        image_url: images.find((img: any) => img.is_main)?.url || images[0]?.url || '/placeholder.jpg',
        availableSizes: availableSizes.map((s: any) => s.size),
        inStock: availableSizes.length > 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
