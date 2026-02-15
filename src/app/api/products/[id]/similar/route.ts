import { NextResponse } from 'next/server';
import { getSimilarProducts } from '@/lib/db/repositories/recommendation';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const similarProducts = await getSimilarProducts(productId, 4); // Fetch 4 similar products
        return NextResponse.json({ success: true, data: similarProducts });
    } catch (error) {
        console.error('API Similar Products Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
