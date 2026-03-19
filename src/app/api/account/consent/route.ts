import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userConsents } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';

/**
 * API Quản lý Consent người dùng (GDPR Compliance).
 *
 * GET: Lấy trạng thái consent hiện tại của user cho tất cả mục đích (marketing, analytics, v.v.)
 * POST: Cập nhật consent — ghi log immutable mỗi lần thay đổi để đảm bảo Audit Trail.
 */

// Lấy trạng thái consent hiện tại
export async function GET() {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.userId);

    // Lấy ID lớn nhất cho mỗi purpose của user này
    const latestIds = db
      .select({ maxId: sql<number>`MAX(${userConsents.id})` })
      .from(userConsents)
      .where(eq(userConsents.userId, userId))
      .groupBy(userConsents.purpose);

    // Lấy consent chi tiết dựa trên các ID đó
    const consents = await db
      .select({
        purpose: userConsents.purpose,
        isGranted: userConsents.isGranted,
        grantedAt: userConsents.grantedAt,
        revokedAt: userConsents.revokedAt,
        version: userConsents.version,
      })
      .from(userConsents)
      .where(and(eq(userConsents.userId, userId), inArray(userConsents.id, latestIds)));

    // Build consent map
    const purposes = ['marketing', 'analytics', 'personalization', 'third_party'];
    const consentMap: Record<string, { granted: boolean; updatedAt: Date | null }> = {};

    for (const p of purposes) {
      const record = consents.find((c) => c.purpose === p);
      consentMap[p] = {
        granted: record ? !!record.isGranted : false,
        updatedAt: record ? (record.isGranted ? record.grantedAt : record.revokedAt) : null,
      };
    }

    return NextResponse.json({
      success: true,
      data: consentMap,
    });
  } catch (error: any) {
    console.error('Error fetching consents:', error);
    return NextResponse.json({ success: false, message: 'Có lỗi xảy ra' }, { status: 500 });
  }
}

// Cập nhật consent
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.userId);
    const body = await request.json();
    const { purpose, granted } = body;

    // Validate purpose
    const validPurposes = ['marketing', 'analytics', 'personalization', 'third_party'];
    if (!purpose || !validPurposes.includes(purpose)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Purpose không hợp lệ. Chọn: marketing, analytics, personalization, third_party',
        },
        { status: 400 }
      );
    }

    if (typeof granted !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'granted phải là boolean (true/false)' },
        { status: 400 }
      );
    }

    // Lấy IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Ghi consent mới (immutable record)
    await db.insert(userConsents).values({
      userId,
      purpose: purpose as any,
      isGranted: granted ? 1 : 0,
      ipAddress: ip,
      userAgent: userAgent.substring(0, 500),
      grantedAt: granted ? new Date() : null,
      revokedAt: granted ? null : new Date(),
    });

    return NextResponse.json({
      success: true,
      message: granted ? `Đã đồng ý ${purpose}` : `Đã thu hồi đồng ý ${purpose}`,
      data: { purpose, granted },
    });
  } catch (error: any) {
    console.error('Error updating consent:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi cập nhật consent' },
      { status: 500 }
    );
  }
}
