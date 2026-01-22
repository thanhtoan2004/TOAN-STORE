import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewsPage() {
  const newsItems = [
    {
      id: 1,
      title: 'TOAN Ra Mắt Bộ Sưu Tập Mùa Hè 2025',
      date: '15/01/2025',
      excerpt: 'Khám phá bộ sưu tập mới với thiết kế hiện đại và công nghệ tiên tiến',
      image: 'https://ext.same-assets.com/3155489436/3175003540.jpeg',
      category: 'Sản Phẩm'
    },
    {
      id: 2,
      title: 'Chương Trình Tái Chế Giày Cũ',
      date: '10/01/2025',
      excerpt: 'Tham gia chương trình tái chế và nhận ưu đãi cho đơn hàng tiếp theo',
      image: 'https://ext.same-assets.com/3155489436/4012202764.jpeg',
      category: 'Bền Vững'
    },
    {
      id: 3,
      title: 'TOAN Hợp Tác Với Vận Động Viên Quốc Tế',
      date: '05/01/2025',
      excerpt: 'Công bố đối tác mới trong lĩnh vực thể thao chuyên nghiệp',
      image: 'https://ext.same-assets.com/3155489436/3836325111.jpeg',
      category: 'Thể Thao'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-nike-futura mb-4">Tin Tức</h1>
          <p className="text-gray-600 mb-8">
            Cập nhật những tin tức mới nhất từ TOAN
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((item) => (
              <article key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-black text-white text-xs px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2">{item.date}</p>
                  <h2 className="text-xl font-helvetica-medium mb-3">{item.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">{item.excerpt}</p>
                  <Link 
                    href={`/news/${item.id}`}
                    className="text-black font-helvetica-medium hover:underline text-sm"
                  >
                    Đọc thêm →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

