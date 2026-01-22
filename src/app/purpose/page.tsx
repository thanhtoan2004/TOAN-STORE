import React from 'react';

export default function PurposePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-6">Mục Đích</h1>

          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Sứ Mệnh Của Chúng Tôi</h2>
              <p className="text-gray-700 leading-relaxed">
                TOAN tin rằng thể thao có sức mạnh thay đổi thế giới. Sứ mệnh của chúng tôi là 
                mang đến những sản phẩm và trải nghiệm giúp mọi người khám phá tiềm năng của mình, 
                bất kể họ là ai hay họ đến từ đâu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Giá Trị Cốt Lõi</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Đổi Mới</h3>
                  <p className="text-gray-700">
                    Chúng tôi không ngừng đổi mới để tạo ra những sản phẩm tốt hơn, giúp vận động viên 
                    đạt được thành tích cao nhất.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Bình Đẳng</h3>
                  <p className="text-gray-700">
                    Chúng tôi tin rằng mọi người đều xứng đáng có cơ hội tham gia thể thao, bất kể 
                    giới tính, tuổi tác hay hoàn cảnh.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Bền Vững</h3>
                  <p className="text-gray-700">
                    Chúng tôi cam kết bảo vệ hành tinh cho thế hệ tương lai thông qua các hoạt động 
                    bền vững và có trách nhiệm.
                  </p>
                </div>
                <div>
                  <h3 className="font-helvetica-medium text-lg mb-2">Cộng Đồng</h3>
                  <p className="text-gray-700">
                    Chúng tôi hỗ trợ các cộng đồng địa phương và các chương trình thể thao thanh thiếu niên 
                    để tạo ra tác động tích cực.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-helvetica-medium mb-4">Tác Động</h2>
              <p className="text-gray-700 leading-relaxed">
                Thông qua các chương trình và đối tác, chúng tôi đang tạo ra tác động tích cực trong cộng đồng, 
                hỗ trợ các vận động viên trẻ, và thúc đẩy lối sống năng động và lành mạnh.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

