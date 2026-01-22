import React from 'react';
import Link from 'next/link';

export default function OrderCancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>
          
          <h1 className="text-4xl font-nike-futura mb-6">Hủy Đơn Hàng</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Khi Nào Có Thể Hủy Đơn?</h2>
              <p className="text-gray-700 mb-4">
                Bạn có thể hủy đơn hàng trong các trường hợp sau:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Đơn hàng chưa được xử lý (trạng thái "pending")</li>
                <li>• Đơn hàng chưa được giao cho đơn vị vận chuyển</li>
                <li>• Trong vòng 2 giờ kể từ khi đặt hàng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cách Hủy Đơn Hàng</h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 1: Đăng nhập tài khoản</h3>
                  <p>Đăng nhập vào tài khoản của bạn tại <Link href="/sign-in" className="text-black underline">đây</Link>.</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 2: Truy cập trang Đơn Hàng</h3>
                  <p>Vào trang <Link href="/orders" className="text-black underline">Đơn Hàng</Link> để xem danh sách đơn hàng của bạn.</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 3: Chọn đơn hàng cần hủy</h3>
                  <p>Nhấp vào đơn hàng bạn muốn hủy và chọn "Hủy Đơn".</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Bước 4: Xác nhận hủy</h3>
                  <p>Xác nhận việc hủy đơn hàng. Bạn sẽ nhận được email xác nhận.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Hoàn Tiền</h2>
              <p className="text-gray-700 mb-4">
                Sau khi hủy đơn hàng thành công, tiền sẽ được hoàn lại cho bạn trong vòng <strong>5-7 ngày làm việc</strong>.
                Tiền sẽ được hoàn lại theo phương thức thanh toán ban đầu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Không Thể Hủy Đơn?</h2>
              <p className="text-gray-700 mb-4">
                Nếu đơn hàng đã được xử lý hoặc đang trong quá trình vận chuyển, bạn không thể hủy đơn trực tiếp.
                Trong trường hợp này, bạn có thể:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Từ chối nhận hàng khi giao đến</li>
                <li>• <Link href="/help/returns" className="text-black underline">Trả hàng</Link> sau khi nhận được</li>
                <li>• <Link href="/help/contact" className="text-black underline">Liên hệ với chúng tôi</Link> để được hỗ trợ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cần Hỗ Trợ?</h2>
              <p className="text-gray-700">
                Nếu bạn gặp khó khăn trong việc hủy đơn hàng, vui lòng{' '}
                <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

