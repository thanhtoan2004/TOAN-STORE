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
  const {
    orderNumber,
    customerEmail,
    customerName,
    items,
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress,
    estimatedDelivery,
  } = details;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 500;">${item.name}</div>
        ${item.size ? `<div style="font-size: 12px; color: #666;">Size: ${item.size}</div>` : ''}
        ${item.color ? `<div style="font-size: 12px; color: #666;">Màu: ${item.color}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `
    )
    .join('');

  const body = `
        <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
        <p>Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn đã được xác nhận thành công.</p>

          ${
            estimatedDelivery
              ? `
            <div class="box" style="text-align: left;">
              <p style="text-transform: none; font-size: 14px; color: #333; margin: 0;">
                <strong>Dự kiến giao hàng:</strong> ${estimatedDelivery}
              </p>
            </div>
          `
              : ''
          }

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
              ${
                tax > 0
                  ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Thuế:</td>
                  <td style="padding: 8px 0; text-align: right;">${formatPrice(tax)}</td>
                </tr>
              `
                  : ''
              }
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
          <div class="note-box">
            <p style="margin: 5px 0; color: #111;"><strong>${shippingAddress.fullName}</strong></p>
            <p style="margin: 5px 0; color: #666;">${shippingAddress.phone}</p>
            <p style="margin: 5px 0; color: #666;">
              ${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}
            </p>
          </div>

          <!-- CTA Button -->
          <div class="btn-container">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}" class="btn">Xem đơn hàng</a>
          </div>

          <!-- Help Section -->
          <div class="note-box" style="margin-top: 30px;">
            <p class="note-title">Cần hỗ trợ?</p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              Liên hệ với chúng tôi qua email: support@toanstore.com<br>
              Hoặc gọi: 1900-xxxx (8:01 - 22:00 hàng ngày)
            </p>
          </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Xác nhận đơn hàng #${orderNumber} - TOAN Store`,
    html: wrapEmailHtml('Cảm ơn bạn đã đặt hàng', 'check', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn đã được giao cho đơn vị vận chuyển.</p>

    <div class="box" style="text-align: left;">
      <p style="text-transform: none; font-size: 14px; color: #333; margin: 5px 0;"><strong>Đơn vị vận chuyển:</strong> ${carrier}</p>
      <p style="text-transform: none; font-size: 14px; color: #333; margin: 5px 0;"><strong>Mã vận đơn:</strong> ${trackingNumber}</p>
    </div>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}" class="btn">Theo dõi đơn hàng</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Đơn hàng #${orderNumber} đang được giao - TOAN Store`,
    html: wrapEmailHtml('Đơn hàng đang được giao', 'truck', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> đã được giao thành công!</p>
    <p>Cảm ơn bạn đã mua sắm tại TOAN Store. Chúng tôi hy vọng bạn hài lòng với sản phẩm.</p>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderNumber}/review" class="btn">Đánh giá sản phẩm</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Đơn hàng #${orderNumber} đã giao thành công - TOAN Store`,
    html: wrapEmailHtml('Giao hàng thành công', 'check', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Đơn hàng <strong class="text-highlight">#${orderNumber}</strong> của bạn đã được hủy thành công theo yêu cầu.</p>
    <p>Nếu bạn đã thanh toán online, số tiền sẽ được hoàn về tài khoản của bạn trong vòng 3-5 ngày làm việc.</p>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products" class="btn">Tiếp tục mua sắm</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Xác nhận hủy đơn hàng #${orderNumber} - TOAN Store`,
    html: wrapEmailHtml('Đơn hàng đã hủy', 'cancel', body),
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

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Sản phẩm trong danh sách yêu thích của bạn đang giảm giá!</p>

    <div class="box" style="border: 1px dashed #f04e40;">
      <h2 style="font-size: 20px; color: #09090b;">${productName}</h2>
      <p style="text-transform: none; font-size: 18px; margin-top: 10px;">
        <span style="text-decoration: line-through; color: #999;">${formatPrice(oldPrice)}</span>
        <strong style="color: #f04e40; margin-left: 10px;">${formatPrice(newPrice)}</strong>
      </p>
    </div>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}" class="btn">Mua ngay kẻo lỡ</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Giảm giá: ${productName} đã giảm giá!`,
    html: wrapEmailHtml('Giảm giá sốc', 'fire', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Tin vui! Sản phẩm bạn quan tâm đã có hàng trở lại.</p>

    <div class="box">
      <h2 style="font-size: 20px;">${productName}</h2>
      <p style="text-transform: none; color: #28a745; font-weight: 600; margin-top: 8px;">Đã có hàng (Restocked)</p>
    </div>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}" class="btn">Xem sản phẩm</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Hàng về: ${productName} đã có hàng trở lại!`,
    html: wrapEmailHtml('Hàng đã về', 'box', body),
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

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Bạn còn <strong>${itemCount} sản phẩm</strong> trong giỏ hàng đang chờ bạn!</p>

    <div class="box" style="text-align: left;">
      <p style="text-transform: none; font-size: 14px; color: #444; margin: 0 0 10px 0;">
        <strong>Sản phẩm:</strong> ${productNames}
      </p>
      <p style="text-transform: none; font-size: 20px; font-weight: bold; color: #09090b; margin: 0;">
        Tổng: ${formatPrice(cartTotal)}
      </p>
    </div>

    <p>Đừng để sản phẩm yêu thích hết hàng nhé! Hoàn tất đơn hàng ngay bây giờ.</p>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart" class="btn">Quay lại giỏ hàng</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Bạn quên ${itemCount} sản phẩm trong giỏ hàng! - TOAN Store`,
    html: wrapEmailHtml('Bạn quên gì trong giỏ hàng?', 'cart', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Chúng tôi phát hiện một phiên đăng nhập mới vào tài khoản của bạn tại TOAN Store.</p>

    <div class="note-box" style="border-left: 4px solid #18181b;">
      <p style="margin: 5px 0; color: #333;"><strong>Thời gian:</strong> ${time}</p>
      <p style="margin: 5px 0; color: #333;"><strong>Địa chỉ IP:</strong> ${ipAddress}</p>
      <p style="margin: 5px 0; color: #333;"><strong>Vị trí (Dự đoán):</strong> ${location}</p>
      <p style="margin: 5px 0; color: #333;"><strong>Thiết bị/Trình duyệt:</strong> ${device}</p>
    </div>

    <p style="font-size: 14px;">Nếu đây là bạn, bạn không cần làm gì cả và có thể bỏ qua email này.</p>
    <p style="color: #d32f2f; font-size: 14px; font-weight: bold;">Nếu không phải bạn, vui lòng đổi mật khẩu ngay lập tức để bảo vệ tài khoản!</p>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/change-password" class="btn">Kiểm tra tài khoản</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Cảnh báo: Đăng nhập mới vào tài khoản TOAN Store`,
    html: wrapEmailHtml('Cảnh báo Đăng nhập Mới', 'alert', body),
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
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Mật khẩu tài khoản TOAN Store của bạn vừa được thay đổi thành công.</p>

    <div class="note-box" style="border-left: 4px solid #20bf6b;">
      <p style="margin: 5px 0; color: #333;"><strong>Thời gian:</strong> ${time}</p>
      <p style="margin: 5px 0; color: #333;"><strong>Từ địa chỉ IP:</strong> ${ipAddress}</p>
    </div>

    <p style="font-size: 14px;">Nếu bạn thực hiện thay đổi này, bạn có thể an tâm bỏ qua email này.</p>
    <p style="color: #d32f2f; font-size: 14px; font-weight: bold;">Nếu bạn KHÔNG thực hiện thay đổi này, hãy liên hệ ngay với bộ phận hỗ trợ của chúng tôi!</p>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/change-password" class="btn">Đặt lại mật khẩu</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Mật khẩu tài khoản của bạn đã được thay đổi`,
    html: wrapEmailHtml('Đổi Mật Khẩu Thành Công', 'lock', body),
  });
}

