import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Điều Khoản Bán Hàng</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">1. Chấp Nhận Điều Khoản</h2>
              <p className="text-gray-700 leading-relaxed">
                Bằng việc mua sắm tại TOAN Store, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">2. Giá Cả và Thanh Toán</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Tất cả giá cả được hiển thị bằng đồng Việt Nam (₫)</li>
                <li>• Giá có thể thay đổi mà không cần thông báo trước</li>
                <li>• Thanh toán phải được hoàn tất trước khi giao hàng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">3. Vận Chuyển</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi sẽ cố gắng giao hàng trong thời gian đã cam kết. Tuy nhiên, thời gian giao hàng
                có thể bị ảnh hưởng bởi các yếu tố ngoài tầm kiểm soát của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">4. Trả Hàng và Hoàn Tiền</h2>
              <p className="text-gray-700 leading-relaxed">
                Bạn có thể trả hàng trong vòng 30 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên vẹn
                và chưa sử dụng. Xem thêm chi tiết tại{' '}
                <a href="/help/returns" className="text-black underline">Chính Sách Trả Hàng</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">5. Quyền Sở Hữu Trí Tuệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Tất cả nội dung trên website, bao gồm logo, hình ảnh, văn bản đều thuộc quyền sở hữu
                của TOAN Store và được bảo vệ bởi luật bản quyền.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">6. Liên Hệ</h2>
              <p className="text-gray-700">
                Nếu bạn có câu hỏi về điều khoản này, vui lòng{' '}
                <a href="/help/contact" className="text-black underline">liên hệ với chúng tôi</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

