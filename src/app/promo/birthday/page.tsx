import React from 'react';
import Link from 'next/link';

export default function BirthdayPromoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Ưu Đãi Sinh Nhật</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Quà Tặng Sinh Nhật Đặc Biệt</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúc mừng sinh nhật! TOAN dành tặng bạn mã giảm giá 15% cho đơn hàng trong tháng sinh nhật của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cách Nhận Ưu Đãi</h2>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>Đăng ký tài khoản trên website TOAN</li>
                <li>Cập nhật ngày sinh trong thông tin tài khoản</li>
                <li>Nhận email chúc mừng sinh nhật với mã giảm giá vào ngày sinh nhật của bạn</li>
                <li>Sử dụng mã giảm giá khi thanh toán (có hiệu lực trong 30 ngày)</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Điều Kiện</h2>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Mã giảm giá chỉ có hiệu lực trong tháng sinh nhật của bạn</li>
                <li>Ưu đãi áp dụng cho tất cả sản phẩm</li>
                <li>Mỗi năm chỉ được nhận một lần</li>
                <li>Không thể kết hợp với các mã giảm giá khác</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cập Nhật Thông Tin</h2>
              <p className="text-gray-700 mb-4">
                Đảm bảo bạn đã cập nhật ngày sinh chính xác trong tài khoản để nhận được ưu đãi sinh nhật.
              </p>
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

