import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Quản lý Consent người dùng (GDPR Compliance).
 *
 * GET: Lấy trạng thái consent hiện tại của user cho tất cả mục đích (marketing, analytics, v.v.)
 * POST: Cập nhật consent — ghi log immutable mỗi lần thay đổi để đảm bảo Audit Trail.
 *
 * @security Yêu cầu Auth (JWT Cookie)
 * @ratelimit 100 req/min (general)
 */

// Lấy trạng thái consent hiện tại
export async function GET() {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.userId);

    // Lấy consent mới nhất cho mỗi purpose
    const consents = await executeQuery<any[]>(
      `SELECT purpose, is_granted, granted_at, revoked_at, version
             FROM user_consents 
             WHERE user_id = ? 
             AND id IN (
               SELECT MAX(id) FROM user_consents WHERE user_id = ? GROUP BY purpose
             )`,
      [userId, userId]
    );

    // Build consent map
    const purposes = ['marketing', 'analytics', 'personalization', 'third_party'];
    const consentMap: Record<string, { granted: boolean; updatedAt: string | null }> = {};

    for (const p of purposes) {
      const record = consents.find((c: any) => c.purpose === p);
      consentMap[p] = {
        granted: record ? !!record.is_granted : false,
        updatedAt: record ? (record.is_granted ? record.granted_at : record.revoked_at) : null,
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
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await executeQuery(
      `INSERT INTO user_consents (user_id, purpose, is_granted, ip_address, user_agent, granted_at, revoked_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        purpose,
        granted ? 1 : 0,
        ip,
        userAgent.substring(0, 500),
        granted ? now : null,
        granted ? null : now,
      ]
    );

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
