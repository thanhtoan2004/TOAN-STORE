
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"TOAN" <no-reply@nikeclone.com>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});


// Shared CSS for all emails to ensure consistency


// Shared CSS for all emails to ensure consistency
const BASE_STYLES = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #09090b; margin: 0; padding: 0; background-color: #ffffff; }
  .wrapper { max-width: 600px; margin: 40px auto; border: 1px solid #e4e4e7; border-radius: 0.5rem; overflow: hidden; background-color: #ffffff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
  .header { background-color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e4e4e7; }
  .header h1 { color: #09090b; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
  
  /* Utility Classes (Tailwind-like) */
  .w-12 { width: 48px; }
  .h-12 { height: 48px; }
  .w-8 { width: 32px; }
  .h-8 { height: 32px; }
  .text-black { color: #000000; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .mb-4 { margin-bottom: 16px; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  
  .content { padding: 32px 24px; }
  .box { background-color: #f4f4f5; padding: 24px; border-radius: 0.5rem; text-align: center; margin: 24px 0; border: 1px solid #e4e4e7; }
  .box h2 { color: #09090b; margin: 8px 0; font-size: 30px; font-weight: 700; letter-spacing: -0.025em; }
  .box p { margin: 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
  .btn-container { margin-top: 32px; text-align: center; }
  .btn { background-color: #18181b; color: #fafafa; padding: 12px 24px; text-decoration: none; border-radius: 0.375rem; font-weight: 500; font-size: 14px; display: inline-block; transition: background-color 0.2s; }
  .footer { background-color: #ffffff; padding: 24px; text-align: center; font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; }
  .footer p { margin: 0; }
  .text-highlight { font-weight: 600; color: #18181b; }
  .note-box { background-color: #f4f4f5; padding: 16px; border-radius: 0.5rem; margin-top: 24px; border: 1px solid #e4e4e7; }
  .note-title { margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #09090b; }
  .note-list { margin: 0; padding-left: 20px; color: #555; font-size: 13px; }
  .note-list li { margin-bottom: 4px; }
`;

const ICONS = {
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-black"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-black"><polyline points="20 6 9 17 4 12"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-black"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-black"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  truck: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-black"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`
};

function wrapEmailHtml(title: string, iconName: keyof typeof ICONS, bodyContent: string) {
  const iconSvg = ICONS[iconName] || '';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="mx-auto mb-4 w-8 h-8 text-black">
            ${iconSvg}
          </div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p>&copy; 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // If credentials are missing, log and skip (for dev environment safety)
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing. Email would have been sent to:', to);
    console.log('--- EMAIL PREVIEW ---');
    console.log('Subject:', subject);
    // console.log('HTML:', html); // Uncomment to see full HTML
    console.log('--- END PREVIEW ---');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const subject = 'Welcome to TOAN!';
  const body = `
    <h2 style="color: #111; font-size: 20px;">Xin chào ${name},</h2>
    <p>Cảm ơn bạn đã đăng ký tài khoản tại TOAN. Chúng tôi rất vui mừng khi có bạn đồng hành.</p>
    
    <div class="box" style="text-align: left; padding: 20px;">
      <p style="text-transform: none; font-size: 16px; color: #333;">Hãy bắt đầu khám phá những bộ sưu tập mới nhất và tận hưởng các ưu đãi dành riêng cho thành viên.</p>
    </div>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Mua sắm ngay</a>
    </div>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Chào mừng bạn mới', 'user', body) });
}

export async function sendOrderConfirmation(to: string, orderNumber: string, total: number) {
  const subject = `Order Confirmation #${orderNumber}`;
  const body = `
    <p>Chào bạn,</p>
    <p>Cảm ơn bạn đã đặt hàng! Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn đã được ghi nhận thành công.</p>
    
    <div class="box">
      <p>Tổng thanh toán</p>
      <h2>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</h2>
    </div>

    <p>Chúng tôi sẽ thông báo cho bạn ngay khi đơn hàng được gửi đi.</p>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" class="btn">Chi tiết đơn hàng</a>
    </div>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Xác nhận đơn hàng', 'check', body) });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = 'Đặt lại mật khẩu - TOAN Store';
  const body = `
    <p>Chào bạn,</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    
    <div class="btn-container">
      <a href="${resetLink}" class="btn">Đặt lại mật khẩu ngay</a>
    </div>
    
    <div class="note-box">
       <p class="note-title">Lưu ý quan trọng:</p>
       <ul class="note-list">
         <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
         <li>Nếu bạn không yêu cầu, vui lòng bỏ qua email này</li>
         <li>Tuyệt đối không chia sẻ link này với người khác</li>
       </ul>
    </div>
    
    <p style="margin-top: 20px; font-size: 13px; color: #999;">Hoặc copy link sau vào trình duyệt:<br>
    <span style="color: #666; word-break: break-all;">${resetLink}</span></p>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Đặt lại mật khẩu', 'lock', body) });
}

// Email thông báo nhận thanh toán
export async function sendPaymentReceivedEmail(to: string, orderNumber: string, amount: number) {
  const subject = `Xác nhận thanh toán thành công cho đơn hàng #${orderNumber}`;
  const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const body = `
    <p>Chào bạn,</p>
    <p>Chúng tôi đã nhận được thanh toán cho đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn.</p>
    
    <div class="box">
      <p>Số tiền đã nhận</p>
      <h2>${formattedAmount}</h2>
    </div>

    <p>Đơn hàng đang được xử lý và sẽ sớm được gửi đi.</p>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" class="btn">Xem đơn hàng</a>
    </div>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Thanh toán thành công', 'check', body) });
}

export async function sendVoucherReceivedEmail(to: string, code: string, value: number, discountType: string, minOrderValue: number | null) {
  const subject = 'Bạn nhận được một Voucher mới từ TOAN Store';
  const formattedValue = discountType === 'percent' ? `${value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const body = `
    <p>Chào bạn,</p>
    <p>TOAN Store xin gửi tặng bạn một mã giảm giá đặc biệt:</p>
    
    <div class="box" style="border: 1px dashed #ccc;">
      <h2 style="font-size: 32px; letter-spacing: 2px;">${code}</h2>
      <p style="text-transform: none; font-size: 18px; margin-top: 10px;">Giảm <strong>${formattedValue}</strong></p>
      ${minOrderValue ? `<p style="text-transform: none; font-size: 14px; color: #888; margin-top: 5px;">Đơn tối thiểu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minOrderValue)}</p>` : ''}
    </div>

    <p>Hãy sử dụng mã này ở bước thanh toán nhé!</p>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Mua sắm ngay</a>
    </div>
    
    <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">Nếu bạn không mong đợi email này, vui lòng bỏ qua.</p>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Quà tặng dành riêng cho bạn', 'star', body) });
}

export async function sendOrderShippedEmail(to: string, orderNumber: string) {
  const subject = `Đơn hàng #${orderNumber} đang được giao`;
  const body = `
    <p>Chào bạn,</p>
    <p>Tin vui! Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn đã được đóng gói và giao cho đơn vị vận chuyển.</p>
    
    <div class="box">
      <p style="text-transform: none; color: #555;">Đơn hàng sẽ sớm đến tay bạn trong thời gian tới.</p>
    </div>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" class="btn">Theo dõi đơn hàng</a>
    </div>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Đơn hàng đang giao', 'truck', body) });
}


