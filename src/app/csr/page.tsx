import React from 'react';

export default function CorporateSocialResponsibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Cam Kết Trách Nhiệm Xã Hội</h1>
          <p className="text-lg text-gray-600 mb-8">
            TOAN cam kết phát triển bền vững thông qua các hoạt động kinh doanh có trách nhiệm với môi trường,
            xã hội và cộng đồng.
          </p>

          <div className="space-y-6">
            {/* Bảo vệ Môi trường */}
            <section className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🌱</span>
                <h2 className="text-2xl font-helvetica-medium">Bảo Vệ Môi Trường</h2>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Giảm Khí Thải Carbon:</strong> Cam kết giảm 30% lượng khí thải CO₂ trong quá trình
                    sản xuất và vận chuyển đến năm 2030.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Sử Dụng Năng Lượng Tái Tạo:</strong> Chuyển đổi 50% nguồn năng lượng sang năng lượng
                    tái tạo (mặt trời, gió) trong các cơ sở sản xuất.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Tái Chế & Giảm Rác Thải:</strong> Thu gom và tái chế giày cũ, giảm 80% rác thải nhựa
                    trong bao bì sản phẩm.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Vật Liệu Bền Vững:</strong> Sử dụng vải tái chế, da thuộc thân thiện môi trường và
                    cao su tự nhiên trong sản xuất.
                  </span>
                </li>
              </ul>
            </section>

            {/* Quyền Lợi Người Lao Động */}
            <section className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">👷</span>
                <h2 className="text-2xl font-helvetica-medium">Quyền Lợi Người Lao Động</h2>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Môi Trường Làm Việc An Toàn:</strong> Đảm bảo tiêu chuẩn an toàn lao động theo
                    Luật Lao động Việt Nam và các quy định quốc tế.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Lương Công Bằng & Phúc Lợi:</strong> Trả lương tối thiểu theo quy định, bảo hiểm đầy đủ,
                    thưởng hiệu quả và các chế độ phúc lợi khác.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Không Phân Biệt Đối Xử:</strong> Tôn trọng đa dạng và bình đẳng giới, không phân biệt
                    chủng tộc, tôn giáo hay giới tính.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Đào Tạo & Phát Triển:</strong> Cung cấp chương trình đào tạo kỹ năng, nâng cao tay nghề
                    và cơ hội thăng tiến cho nhân viên.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Không Sử Dụng Lao Động Trẻ Em:</strong> Tuân thủ nghiêm ngặt quy định về độ tuổi lao động,
                    không thuê lao động dưới 18 tuổi.
                  </span>
                </li>
              </ul>
            </section>

            {/* Đóng Góp Cộng Đồng */}
            <section className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">❤️</span>
                <h2 className="text-2xl font-helvetica-medium">Đóng Góp Cộng Đồng</h2>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Hỗ Trợ Giáo Dục:</strong> Tài trợ học bổng, xây dựng thư viện và sân chơi cho trẻ em
                    vùng khó khăn.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Khuyến Khích Thể Thao:</strong> Tổ chức giải chạy từ thiện, hỗ trợ vận động viên trẻ
                    và phát triển thể thao cộng đồng.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Từ Thiện & Cứu Trợ:</strong> Ủng hộ các hoàn cảnh khó khăn, cứu trợ thiên tai và
                    hỗ trợ y tế cho người dân.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 font-bold mr-2">✓</span>
                  <span>
                    <strong>Hợp Tác Với Nhà Cung Cấp Địa Phương:</strong> Ưu tiên làm việc với các doanh nghiệp
                    và nhà cung cấp Việt Nam để phát triển kinh tế địa phương.
                  </span>
                </li>
              </ul>
            </section>

            {/* Minh Bạch & Báo Cáo */}
            <section className="bg-white rounded-lg p-8 shadow-sm">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📊</span>
                <h2 className="text-2xl font-helvetica-medium">Minh Bạch & Báo Cáo</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chúng tôi cam kết công khai và minh bạch về các hoạt động CSR, thường xuyên công bố báo cáo
                phát triển bền vững hàng năm.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-2">✓</span>
                  <span>Kiểm toán định kỳ bởi tổ chức độc lập về môi trường và lao động</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-2">✓</span>
                  <span>Công bố báo cáo tác động xã hội và môi trường hàng quý</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-bold mr-2">✓</span>
                  <span>Hệ thống phản hồi mở để tiếp nhận ý kiến từ cộng đồng và khách hàng</span>
                </li>
              </ul>
            </section>

            {/* Liên Hệ */}
            <section className="bg-gradient-to-r from-gray-900 to-black text-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-helvetica-medium mb-4">Liên Hệ</h2>
              <p className="leading-relaxed mb-4">
                Nếu bạn có câu hỏi hoặc muốn biết thêm thông tin về các hoạt động trách nhiệm xã hội của chúng tôi,
                vui lòng liên hệ với chúng tôi qua:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/help/contact"
                  className="inline-block bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  Liên Hệ Ngay
                </a>
                <a
                  href="mailto:csr@toan.vn"
                  className="inline-block border-2 border-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-black transition-colors text-center"
                >
                  Email: csr@toan.vn
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

