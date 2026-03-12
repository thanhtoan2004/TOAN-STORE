import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getSettings, updateSetting } from '@/lib/db/settings';

/**
 * API Lấy toàn bộ cấu hình hệ thống (Settings).
 * Bao gồm các thông số về Header, Footer, SEO, và các cấu hình nghiệp vụ khác.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: true, data: {} });
  }
}

/**
 * API Cập nhật cấu hình hệ thống.
 * Hỗ trợ cập nhật hàng loạt các cặp Key-Value vào bảng settings.
 */
export async function PUT(request: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await request.json();

    // Update each setting in database
    for (const [key, value] of Object.entries(settings)) {
      await updateSetting(key, value);
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: 'Error saving settings' }, { status: 500 });
  }
}
