import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import {
  getProductAttributes,
  upsertProductAttribute,
  deleteProductAttribute,
} from '@/lib/db/repositories/attribute';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const attributes = await getProductAttributes(productId);
    return NextResponse.json({ success: true, attributes });
  } catch (error) {
    console.error('Product Attributes Get Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const { attribute_id, value_text, value_id } = await request.json();
    const result = await upsertProductAttribute({
      product_id: productId,
      attribute_id,
      value_text,
      value_id,
    });
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Product Attribute Upsert Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);
  const { searchParams } = new URL(request.url);
  const attributeId = parseInt(searchParams.get('attributeId') || '0');

  try {
    const result = await deleteProductAttribute(productId, attributeId);
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Product Attribute Delete Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