/**
 * Send birthday celebration email with a surprise voucher
 */
export async function sendBirthdayEmail(
  customerEmail: string,
  customerName: string,
  voucherCode: string,
  discountValue: string
) {
  const body = `
    <div style="text-align: center;">
      <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
      <p>TOAN Store chúc bạn một ngày sinh nhật thật ý nghĩa và rạng rỡ.</p>
      
      <p style="margin-top: 20px;">Để ngày vui thêm trọn vẹn, chúng tôi dành tặng bạn món quà nhỏ:</p>
      
      <div class="box" style="border: 2px solid #000; background-color: #fff; margin: 30px 0;">
        <p style="margin: 0; color: #666; font-size: 12px; letter-spacing: 2px;">VOUCHER QUÀ TẶNG</p>
        <h2 style="font-size: 40px; margin: 10px 0;">${discountValue}</h2>
        <div style="background: #000; color: #fff; padding: 10px; display: inline-block; letter-spacing: 4px; font-weight: bold; font-size: 20px;">
          ${voucherCode}
        </div>
      </div>

      <p style="font-size: 14px; color: #555;">Mã giảm giá có hiệu lực trong vòng 30 ngày kể từ hôm nay.</p>

      <div class="btn-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Sử dụng quà tặng ngay</a>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Chúc mừng sinh nhật ${customerName}! Nhận quà từ TOAN Store`,
    html: wrapEmailHtml('Chúc mừng sinh nhật', 'star', body),
  });
}

