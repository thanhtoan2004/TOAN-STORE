import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { generateTOTPSecret, generateTOTPURI, generateQRCodeDataURL } from '@/lib/auth/totp';
import { db } from '@/lib/db/drizzle';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Bước 1: Tạo Secret và QR Code để thiết lập TOTP.
 * Chức năng:
 * - Tạo Secret ngẫu nhiên cho thuật toán TOTP.
 * - Tạo URI và QR Code để người dùng quét bằng các ứng dụng như Google Authenticator / Authy.
 * - Lưu Secret tạm thời vào DB của Admin (nhưng chưa kích hoạt 2FA).
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    // Tạo Secret mới (Lưu tạm vào DB nhưng chưa "enable")
    const secret = generateTOTPSecret();
    const uri = generateTOTPURI(admin.email, secret);
    const qrCode = await generateQRCodeDataURL(uri);

    // Lưu secret tạm thời vào DB
    await db
      .update(adminUsers)
      .set({ twoFactorSecret: secret })
      .where(eq(adminUsers.id, admin.userId));

    const result = {
      secret, // Client có thể hiển thị nếu muốn nhập tay
      qrCode,
      uri,
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('2FA Setup error:', error);
    return ResponseWrapper.serverError('Lỗi server khi thiết lập 2FA', error);
  }
}

/**
 * POST - Bước 2: Xác nhận mã từ ứng dụng để chính thức kích hoạt 2FA.
 * Quy trình:
 * 1. Nhận mã OTP (Token) từ Client.
 * 2. Lấy Secret đã lưu tạm trong DB.
 * 3. Kiểm tra tính hợp lệ của Token dựa trên Secret.
 * 4. Nếu đúng: Chuyển trạng thái `twoFactorEnabled = 1` và `twoFactorType = 'totp'`.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return ResponseWrapper.error('Token xác thực là bắt buộc', 400);
    }

    // Lấy secret đã lưu tạm
    const [user] = await db
      .select({ twoFactorSecret: adminUsers.twoFactorSecret })
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.userId))
      .limit(1);

    if (!user || !user.twoFactorSecret) {
      return ResponseWrapper.error('Không tìm thấy phiên thiết lập 2FA hiện tại', 400);
    }

    // Xác thực mã từ Client gửi lên
    const { verifyTOTPToken } = await import('@/lib/auth/totp');
    const isValid = verifyTOTPToken(token, user.twoFactorSecret);

    if (!isValid) {
      return ResponseWrapper.error('Mã xác thực không đúng hoặc đã hết hạn', 400);
    }

    // Thành công -> Bật 2FA và chuyển loại sang TOTP
    await db
      .update(adminUsers)
      .set({
        twoFactorEnabled: 1,
        twoFactorType: 'totp',
      })
      .where(eq(adminUsers.id, admin.userId));

    return ResponseWrapper.success(null, 'Đã kích hoạt Google Authenticator thành công!');
  } catch (error) {
    console.error('2FA Confirm error:', error);
    return ResponseWrapper.serverError('Lỗi server khi kích hoạt 2FA', error);
  }
}
