import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getSubscriptions, getActiveSubscriptionEmails } from '@/lib/db/repositories/newsletter';
import { sendEmail, wrapEmailHtml } from '@/lib/mail/mail';
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

    if (recipients.length === 0) {
      return ResponseWrapper.error(
        'Không tìm thấy người nhận email hợp lệ (đã bị ẩn thông tin PII hoặc không hợp lệ)',
        400
      );
    }

    console.log(`Sending broadcast to ${recipients.length} valid users: ${subject}`);

    // We'll use the sendEmail helper
    const { sendEmail: mailer } = await import('@/lib/mail/mail');

    // We send emails in background to avoid blocking the request
    Promise.all(
      recipients.map((subscriber) => {
        const name = subscriber.name || 'Bạn';
        const personalizedMessage = message.replace(/{name}/g, name);
        const personalizedSubject = subject.replace(/{name}/g, name);

        return mailer({
          to: subscriber.email,
          subject: personalizedSubject,
          html: wrapEmailHtml(
            title || 'Bộ sưu tập mới',
            'bell',
            `
              <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
              <div style="font-size: 15px; line-height: 1.7; color: #333;">
                ${personalizedMessage.replace(/\\n/g, '<br/>')}
              </div>
              <div class="btn-container">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Khám phá ngay</a>
              </div>
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                Bạn nhận được email này vì đã đăng ký nhận tin từ website chúng tôi.<br/>
                <a href="#" style="color: #000;">Hủy đăng ký</a>
              </p>
            `
          ),
        }).catch((e: any) => console.error(`Failed to send newsletter to ${subscriber.email}:`, e));
      })
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
