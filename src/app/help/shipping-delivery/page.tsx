import React from 'react';
import Link from 'next/link';

export default function ShippingDeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>
          
          <h1 className="text-4xl font-nike-futura mb-6">Vận Chuyển Và Giao Hàng</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Phí Vận Chuyển</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Miễn phí vận chuyển cho đơn hàng trên <strong>1.000.000₫</strong></li>
                <li>• Phí vận chuyển <strong>30.000₫</strong> cho đơn hàng dưới 1.000.000₫</li>
                <li>• Áp dụng cho tất cả các đơn hàng trong nước</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Thời Gian Giao Hàng</h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <h3 className="font-helvetica-medium mb-2">Khu vực TP. Hồ Chí Minh và Hà Nội:</h3>
                  <p>1-2 ngày làm việc</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Các tỉnh thành khác:</h3>
                  <p>3-5 ngày làm việc</p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium mb-2">Khu vực vùng sâu, vùng xa:</h3>
                  <p>5-7 ngày làm việc</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Theo Dõi Đơn Hàng</h2>
              <p className="text-gray-700 mb-4">
                Sau khi đặt hàng, bạn sẽ nhận được email xác nhận với mã đơn hàng. Bạn có thể sử dụng mã này để theo dõi đơn hàng tại{' '}
                <Link href="/orders" className="text-black underline">trang Đơn Hàng</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Địa Chỉ Giao Hàng</h2>
              <p className="text-gray-700 mb-4">
                Vui lòng đảm bảo địa chỉ giao hàng chính xác và đầy đủ. Nếu có thay đổi, vui lòng liên hệ với chúng tôi ngay lập tức.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cần Hỗ Trợ?</h2>
              <p className="text-gray-700">
                Nếu bạn có bất kỳ câu hỏi nào về vận chuyển và giao hàng, vui lòng{' '}
                <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

