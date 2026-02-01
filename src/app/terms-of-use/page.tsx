import React from 'react';
import Link from 'next/link';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Điều Khoản Sử Dụng</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">1. Chấp Nhận Điều Khoản</h2>
              <p className="text-gray-700 leading-relaxed">
                Bằng việc truy cập và sử dụng website TOAN, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
                Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng không sử dụng website của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">2. Sử Dụng Website</h2>
              <p className="text-gray-700 mb-4">Bạn được phép:</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Truy cập và xem nội dung trên website</li>
                <li>Mua sắm sản phẩm từ website</li>
                <li>Tải xuống và in nội dung cho mục đích cá nhân, phi thương mại</li>
              </ul>
              <p className="text-gray-700 mt-4 mb-4">Bạn không được phép:</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>Sử dụng website cho mục đích bất hợp pháp</li>
                <li>Copy, sao chép hoặc phân phối nội dung mà không có sự cho phép</li>
                <li>Xâm nhập hoặc cố gắng xâm nhập vào hệ thống của website</li>
                <li>Sử dụng robot, spider hoặc các công cụ tự động khác để truy cập website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">3. Tài Khoản Người Dùng</h2>
              <p className="text-gray-700 leading-relaxed">
                Khi tạo tài khoản, bạn có trách nhiệm bảo mật thông tin đăng nhập. Bạn chịu trách nhiệm cho tất cả các hoạt động
                diễn ra dưới tài khoản của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">4. Quyền Sở Hữu Trí Tuệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Tất cả nội dung trên website, bao gồm logo, hình ảnh, văn bản, thiết kế đều thuộc quyền sở hữu của TOAN
                và được bảo vệ bởi luật bản quyền Việt Nam và quốc tế.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">5. Giới Hạn Trách Nhiệm</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng website,
                bao gồm nhưng không giới hạn: thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc hậu quả.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">6. Thay Đổi Điều Khoản</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay sau khi được đăng tải trên website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">7. Liên Hệ</h2>
              <p className="text-gray-700">
                Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng{' '}
                <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

