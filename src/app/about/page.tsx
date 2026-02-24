import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Về TOAN STORE</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Câu Chuyện Của Chúng Tôi</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN Store được thành lập với sứ mệnh mang đến những sản phẩm thể thao chất lượng cao,
                phù hợp với phong cách sống năng động của người Việt Nam. Chúng tôi tin rằng mọi người
                đều xứng đáng có cơ hội trải nghiệm những sản phẩm tốt nhất.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Tầm Nhìn</h2>
              <p className="text-gray-700 leading-relaxed">
                Trở thành thương hiệu thể thao hàng đầu tại Việt Nam, được tin tưởng và yêu thích
                bởi hàng triệu khách hàng trên cả nước.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Giá Trị Cốt Lõi</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Chất Lượng:</strong> Cam kết mang đến sản phẩm chất lượng cao nhất</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Đổi Mới:</strong> Không ngừng cải tiến và phát triển sản phẩm</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Khách Hàng:</strong> Đặt khách hàng làm trung tâm trong mọi quyết định</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span><strong>Trách Nhiệm:</strong> Cam kết với môi trường và cộng đồng</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cam Kết</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng,
                từ chất lượng sản phẩm đến dịch vụ chăm sóc khách hàng. Mọi phản hồi của bạn
                đều được chúng tôi lắng nghe và cải thiện.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

