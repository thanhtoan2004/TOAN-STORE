import { sendEmail } from './mail';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
}

interface OrderDetails {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city: string;
        district: string;
        ward: string;
    };
    estimatedDelivery?: string;
}

/**
 * Send order confirmation email with full order details
 */
export async function sendOrderConfirmationEmail(details: OrderDetails) {
    const { orderNumber, customerEmail, customerName, items, subtotal, shipping, tax, total, shippingAddress, estimatedDelivery } = details;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 500;">${item.name}</div>
        ${item.size ? `<div style="font-size: 12px; color: #666;">Size: ${item.size}</div>` : ''}
        ${item.color ? `<div style="font-size: 12px; color: #666;">Màu: ${item.color}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background-color: #111; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Nike Clone</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <h2 style="color: #111; margin-top: 0;">Cảm ơn bạn đã đặt hàng!</h2>
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Đơn hàng <strong>#${orderNumber}</strong> của bạn đã được xác nhận thành công.
          </p>

          ${estimatedDelivery ? `
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #111;">
                <strong>Dự kiến giao hàng:</strong> ${estimatedDelivery}
              </p>
            </div>
          ` : ''}

          <!-- Order Items -->
          <h3 style="color: #111; margin-top: 30px;">Chi tiết đơn hàng</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Sản phẩm</th>
                <th style="padding: 12px; text-align: center; font-weight: 600;">SL</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Order Summary -->
          <div style="border-top: 2px solid #111; padding-top: 20px; margin-top: 20px;">
            <table style="width: 100%; margin-bottom: 10px;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Tạm tính:</td>
                <td style="padding: 8px 0; text-align: right;">${formatPrice(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Phí vận chuyển:</td>
                <td style="padding: 8px 0; text-align: right;">${formatPrice(shipping)}</td>
              </tr>
              ${tax > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Thuế:</td>
                  <td style="padding: 8px 0; text-align: right;">${formatPrice(tax)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #eee;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: 600;">Tổng cộng:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #111;">
                  ${formatPrice(total)}
                </td>
              </tr>
            </table>
          </div>

          <!-- Shipping Address -->
          <h3 style="color: #111; margin-top: 30px;">Địa chỉ giao hàng</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0; color: #111;"><strong>${shippingAddress.fullName}</strong></p>
            <p style="margin: 5px 0; color: #666;">${shippingAddress.phone}</p>
            <p style="margin: 5px 0; color: #666;">
              ${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Xem đơn hàng
            </a>
          </div>

          <!-- Help Section -->
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <p style="margin: 0 0 10px 0; color: #111; font-weight: 600;">Cần hỗ trợ?</p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              Liên hệ với chúng tôi qua email: support@nikeclone.com<br>
              Hoặc gọi: 1900-xxxx (8:00 - 22:00 hàng ngày)
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Nike Clone. All rights reserved.</p>
          <p style="margin: 5px 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: customerEmail,
        subject: `Xác nhận đơn hàng #${orderNumber} - Nike Clone`,
        html
    });
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotificationEmail(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    trackingNumber: string,
    carrier: string
) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background-color: #111; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">Đơn hàng đang được giao!</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Đơn hàng <strong>#${orderNumber}</strong> của bạn đã được giao cho đơn vị vận chuyển.
          </p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #111;"><strong>Đơn vị vận chuyển:</strong> ${carrier}</p>
            <p style="margin: 5px 0; color: #111;"><strong>Mã vận đơn:</strong> ${trackingNumber}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Theo dõi đơn hàng
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Nike Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: customerEmail,
        subject: `Đơn hàng #${orderNumber} đang được giao - Nike Clone`,
        html
    });
}

/**
 * Send order delivered notification
 */
export async function sendDeliveryConfirmationEmail(
    customerEmail: string,
    customerName: string,
    orderNumber: string
) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background-color: #111; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">✓ Giao hàng thành công!</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Đơn hàng <strong>#${orderNumber}</strong> đã được giao thành công!
          </p>

          <p style="color: #666; line-height: 1.6;">
            Cảm ơn bạn đã mua sắm tại Nike Clone. Chúng tôi hy vọng bạn hài lòng với sản phẩm.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}/review" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Đánh giá sản phẩm
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 Nike Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: customerEmail,
        subject: `Đơn hàng #${orderNumber} đã giao thành công - Nike Clone`,
        html
    });
}
