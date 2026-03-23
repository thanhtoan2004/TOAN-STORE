import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý cấu hình toàn hệ thống (Site Settings) - Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const allSettings = await db.select().from(siteSettings);
    return ResponseWrapper.success(allSettings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { key, value, description } = body;

    if (!key) return ResponseWrapper.error('Key is required', 400);

    // Upsert logic
    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    if (existing) {
      await db.update(siteSettings).set({ value, description }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value, description });
    }
    return ResponseWrapper.success(null, 'Saved successfully');
  } catch (error) {
    console.error('Error saving site setting:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const body = await request.json();

    // Looping through the settings object keys and saving each one
    for (const [key, value] of Object.entries(body)) {
      const [existing] = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, key))
        .limit(1);

      if (existing) {
        await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({ key, value });
      }
    }

    return ResponseWrapper.success(null, 'Updated all settings successfully');
  } catch (error) {
    console.error('Error saving site settings:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
