import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getSubscriptions, getActiveSubscriptionEmails } from '@/lib/db/repositories/newsletter';
import { sendEmail } from '@/lib/mail/mail';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Quản lý Newsletter & Gửi Email hàng loạt.
 * Chức năng:
 * - GET: Liệt kê danh sách người đăng ký nhận tin (Paginated).
 * - POST: Gửi Email Broadcast đến toàn bộ danh sách đăng ký đang hoạt động.
 * Bảo mật: Chỉ dành cho Admin.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const result = await getSubscriptions({ page, limit });

    return ResponseWrapper.success(result);
  } catch (error: any) {
    console.error('[API_NEWSLETTER_GET] Error:', error);
    return ResponseWrapper.serverError('Lỗi khi tải danh sách newsletter', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const { subject, message, title } = await req.json();
    if (!subject || !message) {
      return ResponseWrapper.error('Thiếu tiêu đề hoặc nội dung email', 400);
    }

    const recipients = await getActiveSubscriptionEmails();

    const validRecipients = recipients.filter(
      (email) => email && email !== '***' && email.includes('@')
    );

    if (validRecipients.length === 0) {
      return ResponseWrapper.error(
        'Không tìm thấy người nhận email hợp lệ (đã bị ẩn thông tin PII hoặc không hợp lệ)',
        400
      );
    }

    console.log(`Sending broadcast to ${validRecipients.length} valid users: ${subject}`);

    // We'll use the sendEmail helper
    const { sendEmail: mailer } = await import('@/lib/mail/mail');

    // We send emails in background to avoid blocking the request
    Promise.all(
      validRecipients.map((email) =>
        mailer({
          to: email,
          subject,
          html: `
          <html>
            <body style="font-family: sans-serif; padding: 20px;">
              <h1 style="color: #000;">${title || 'Thông báo mới từ Toan Store'}</h1>
              <div style="font-size: 16px; line-height: 1.6; color: #333;">
                ${message.replace(/\n/g, '<br/>')}
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">
                Bạn nhận được email này vì đã đăng ký nhận tin từ website chúng tôi.<br/>
                <a href="#" style="color: #000;">Hủy đăng ký</a>
              </p>
            </body>
          </html>
        `,
        }).catch((e: any) => console.error(`Failed to send newsletter to ${email}:`, e))
      )
    );

    const result = {
      recipients: recipients.length,
    };

    return ResponseWrapper.success(
      result,
      `Đã bắt đầu gửi email cho ${recipients.length} người nhận.`
    );
  } catch (error: any) {
    console.error('[API_NEWSLETTER_POST] Error:', error);
    return ResponseWrapper.serverError('Lỗi khi gửi email hàng loạt', error);
  }
}
