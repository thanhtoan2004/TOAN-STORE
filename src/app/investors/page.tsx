import React from 'react';

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Nhà Đầu Tư</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Thông Tin Cho Nhà Đầu Tư</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN là một công ty tư nhân, tập trung vào việc phát triển và phân phối các sản phẩm
                thể thao chất lượng cao tại thị trường Việt Nam và khu vực.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Tầm Nhìn</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi đang phát triển để trở thành thương hiệu thể thao hàng đầu tại Việt Nam,
                với kế hoạch mở rộng ra các thị trường khu vực trong tương lai.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cơ Hội Đầu Tư</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Hiện tại, TOAN không có kế hoạch huy động vốn từ công chúng. Tuy nhiên, chúng tôi
                luôn mở cửa cho các đối tác chiến lược và nhà đầu tư có cùng tầm nhìn.
              </p>
              <p className="text-gray-700">
                Nếu bạn quan tâm đến cơ hội hợp tác hoặc đầu tư, vui lòng{' '}
                <a href="/help/contact" className="text-black underline">liên hệ với chúng tôi</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Báo Cáo Tài Chính</h2>
              <p className="text-gray-700">
                Vì là công ty tư nhân, chúng tôi không công bố báo cáo tài chính công khai.
                Thông tin chi tiết sẽ được cung cấp cho các nhà đầu tư tiềm năng sau khi ký kết
                thỏa thuận bảo mật.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

