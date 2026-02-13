
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Nike Clone" <no-reply@nikeclone.com>';

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
  const subject = 'Welcome to Nike Clone! 🏃';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">Welcome, ${name}!</h1>
      <p>Thank you for joining Nike Clone. We are excited to have you on board.</p>
      <p>Start exploring our latest collection and enjoy exclusive member benefits.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background-color: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Shop Now</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendOrderConfirmation(to: string, orderNumber: string, total: number) {
  const subject = `Order Confirmation #${orderNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">Thank you for your order!</h1>
      <p>Your order <strong>#${orderNumber}</strong> has been successfully placed.</p>
      <p style="font-size: 18px;">Total: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</strong></p>
      <p>We will notify you when your order is shipped.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" style="background-color: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = 'Đặt lại mật khẩu - TOAN Store';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #111; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { 
          display: inline-block; 
          background: #111; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TOAN</h1>
        </div>
        <div class="content">
          <h2>Đặt lại mật khẩu</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
          </div>
          <p>Hoặc copy link sau vào trình duyệt:</p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
          <p><strong>Lưu ý quan trọng:</strong></p>
          <ul>
            <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            <li>Không chia sẻ link này với bất kỳ ai</li>
          </ul>
        </div>
        <div class="footer">
          <p>&copy; 2025 TOAN Store. All rights reserved.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to, subject, html });
}

export async function sendPaymentReceivedEmail(to: string, orderNumber: string, amount: number) {
  const subject = `Payment Received for Order #${orderNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">Payment Received</h1>
      <p>We have received your payment for order <strong>#${orderNumber}</strong>.</p>
      <p style="font-size: 18px;">Amount Received: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</strong></p>
      <p>We are now processing your order and will notify you when it ships.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" style="background-color: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html });
}
