import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// GET - Lấy danh sách banners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'homepage';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    let query = 'SELECT * FROM banners WHERE position = ?';
    const params: any[] = [position];

    if (activeOnly) {
      const now = new Date().toISOString();
      query += ' AND is_active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)';
      params.push(now, now);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const banners = await executeQuery<any[]>(query, params);

    // Update impression count for active banners
    if (activeOnly && banners.length > 0) {
      const bannerIds = banners.map(b => b.id);
      await executeQuery(
        `UPDATE banners SET impression_count = impression_count + 1 WHERE id IN (${bannerIds.join(',')})`,
        []
      );
    }

    return NextResponse.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// POST - Tạo banner mới (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      image_url,
      mobile_image_url,
      link_url,
      link_text,
      position,
      display_order,
      start_date,
      end_date,
      is_active
    } = body;

    // Validate required fields
    if (!title || !image_url) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Insert banner
    await executeQuery(
      `INSERT INTO banners 
       (title, description, image_url, mobile_image_url, link_url, link_text, position, display_order, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        image_url,
        mobile_image_url || null,
        link_url || null,
        link_text || null,
        position || 'homepage',
        display_order || 0,
        start_date || null,
        end_date || null,
        is_active !== undefined ? is_active : 1
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Tạo banner thành công'
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật banner (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID banner' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const allowedFields = [
      'title',
      'description',
      'image_url',
      'mobile_image_url',
      'link_url',
      'link_text',
      'position',
      'display_order',
      'start_date',
      'end_date',
      'is_active'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có trường nào để cập nhật' },
        { status: 400 }
      );
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật banner thành công'
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa banner (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID banner' },
        { status: 400 }
      );
    }

    await executeQuery('DELETE FROM banners WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
