import React from 'react';
import Link from 'next/link';

export default function TeacherPromoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gradient-to-r from-green-600 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative nike-container h-full flex flex-col justify-center items-center text-center px-4">
          <div className="text-5xl md:text-6xl mb-4">👨‍🏫</div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-nike-futura mb-3 md:mb-4">
            ƯU ĐÃI GIÁO VIÊN
          </h1>
          <p className="text-base md:text-lg lg:text-xl max-w-2xl">
            Tri ân thầy cô với ưu đãi 20% đặc biệt
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="nike-container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-helvetica-medium mb-6 md:mb-8 text-center">
            Ưu Đãi Dành Riêng Cho Thầy Cô
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">20%</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Giảm Giá</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho tất cả sản phẩm thường xuyên
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">🎁</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Ưu Đãi Đặc Biệt</h3>
              <p className="text-sm md:text-base text-gray-600">
                Voucher 500K vào ngày 20/11
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl md:text-5xl mb-4">🚚</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Miễn Phí Ship</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho mọi đơn hàng
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
                    Tạo tài khoản miễn phí nếu chưa có
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <strong>Xác minh tư cách giáo viên</strong>
                  <p className="text-gray-600 mt-1">
                    Upload thẻ giáo viên hoặc giấy xác nhận từ trường/sở giáo dục
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
                    Sau khi được phê duyệt (1-3 ngày), bạn sẽ nhận mã giảm giá 20% qua email
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <strong>Tận hưởng ưu đãi</strong>
                  <p className="text-gray-600 mt-1">
                    Áp dụng mã khi thanh toán và nhận thêm nhiều ưu đãi độc quyền
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Special Message */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 md:p-8 mb-8 border-l-4 border-green-600">
            <h3 className="text-lg md:text-xl font-medium mb-3">💚 Lời Cảm Ơn</h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              TOAN xin gửi lời tri ân sâu sắc đến quý thầy cô - những người thầy đã cống hiến hết mình
              cho sự nghiệp giáo dục. Chương trình ưu đãi này là món quà nhỏ để tri ân công lao to lớn
              của thầy cô trong việc đào tạo thế hệ trẻ Việt Nam.
            </p>
          </div>

          {/* Terms */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg md:text-xl font-medium mb-4">Điều Kiện & Điều Khoản</h3>
            <ul className="space-y-2 text-sm md:text-base text-gray-600">
              <li>• Áp dụng cho giáo viên đang giảng dạy tại các cơ sở giáo dục được công nhận</li>
              <li>• Cần có thẻ giáo viên hoặc quyết định bổ nhiệm còn hiệu lực</li>
              <li>• Giảm giá 20% cho sản phẩm giá gốc, không áp dụng cho sản phẩm đang sale</li>
              <li>• Miễn phí vận chuyển cho tất cả đơn hàng</li>
              <li>• Mã giảm giá có hiệu lực vĩnh viễn (chừng nào còn là giáo viên)</li>
              <li>• Voucher đặc biệt 500K sẽ được gửi vào ngày 20/11 hàng năm</li>
              <li>• Không kết hợp với các chương trình khuyến mãi khác</li>
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
