import React from 'react';
import Link from 'next/link';

export default function StudentPromoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Ưu Đãi Học Sinh</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Giảm Giá 10% Cho Học Sinh</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN dành tặng ưu đãi đặc biệt cho học sinh, sinh viên. Chỉ cần xác minh thân phận 
                học sinh/sinh viên của bạn để nhận được giảm giá 10% cho tất cả sản phẩm.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cách Nhận Ưu Đãi</h2>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>Đăng ký tài khoản trên website TOAN</li>
                <li>Gửi ảnh thẻ học sinh/sinh viên hợp lệ đến email: student@toan.com</li>
                <li>Chờ xác minh (thường trong vòng 24-48 giờ)</li>
                <li>Nhận mã giảm giá qua email và sử dụng khi thanh toán</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Điều Kiện</h2>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Thẻ học sinh/sinh viên phải còn hiệu lực</li>
                <li>Ưu đãi áp dụng cho tất cả sản phẩm, không áp dụng cho các sản phẩm đang giảm giá</li>
                <li>Mỗi tài khoản chỉ được xác minh một lần</li>
                <li>Mã giảm giá có thời hạn sử dụng 6 tháng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Bắt Đầu Mua Sắm</h2>
              <Link 
                href="/sign-up"
                className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Đăng Ký Ngay
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

