import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getSettings, updateSetting } from '@/lib/db/settings';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy toàn bộ cấu hình hệ thống (Settings).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const settings = await getSettings();
    return ResponseWrapper.success(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

/**
 * PUT - Cập nhật cấu hình hệ thống.
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    // RBAC: Only Super Admin can change system settings
    if (admin.role !== 'Super Admin') {
      return ResponseWrapper.forbidden('Only Super Admins can update system settings');
    }

    const updates = await request.json();

    // Update each setting in database
    for (const [key, value] of Object.entries(updates)) {
      await updateSetting(key, value);
    }

    // Audit Logging
    await logAdminAction(
      admin.userId,
      'UPDATE_SETTINGS',
      'settings',
      'system',
      null,
      updates,
      request
    );

    return ResponseWrapper.success(null, 'Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    return ResponseWrapper.serverError('Error saving settings', error);
  }
}
