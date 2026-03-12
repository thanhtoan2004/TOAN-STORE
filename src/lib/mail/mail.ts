/**
 * Hệ thống Gửi Thư Điện Tử (SMTP Transport).
 * Sử dụng thư viện `nodemailer` để kết nối với SMTP server (như Gmail, SendGrid, Amazon SES)
 * Phụ trách hòm thư thông báo Đăng ký, Đặt hàng thành công, OTP Xác thực.
 */
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"TOAN Store" <no-reply@toanstore.com>';

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

const ICON_URLS = {
  user: 'https://img.icons8.com/ios-filled/100/ffffff/user.png',
  check: 'https://img.icons8.com/ios-filled/100/ffffff/ok.png',
  lock: 'https://img.icons8.com/ios-filled/100/ffffff/lock.png',
  star: 'https://img.icons8.com/ios-filled/100/ffffff/star.png',
  truck: 'https://img.icons8.com/ios-filled/100/ffffff/delivery.png',
  alert: 'https://img.icons8.com/ios-filled/100/ffffff/shield.png',
  cart: 'https://img.icons8.com/ios-filled/100/ffffff/shopping-cart.png',
  cancel: 'https://img.icons8.com/ios-filled/100/ffffff/cancel.png',
  fire: 'https://img.icons8.com/ios-filled/100/ffffff/fire-element.png',
  box: 'https://img.icons8.com/ios-filled/100/ffffff/box.png',
  bell: 'https://img.icons8.com/ios-filled/100/ffffff/appointment-reminders.png',
};

/**
 * Trình bao bọc khung Giao diện HTML chung (Wrapper) cho tất cả Email.
 * Đảm bảo mọi Email hệ thống gửi ra đều có Logo, Header, Footer theo CSS chuẩn của Brand.
 * Sử dụng CSS Inline để không bị ứng dụng Gmail/Outlook trên điện thoại tự ý cắt mất style.
 */
export function wrapEmailHtml(
  title: string,
  iconName: keyof typeof ICON_URLS,
  bodyContent: string
) {
  const iconUrl = ICON_URLS[iconName] || ICON_URLS.user;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${BASE_STYLES}</style>
    </head>
    <body style="margin: 0; padding: 0;">
      <div class="wrapper">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111;">
          <tr>
            <td align="center" style="padding: 32px 24px;">
              <img src="${iconUrl}" width="48" height="48" alt="${iconName}" style="display: block; margin-bottom: 12px;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600; font-family: Arial, sans-serif;">${title}</h1>
            </td>
          </tr>
        </table>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer" style="background-color: #f9f9f9; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7;">
          <p>© 2026 TOAN Store. All rights reserved.</p>
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
  const subject = 'Welcome to TOAN Store!';
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
    <p>Cảm ơn bạn đã đăng ký tài khoản tại TOAN Store. Chúng tôi rất vui mừng khi có bạn đồng hành.</p>
    
    <div class="box" style="text-align: left; padding: 20px;">
      <p style="text-transform: none; font-size: 16px; color: #333;">Hãy bắt đầu khám phá những bộ sưu tập mới nhất và tận hưởng các ưu đãi dành riêng cho thành viên.</p>
    </div>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Mua sắm ngay</a>
    </div>
  `;
  return sendEmail({ to, subject, html: wrapEmailHtml('Chào mừng bạn mới', 'user', body) });
}

export async function sendOrderConfirmation(
  to: string,
  name: string,
  orderNumber: string,
  total: number
) {
  const subject = `Order Confirmation #${orderNumber}`;
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
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

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = 'Đặt lại mật khẩu - TOAN Store';
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
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
export async function sendPaymentReceivedEmail(
  to: string,
  name: string,
  orderNumber: string,
  amount: number
) {
  const subject = `Xác nhận thanh toán thành công cho đơn hàng #${orderNumber}`;
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
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

export async function sendVoucherReceivedEmail(
  to: string,
  name: string,
  code: string,
  value: number,
  discountType: string,
  minOrderValue: number | null
) {
  const subject = 'Bạn nhận được một Voucher mới từ TOAN Store';
  const formattedValue =
    discountType === 'percent'
      ? `${value}%`
      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
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
  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml('Quà tặng dành riêng cho bạn', 'star', body),
  });
}

export async function sendOrderShippedEmail(to: string, name: string, orderNumber: string) {
  const subject = `Đơn hàng #${orderNumber} đang được giao`;
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
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

export async function sendTierUpgradeEmail(
  to: string,
  name: string,
  newTier: string,
  oldTier: string,
  totalPoints: number
) {
  const subject = `Chúc mừng bạn đã thăng hạng ${newTier.toUpperCase()} tại TOAN Store!`;

  const tierNames = {
    bronze: 'Bạc (Bronze)',
    silver: 'Bạc Premium (Silver)',
    gold: 'Vàng (Gold)',
    platinum: 'Bạch Kim (Platinum)',
  };

  const displayNewTier = tierNames[newTier as keyof typeof tierNames] || newTier;

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${name},</strong></p>
    <p>Chúc mừng bạn! Nhờ sự ủng hộ nhiệt tình của bạn, mức thẻ hội viên của bạn vừa được thăng hạng thành công.</p>
    
    <div class="box" style="border: 1px solid #eab308; background-color: #fefce8;">
      <h2 style="color: #ca8a04; font-size: 28px;">HẠNG ${displayNewTier.toUpperCase()}</h2>
      <p>Tổng điểm tích luỹ: <strong>${new Intl.NumberFormat('vi-VN').format(totalPoints)} điểm</strong></p>
    </div>

    <p style="margin-top: 16px;">Với hạng thẻ mới, bạn sẽ nhận được nhiều đặc quyền, ưu đãi chiết khấu và quà tặng độc quyền từ TOAN Store.</p>
    
    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/settings" class="btn">Khám phá Đặc quyền ngay</a>
    </div>
  `;

  return sendEmail({ to, subject, html: wrapEmailHtml('Thăng Hạng Thành Viên', 'star', body) });
}
