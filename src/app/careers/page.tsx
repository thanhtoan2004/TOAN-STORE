import React from 'react';
import Link from 'next/link';

import { Laptop, Palette, Megaphone, ShoppingBag, Settings, Users } from 'lucide-react';

export default function CareersPage() {
  const departments = [
    {
      name: 'Công Nghệ',
      description: 'Phát triển sản phẩm và công nghệ mới',
      icon: <Laptop className="w-8 h-8 text-black" />,
    },
    {
      name: 'Thiết Kế',
      description: 'Tạo ra những thiết kế sáng tạo và đột phá',
      icon: <Palette className="w-8 h-8 text-black" />,
    },
    {
      name: 'Marketing',
      description: 'Xây dựng thương hiệu và kết nối với khách hàng',
      icon: <Megaphone className="w-8 h-8 text-black" />,
    },
    {
      name: 'Bán Hàng',
      description: 'Phục vụ khách hàng và phát triển kinh doanh',
      icon: <ShoppingBag className="w-8 h-8 text-black" />,
    },
    {
      name: 'Vận Hành',
      description: 'Đảm bảo hoạt động hiệu quả của công ty',
      icon: <Settings className="w-8 h-8 text-black" />,
    },
    {
      name: 'Nhân Sự',
      description: 'Phát triển đội ngũ và văn hóa công ty',
      icon: <Users className="w-8 h-8 text-black" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Nghề Nghiệp</h1>
          <p className="text-gray-600 mb-8">
            Tham gia đội ngũ TOAN Store và cùng chúng tôi tạo ra những sản phẩm thể thao hàng đầu
          </p>

          <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-helvetica-medium mb-4">Tại Sao Chọn TOAN Store?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-helvetica-medium mb-2">Môi Trường Làm Việc Năng Động</h3>
                <p className="text-gray-600 text-sm">
                  Làm việc trong môi trường sáng tạo, nơi ý tưởng của bạn được đánh giá cao
                </p>
              </div>
              <div>
                <h3 className="font-helvetica-medium mb-2">Phát Triển Nghề Nghiệp</h3>
                <p className="text-gray-600 text-sm">
                  Cơ hội học hỏi và phát triển kỹ năng với các chương trình đào tạo chuyên nghiệp
                </p>
              </div>
              <div>
                <h3 className="font-helvetica-medium mb-2">Phúc Lợi Hấp Dẫn</h3>
                <p className="text-gray-600 text-sm">
                  Gói phúc lợi toàn diện bao gồm bảo hiểm, nghỉ phép và các chương trình khuyến
                  khích
                </p>
              </div>
              <div>
                <h3 className="font-helvetica-medium mb-2">Văn Hóa Đa Dạng</h3>
                <p className="text-gray-600 text-sm">
                  Làm việc với đội ngũ đa dạng từ nhiều nền văn hóa khác nhau
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-helvetica-medium mb-6">Các Phòng Ban</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{dept.icon}</div>
                  <h3 className="text-xl font-helvetica-medium mb-2">{dept.name}</h3>
                  <p className="text-gray-600 text-sm">{dept.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-helvetica-medium mb-4">Nộp Đơn</h2>
            <p className="text-gray-700 mb-6">
              Hiện tại chúng tôi không có vị trí nào đang tuyển dụng. Vui lòng gửi CV của bạn đến{' '}
              <a href="mailto:careers@toanstore.com" className="text-black underline">
                careers@toanstore.com
              </a>{' '}
              để chúng tôi có thể liên hệ khi có cơ hội phù hợp.
            </p>
            <Link
              href="/help/contact"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Liên Hệ Với Chúng Tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