/**
 * Send customer satisfaction survey email
 */
export async function sendCustomerSurveyEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string
) {
  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Gần đây bạn đã nhận được các sản phẩm từ đơn hàng <strong class="text-highlight">#${orderNumber}</strong>.</p>
    <p>Sự hài lòng của bạn là ưu tiên hàng đầu của chúng tôi. Bạn có vui lòng dành 1 phút để chia sẻ trải nghiệm mua sắm vừa qua không?</p>

    <div class="box">
      <p style="text-transform: none; font-size: 16px; margin: 0;">Bạn đánh giá trải nghiệm của mình như thế nào?</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <a href="#" style="text-decoration: none; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; color: #666; font-size: 12px;">Không hài lòng</a>
        <a href="#" style="text-decoration: none; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; color: #666; font-size: 12px;">Bình thường</a>
        <a href="#" style="text-decoration: none; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; color: #666; font-size: 12px;">Hài lòng</a>
        <a href="#" style="text-decoration: none; padding: 8px 12px; border: 1px solid #000; border-radius: 4px; color: #000; font-size: 12px; font-weight: bold;">Rất hài lòng</a>
      </div>
    </div>

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" class="btn">Để lại đánh giá chi tiết</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ mỗi ngày.
    </p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Chia sẻ trải nghiệm của bạn về đơn hàng #${orderNumber}`,
    html: wrapEmailHtml('Ý kiến khách hàng', 'user', body),
  });
}

/**
 * Send monthly membership digest / loyalty report
 */
export async function sendMonthlyDigestEmail(
  customerEmail: string,
  customerName: string,
  tier: string,
  currentPoints: number,
  moneySaved: number,
  pointsNearExpiry: number
) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const body = `
    <p>Xin chào&nbsp;<strong class="text-highlight">${customerName},</strong></p>
    <p>Cùng nhìn lại hành trình mua sắm của bạn tại TOAN Store trong tháng vừa qua nhé!</p>

    <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Hạng thành viên</p>
        <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #0f172a;">${tier.toUpperCase()}</p>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Điểm hiện có</p>
        <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #0f172a;">${currentPoints.toLocaleString('vi-VN')}</p>
      </div>
    </div>

    <div class="box" style="background-image: linear-gradient(to right, #111, #333); color: #fff; border: none;">
      <p style="color: #aaa;">Tổng cộng bạn đã tiết kiệm được</p>
      <h2 style="color: #fff; font-size: 32px; margin: 10px 0;">${formatPrice(moneySaved)}</h2>
      <p style="color: #aaa; text-transform: none;">từ các chương trình ưu đãi thành viên</p>
    </div>

    ${
      pointsNearExpiry > 0
        ? `
      <div class="note-box" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
        <p style="margin: 0; color: #92400e;">⚠️ Bạn có <strong>${pointsNearExpiry.toLocaleString('vi-VN')} điểm</strong> sắp hết hạn vào cuối tháng này. Hãy đổi voucher ngay nhé!</p>
      </div>
    `
        : ''
    }

    <div class="btn-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/settings" class="btn">Quản lý tài khoản VIP</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Tổng kết hoạt động thành viên tháng này - ${customerName}`,
    html: wrapEmailHtml('Bản tin thành viên', 'star', body),
  });
}
