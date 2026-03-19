import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { banners as bannersTable } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { invalidateCachePattern } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

const BANNERS_CACHE_PATTERN = 'global:banners:*';

// GET - Lấy tất cả banners (Admin)
/**
 * API Lấy danh sách Banner quảng cáo.
 * Hỗ trợ lọc theo vị trí (Ví dụ: homepage, checkout_success).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    const banners = await db
      .select({
        id: bannersTable.id,
        title: bannersTable.title,
        description: bannersTable.description,
        image_url: bannersTable.imageUrl,
        mobile_image_url: bannersTable.mobileImageUrl,
        link_url: bannersTable.linkUrl,
        link_text: bannersTable.linkText,
        position: bannersTable.position,
        display_order: bannersTable.displayOrder,
        start_date: bannersTable.startDate,
        end_date: bannersTable.endDate,
        is_active: bannersTable.isActive,
        click_count: bannersTable.clickCount,
        impression_count: bannersTable.impressionCount,
        created_at: bannersTable.createdAt,
        updated_at: bannersTable.updatedAt,
      })
      .from(bannersTable)
      .where(position ? eq(bannersTable.position, position) : undefined)
      .orderBy(asc(bannersTable.displayOrder), desc(bannersTable.createdAt));

    return ResponseWrapper.success(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// POST - Tạo banner mới
/**
 * API Tạo Banner mới.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const {
      title,
      description,
      image_url,
      imageUrl, // Support both
      mobile_image_url,
      mobileImageUrl,
      link_url,
      linkUrl,
      link_text,
      linkText,
      position,
      display_order,
      displayOrder,
      start_date,
      startDate,
      end_date,
      endDate,
      is_active,
      isActive,
    } = body;

    const finalImageUrl = image_url || imageUrl;
    if (!title || !finalImageUrl) {
      return ResponseWrapper.error('Missing required fields', 400);
    }

    await db.insert(bannersTable).values({
      title,
      description: description || '',
      imageUrl: finalImageUrl,
      mobileImageUrl: mobile_image_url || mobileImageUrl || null,
      linkUrl: link_url || linkUrl || null,
      linkText: link_text || linkText || null,
      position: position || 'homepage',
      displayOrder: Number(display_order || displayOrder || 0),
      startDate: start_date || startDate ? new Date(start_date || startDate) : null,
      endDate: end_date || endDate ? new Date(end_date || endDate) : null,
      isActive:
        is_active !== undefined
          ? is_active
            ? 1
            : 0
          : isActive !== undefined
            ? isActive
              ? 1
              : 0
            : 1,
    });

    // Invalidate all banner caches
    await invalidateCachePattern(BANNERS_CACHE_PATTERN);

    return ResponseWrapper.success(null, 'Banner created successfully');
  } catch (error) {
    console.error('Error creating banner:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// PUT - Cập nhật banner
/**
 * API Cập nhật thông tin Banner.
 * Chỉ cập nhật các trường được gửi lên (Partial Update).
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return ResponseWrapper.error('Missing banner ID', 400);
    }

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.image_url !== undefined) updateData.imageUrl = updates.image_url;
    if (updates.mobile_image_url !== undefined)
      updateData.mobileImageUrl = updates.mobile_image_url;
    if (updates.link_url !== undefined) updateData.linkUrl = updates.link_url;
    if (updates.link_text !== undefined) updateData.linkText = updates.link_text;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.display_order !== undefined) updateData.displayOrder = updates.display_order;
    if (updates.start_date !== undefined)
      updateData.startDate = updates.start_date ? new Date(updates.start_date) : null;
    if (updates.end_date !== undefined)
      updateData.endDate = updates.end_date ? new Date(updates.end_date) : null;
    if (updates.is_active !== undefined) updateData.isActive = updates.is_active ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return ResponseWrapper.error('No fields to update', 400);
    }

    await db
      .update(bannersTable)
      .set(updateData)
      .where(eq(bannersTable.id, Number(id)));

    // Invalidate all banner caches
    await invalidateCachePattern(BANNERS_CACHE_PATTERN);

    return ResponseWrapper.success(null, 'Banner updated successfully');
  } catch (error) {
    console.error('Error updating banner:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

// DELETE - Xóa banner
/**
 * API Xóa Banner vĩnh viễn khỏi hệ thống.
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ResponseWrapper.error('Missing banner ID', 400);
    }

    await db.delete(bannersTable).where(eq(bannersTable.id, Number(id)));

    // Invalidate all banner caches
    await invalidateCachePattern(BANNERS_CACHE_PATTERN);

    return ResponseWrapper.success(null, 'Banner deleted successfully');
  } catch (error) {
    console.error('Error deleting banner:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
