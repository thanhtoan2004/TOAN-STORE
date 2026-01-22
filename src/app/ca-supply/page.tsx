import React from 'react';

export default function CASupplyChainActPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">California Supply Chain Act</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <p className="text-gray-700 leading-relaxed mb-4">
                TOAN cam kết tuân thủ Đạo luật Chuỗi Cung ứng California (California Transparency in Supply Chains Act) 
                và các quy định về lao động và nhân quyền.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Cam Kết Của Chúng Tôi</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>
                    <strong>Không Sử Dụng Lao Động Cưỡng Bức:</strong> Chúng tôi không chấp nhận lao động cưỡng bức 
                    hoặc lao động trẻ em trong chuỗi cung ứng của mình.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>
                    <strong>Kiểm Tra Nhà Cung Cấp:</strong> Chúng tôi thực hiện đánh giá và kiểm tra các nhà cung cấp 
                    để đảm bảo tuân thủ các tiêu chuẩn lao động.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>
                    <strong>Đào Tạo:</strong> Chúng tôi cung cấp đào tạo cho nhân viên và đối tác về các vấn đề 
                    lao động và nhân quyền.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>
                    <strong>Báo Cáo:</strong> Chúng tôi duy trì hệ thống báo cáo để theo dõi và giải quyết các vấn đề 
                    liên quan đến chuỗi cung ứng.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Liên Hệ</h2>
              <p className="text-gray-700">
                Để biết thêm thông tin về chính sách chuỗi cung ứng của chúng tôi, vui lòng{' '}
                <a href="/help/contact" className="text-black underline">liên hệ với chúng tôi</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

