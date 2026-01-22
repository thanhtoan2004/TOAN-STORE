import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Chính Sách Bảo Mật</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">1. Thông Tin Chúng Tôi Thu Thập</h2>
              <p className="text-gray-700 mb-4">Chúng tôi thu thập các thông tin sau:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• Thông tin cá nhân: tên, email, số điện thoại, địa chỉ</li>
                <li>• Thông tin thanh toán: được xử lý bởi các đối tác thanh toán an toàn</li>
                <li>• Thông tin duyệt web: cookies và dữ liệu phân tích</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">2. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Xử lý và giao hàng đơn hàng của bạn</li>
                <li>• Cải thiện dịch vụ và trải nghiệm khách hàng</li>
                <li>• Gửi thông tin về sản phẩm và khuyến mãi (nếu bạn đồng ý)</li>
                <li>• Phân tích và cải thiện website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">3. Bảo Mật Thông Tin</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi sử dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn. 
                Tất cả dữ liệu được mã hóa và lưu trữ an toàn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">4. Chia Sẻ Thông Tin</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ 
                thông tin với các đối tác cần thiết để cung cấp dịch vụ (như đơn vị vận chuyển, 
                đối tác thanh toán).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">5. Quyền Của Bạn</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Truy cập và chỉnh sửa thông tin cá nhân</li>
                <li>• Yêu cầu xóa tài khoản</li>
                <li>• Từ chối nhận email marketing</li>
                <li>• Yêu cầu xuất dữ liệu cá nhân</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">6. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi sử dụng cookies để cải thiện trải nghiệm của bạn. Bạn có thể tắt cookies 
                trong cài đặt trình duyệt, nhưng điều này có thể ảnh hưởng đến chức năng của website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">7. Liên Hệ</h2>
              <p className="text-gray-700">
                Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng{' '}
                <a href="/help/contact" className="text-black underline">liên hệ với chúng tôi</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

