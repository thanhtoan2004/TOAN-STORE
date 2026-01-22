import React from 'react';

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Tính Bền Vững</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cam Kết Của Chúng Tôi</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN cam kết giảm thiểu tác động đến môi trường và tạo ra một tương lai bền vững hơn 
                cho thế hệ mai sau. Chúng tôi đang nỗ lực để đạt được mục tiêu không phát thải carbon 
                vào năm 2030.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Các Sáng Kiến Bền Vững</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Vật Liệu Tái Chế</h3>
                  <p className="text-gray-700">
                    Chúng tôi sử dụng vật liệu tái chế trong sản xuất để giảm thiểu chất thải và bảo vệ môi trường.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Năng Lượng Tái Tạo</h3>
                  <p className="text-gray-700">
                    Các cơ sở sản xuất của chúng tôi sử dụng năng lượng tái tạo từ mặt trời và gió.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Chương Trình Tái Chế</h3>
                  <p className="text-gray-700">
                    Khách hàng có thể trả lại giày cũ để tái chế và nhận ưu đãi cho đơn hàng tiếp theo.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Bao Bì Thân Thiện</h3>
                  <p className="text-gray-700">
                    Chúng tôi sử dụng bao bì có thể tái chế và giảm thiểu nhựa trong đóng gói.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Mục Tiêu 2030</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Giảm 50% lượng khí thải carbon</li>
                <li>• Sử dụng 100% năng lượng tái tạo</li>
                <li>• Tái chế 100% chất thải sản xuất</li>
                <li>• Sử dụng 80% vật liệu tái chế trong sản phẩm</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Tham Gia Cùng Chúng Tôi</h2>
              <p className="text-gray-700">
                Bạn có thể đóng góp vào mục tiêu bền vững bằng cách tham gia chương trình tái chế, 
                chọn sản phẩm làm từ vật liệu tái chế, và chia sẻ thông điệp về tính bền vững.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

