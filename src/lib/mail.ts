
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
        console.warn('⚠️ SMTP credentials missing. Email not sent.');
        console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject,
            html,
        });
        console.log('✅ Email sent:', info.messageId);
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
    const subject = 'Reset Your Password';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">Reset Password</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <div style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
      </div>
      <p>If you didn't request this, please ignore this email.</p>
      <p><small>Link is valid for 1 hour.</small></p>
    </div>
  `;
    return sendEmail({ to, subject, html });
}
