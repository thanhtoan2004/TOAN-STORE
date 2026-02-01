import React from 'react';
import Link from 'next/link';

export default function StudentPromoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative nike-container h-full flex flex-col justify-center items-center text-center px-4">
          <div className="text-5xl md:text-6xl mb-4">🎓</div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">
            ƯU ĐÃI HỌC SINH - SINH VIÊN
          </h1>
          <p className="text-base md:text-lg lg:text-xl max-w-2xl">
            Giảm giá 15% cho tất cả học sinh và sinh viên
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="nike-container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-helvetica-medium mb-6 md:mb-8 text-center">
            Ưu Đãi Dành Cho Bạn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">15%</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Giảm Giá</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho tất cả sản phẩm thường xuyên
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">🎁</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Quà Tặng</h3>
              <p className="text-sm md:text-base text-gray-600">
                Voucher đặc biệt vào sinh nhật
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">🚚</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Miễn Phí Ship</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho đơn hàng từ 800.000đ
              </p>
            </div>
          </div>

          {/* How to Register */}
          <div className="bg-gray-50 rounded-lg p-6 md:p-10 mb-8">
            <h2 className="text-2xl md:text-3xl font-helvetica-medium mb-6">
              Cách Đăng Ký
            </h2>
            <ol className="space-y-4 text-sm md:text-base">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <strong>Đăng ký tài khoản TOAN</strong>
                  <p className="text-gray-600 mt-1">
                    Tạo tài khoản miễn phí tại trang chủ hoặc ứng dụng TOAN
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <strong>Xác minh tư cách học sinh/sinh viên</strong>
                  <p className="text-gray-600 mt-1">
                    Upload thẻ sinh viên hoặc giấy xác nhận từ trường
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <strong>Nhận mã giảm giá</strong>
                  <p className="text-gray-600 mt-1">
                    Sau khi được phê duyệt, bạn sẽ nhận mã giảm giá 15% qua email
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <strong>Bắt đầu mua sắm</strong>
                  <p className="text-gray-600 mt-1">
                    Áp dụng mã giảm giá khi thanh toán và tận hưởng ưu đãi
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Terms */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg md:text-xl font-medium mb-4">Điều Kiện & Điều Khoản</h3>
            <ul className="space-y-2 text-sm md:text-base text-gray-600">
              <li>• Áp dụng cho học sinh, sinh viên từ 16-25 tuổi</li>
              <li>• Cần có thẻ sinh viên hoặc giấy xác nhận đang học còn hiệu lực</li>
              <li>• Giảm giá 15% cho sản phẩm giá gốc, không áp dụng cho sản phẩm sale</li>
              <li>• Không kết hợp với các chương trình khuyến mãi khác</li>
              <li>• Mã giảm giá có hiệu lực 1 năm kể từ ngày cấp</li>
              <li>• TOAN có quyền hủy ưu đãi nếu phát hiện gian lận</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/sign-up"
              className="inline-block bg-black text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium hover:bg-gray-800 transition-colors text-sm md:text-base"
            >
              Đăng Ký Ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
