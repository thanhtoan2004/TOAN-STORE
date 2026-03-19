import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getSeoMetadata, upsertSeoMetadata, deleteSeoMetadata } from '@/lib/db/repositories/seo';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Truy xuất cấu hình SEO (Meta data) cho một thực thể cụ thể (Product/News/Category).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const id = parseInt(searchParams.get('id') || '0');

    if (!type || !id) {
      return ResponseWrapper.error('Missing type or id', 400);
    }

    const metadata = await getSeoMetadata(type, id);
    return ResponseWrapper.success(metadata);
  } catch (error) {
    console.error('SEO Get Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}

/**
 * API Cập nhật hoặc chèn mới (Upsert) cấu hình SEO.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const result = await upsertSeoMetadata(body);

    if (!result) {
      return ResponseWrapper.error('Failed to update SEO metadata', 400);
    }

    return ResponseWrapper.success(null, 'SEO metadata updated successfully');
  } catch (error) {
    console.error('SEO Upsert Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}

/**
 * API Gỡ bỏ cấu hình SEO của một thực thể.
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const id = parseInt(searchParams.get('id') || '0');

    if (!type || !id) {
      return ResponseWrapper.error('Missing type or id', 400);
    }

    const result = await deleteSeoMetadata(type, id);

    if (!result) {
      return ResponseWrapper.error('Failed to delete SEO metadata', 400);
    }

    return ResponseWrapper.success(null, 'SEO metadata deleted successfully');
  } catch (error) {
    console.error('SEO Delete Error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}
