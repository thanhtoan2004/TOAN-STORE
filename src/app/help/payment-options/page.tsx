import React from 'react';
import Link from 'next/link';

export default function PaymentOptionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>

          <h1 className="text-4xl font-bold mb-6">Tùy Chọn Thanh Toán</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Các Phương Thức Thanh Toán</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-black pl-4">
                  <h3 className="font-helvetica-medium text-lg mb-2">Thanh Toán Khi Nhận Hàng (COD)</h3>
                  <p className="text-gray-700">
                    Thanh toán bằng tiền mặt khi nhận hàng. Phương thức này phù hợp cho tất cả các đơn hàng.
                  </p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                  <h3 className="font-helvetica-medium text-lg mb-2">Chuyển Khoản Ngân Hàng</h3>
                  <p className="text-gray-700">
                    Chuyển khoản trực tiếp vào tài khoản ngân hàng của chúng tôi. Thông tin tài khoản sẽ được gửi qua email sau khi đặt hàng.
                  </p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                  <h3 className="font-helvetica-medium text-lg mb-2">Ví Điện Tử (MoMo, ZaloPay)</h3>
                  <p className="text-gray-700">
                    Thanh toán nhanh chóng và tiện lợi qua các ví điện tử phổ biến.
                  </p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                  <h3 className="font-helvetica-medium text-lg mb-2">Thẻ Quà Tặng</h3>
                  <p className="text-gray-700">
                    Sử dụng thẻ quà tặng TOAN để thanh toán. Kiểm tra số dư tại{' '}
                    <Link href="/gift-card-balance" className="text-black underline">đây</Link>.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Bảo Mật Thanh Toán</h2>
              <p className="text-gray-700 mb-4">
                Tất cả các giao dịch thanh toán đều được mã hóa và bảo mật. Chúng tôi không lưu trữ thông tin thẻ tín dụng của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Xử Lý Thanh Toán</h2>
              <p className="text-gray-700 mb-4">
                Đơn hàng sẽ được xử lý sau khi thanh toán được xác nhận. Thời gian xử lý:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• COD: Xử lý ngay sau khi đặt hàng</li>
                <li>• Chuyển khoản: Xử lý trong vòng 1-2 giờ sau khi nhận được xác nhận</li>
                <li>• Ví điện tử: Xử lý ngay sau khi thanh toán thành công</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cần Hỗ Trợ?</h2>
              <p className="text-gray-700">
                Nếu bạn có câu hỏi về thanh toán, vui lòng{' '}
                <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

