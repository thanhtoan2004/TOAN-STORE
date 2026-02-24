import Link from 'next/link';
import { Ruler, Sparkles, ShoppingCart, RotateCcw, CreditCard, HelpCircle } from 'lucide-react';

export default function GuidesPage() {
  const guides = [
    {
      title: 'Hướng Dẫn Chọn Size Giày',
      description: 'Tìm hiểu cách chọn size giày phù hợp với chân của bạn',
      href: '/help/size-guide',
      icon: <Ruler className="w-8 h-8 text-black" />
    },
    {
      title: 'Hướng Dẫn Chăm Sóc Sản Phẩm',
      description: 'Cách giặt và bảo quản sản phẩm Nike của bạn',
      href: '/help/care',
      icon: <Sparkles className="w-8 h-8 text-black" />
    },
    {
      title: 'Hướng Dẫn Đặt Hàng',
      description: 'Các bước đặt hàng và thanh toán trên website',
      href: '/help/ordering',
      icon: <ShoppingCart className="w-8 h-8 text-black" />
    },
    {
      title: 'Hướng Dẫn Trả Hàng',
      description: 'Quy trình trả hàng và hoàn tiền',
      href: '/help/returns',
      icon: <RotateCcw className="w-8 h-8 text-black" />
    },
    {
      title: 'Hướng Dẫn Thanh Toán',
      description: 'Các phương thức thanh toán được chấp nhận',
      href: '/help/payment-options',
      icon: <CreditCard className="w-8 h-8 text-black" />
    },
    {
      title: 'Câu Hỏi Thường Gặp',
      description: 'Tìm câu trả lời cho các câu hỏi phổ biến',
      href: '/help',
      icon: <HelpCircle className="w-8 h-8 text-black" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Hướng Dẫn</h1>
          <p className="text-gray-600 mb-8">
            Tìm hiểu cách sử dụng website và các dịch vụ của TOAN Store
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, index) => (
              <Link
                key={index}
                href={guide.href}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{guide.icon}</div>
                <h3 className="text-xl font-helvetica-medium mb-2">{guide.title}</h3>
                <p className="text-gray-600 text-sm">{guide.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-helvetica-medium mb-4">Cần Hỗ Trợ Thêm?</h2>
            <p className="text-gray-700 mb-4">
              Nếu bạn không tìm thấy câu trả lời trong các hướng dẫn trên, vui lòng{' '}
              <Link href="/help/contact" className="text-black underline">liên hệ với chúng tôi</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

