import React from 'react';
import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>

          <h1 className="text-4xl font-bold mb-6">Chính Sách Trả Hàng</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Thời Gian Trả Hàng</h2>
              <p className="text-gray-700 mb-4">
                Bạn có thể trả hàng trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng. Sản phẩm phải còn nguyên vẹn, chưa sử dụng và còn đầy đủ nhãn mác, hộp đựng.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Điều Kiện Trả Hàng</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Sản phẩm phải còn nguyên vẹn, chưa sử dụng</li>
                <li>• Còn đầy đủ nhãn mác, thẻ giá gốc</li>
                <li>• Còn hộp đựng và tài liệu kèm theo (nếu có)</li>
                <li>• Không bị hư hỏng, bẩn hoặc có mùi</li>
                <li>• Chưa giặt hoặc sử dụng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cách Thức Trả Hàng</h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 1: Liên hệ với chúng tôi</h3>
                  <p>Đăng nhập vào tài khoản và truy cập trang <Link href="/orders" className="text-black underline">Đơn Hàng</Link> để yêu cầu trả hàng.</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 2: Đóng gói sản phẩm</h3>
                  <p>Đóng gói sản phẩm cẩn thận trong hộp đựng gốc (nếu có).</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 3: Gửi hàng</h3>
                  <p>Chúng tôi sẽ gửi cho bạn địa chỉ trả hàng và mã vận đơn.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Hoàn Tiền</h2>
              <p className="text-gray-700 mb-4">
                Sau khi nhận và kiểm tra sản phẩm trả về, chúng tôi sẽ hoàn tiền cho bạn trong vòng <strong>5-7 ngày làm việc</strong>.
                Tiền sẽ được hoàn lại theo phương thức thanh toán ban đầu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Phí Trả Hàng</h2>
              <p className="text-gray-700">
                Phí vận chuyển trả hàng sẽ do khách hàng chịu, trừ trường hợp sản phẩm bị lỗi từ phía chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cần Hỗ Trợ?</h2>
              <p className="text-gray-700">
                Nếu bạn có bất kỳ câu hỏi nào về chính sách trả hàng, vui lòng{' '}
                <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

