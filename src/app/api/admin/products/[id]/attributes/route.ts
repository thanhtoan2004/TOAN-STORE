import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import {
  getProductAttributes,
  upsertProductAttribute,
  deleteProductAttribute,
} from '@/lib/db/repositories/attribute';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý thuộc tính sản phẩm (Attributes).
 * Chức năng:
 * - GET: Lấy danh sách thuộc tính của một sản phẩm.
 * - POST: Thêm mới hoặc cập nhật giá trị thuộc tính cho sản phẩm.
 * - DELETE: Gỡ bỏ một thuộc tính khỏi sản phẩm.
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return ResponseWrapper.error('ID sản phẩm không hợp lệ', 400);
    }

    const attributes = await getProductAttributes(productId);
    return ResponseWrapper.success(attributes);
  } catch (error) {
    console.error('Product Attributes Get Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi tải thuộc tính sản phẩm', error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return ResponseWrapper.error('ID sản phẩm không hợp lệ', 400);
    }

    const { attribute_id, value_text, value_id } = await request.json();

    if (!attribute_id) {
      return ResponseWrapper.error('Thiếu ID thuộc tính (attribute_id)', 400);
    }

    const result = await upsertProductAttribute({
      product_id: productId,
      attribute_id,
      value_text,
      value_id,
    });

    if (!result) {
      return ResponseWrapper.error('Không thể cập nhật thuộc tính sản phẩm', 400);
    }

    return ResponseWrapper.success(null, 'Cập nhật thuộc tính sản phẩm thành công');
  } catch (error) {
    console.error('Product Attribute Upsert Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi lưu thuộc tính sản phẩm', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const productId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const attributeId = parseInt(searchParams.get('attributeId') || '0');

    if (isNaN(productId) || !attributeId) {
      return ResponseWrapper.error('Thiếu ID sản phẩm hoặc ID thuộc tính', 400);
    }

    const result = await deleteProductAttribute(productId, attributeId);

    if (!result) {
      return ResponseWrapper.error('Không thể gỡ bỏ thuộc tính sản phẩm', 400);
    }

    return ResponseWrapper.success(null, 'Gỡ bỏ thuộc tính sản phẩm thành công');
  } catch (error) {
    console.error('Product Attribute Delete Error:', error);
    return ResponseWrapper.serverError('Lỗi server khi xóa thuộc tính sản phẩm', error);
  }
}
