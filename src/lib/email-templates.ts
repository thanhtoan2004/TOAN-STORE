import { sendEmail, wrapEmailHtml } from './mail';

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

  const body = `
        <div style="padding: 10px 0;">
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
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Xác nhận đơn hàng #${orderNumber} - TOAN Store`,
    html: wrapEmailHtml('Xác nhận đơn hàng', 'check', body)
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
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Đơn hàng #${orderNumber} đang được giao - TOAN Store`,
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
            Cảm ơn bạn đã mua sắm tại TOAN Store. Chúng tôi hy vọng bạn hài lòng với sản phẩm.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}/review" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Đánh giá sản phẩm
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Đơn hàng #${orderNumber} đã giao thành công - TOAN Store`,
    html
  });
}
/**
 * Send order cancelled notification
 */
export async function sendOrderCancelledEmail(
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
        <div style="background-color: #d32f2f; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">Đơn hàng đã hủy</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Đơn hàng <strong>#${orderNumber}</strong> của bạn đã được hủy thành công theo yêu cầu.
          </p>

          <p style="color: #666; line-height: 1.6;">
            Nếu bạn đã thanh toán online, số tiền sẽ được hoàn về tài khoản của bạn trong vòng 3-5 ngày làm việc.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Tiếp tục mua sắm
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Xác nhận hủy đơn hàng #${orderNumber} - TOAN Store`,
    html
  });
}

/**
 * Send wishlist sale notification
 */
export async function sendWishlistSaleEmail(
  customerEmail: string,
  customerName: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
  productId: number
) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background-color: #f04e40; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">GIẢM GIÁ SỐC! 🔥</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Sản phẩm trong danh sách yêu thích của bạn đang giảm giá!
          </p>

          <div style="background-color: #fff8f8; padding: 20px; border: 1px dashed #f04e40; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #111;">${productName}</h3>
            <p style="margin: 0; font-size: 18px;">
              <span style="text-decoration: line-through; color: #999;">${formatPrice(oldPrice)}</span>
              <span style="color: #f04e40; font-weight: bold; margin-left: 10px;">${formatPrice(newPrice)}</span>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Mua ngay kẻo lỡ
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `🔥 Giảm giá: ${productName} đã giảm giá!`,
    html
  });
}

/**
 * Send wishlist restock notification
 */
export async function sendWishlistRestockEmail(
  customerEmail: string,
  customerName: string,
  productName: string,
  productId: number
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
          <h1 style="margin: 0;">Hàng đã về! 📦</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Tin vui! Sản phẩm bạn quan tâm đã có hàng trở lại.
          </p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; color: #111;">${productName}</h3>
            <p style="margin: 10px 0 0 0; color: #28a745; font-weight: 600;">Đã có hàng (Restocked)</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Xem sản phẩm
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `📦 Hàng về: ${productName} đã có hàng trở lại!`,
    html
  });
}

/**
 * Send abandoned cart reminder email
 */
export async function sendAbandonedCartEmail(
  customerEmail: string,
  customerName: string,
  itemCount: number,
  cartTotal: number,
  productNames: string
) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background-color: #111; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">Bạn quên gì trong giỏ hàng? 🛒</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Bạn còn <strong>${itemCount} sản phẩm</strong> trong giỏ hàng đang chờ bạn!
          </p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #444;">
              <strong>Sản phẩm:</strong> ${productNames}
            </p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111;">
              Tổng: ${formatPrice(cartTotal)}
            </p>
          </div>

          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Đừng để sản phẩm yêu thích hết hàng nhé! Hoàn tất đơn hàng ngay bây giờ.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Quay lại giỏ hàng
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
          <p style="margin: 5px 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `🛒 Bạn quên ${itemCount} sản phẩm trong giỏ hàng! - TOAN Store`,
    html
  });
}

/**
 * Send new login security alert email
 */
export async function sendNewLoginEmail(
  customerEmail: string,
  customerName: string,
  time: string,
  ipAddress: string,
  location: string,
  device: string
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
          <h1 style="margin: 0;">Cảnh báo Đăng nhập Mới 🛡️</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Chúng tôi phát hiện một phiên đăng nhập mới vào tài khoản của bạn tại TOAN Store.
          </p>

          <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #111; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Thời gian:</strong> ${time}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Địa chỉ IP:</strong> ${ipAddress}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Vị trí (Dự đoán):</strong> ${location}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Thiết bị/Trình duyệt:</strong> ${device}</p>
          </div>

          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Nếu đây là bạn, bạn không cần làm gì cả và có thể bỏ qua email này.
          </p>
          <p style="color: #d32f2f; line-height: 1.6; font-size: 14px; font-weight: bold;">
            Nếu không phải bạn, vui lòng đổi mật khẩu ngay lập tức để bảo vệ tài khoản!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/change-password" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Kiểm tra tài khoản
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Cảnh báo: Đăng nhập mới vào tài khoản TOAN Store`,
    html
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  customerEmail: string,
  customerName: string,
  time: string,
  ipAddress: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <div style="background-color: #20bf6b; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0;">Đổi Mật Khẩu Thành Công 🔒</h1>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="color: #666; line-height: 1.6;">
            Xin chào ${customerName},<br>
            Mật khẩu tài khoản TOAN Store của bạn vừa được thay đổi thành công.
          </p>

          <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #20bf6b; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Thời gian:</strong> ${time}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Từ địa chỉ IP:</strong> ${ipAddress}</p>
          </div>

          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Nếu bạn thực hiện thay đổi này, bạn có thể an tâm bỏ qua email này.
          </p>
          <p style="color: #d32f2f; line-height: 1.6; font-size: 14px; font-weight: bold;">
            Nếu bạn KHÔNG thực hiện thay đổi này, hãy liên hệ ngay với bộ phận hỗ trợ của chúng tôi!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/change-password" 
               style="display: inline-block; background-color: #111; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Đặt lại mật khẩu
            </a>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `🔒 Mật khẩu tài khoản của bạn đã được thay đổi`,
    html
  });
}
