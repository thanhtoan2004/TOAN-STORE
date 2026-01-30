'use client';

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setEmail('');
        setMessage(data.message);
        setMessageType('success');
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Đã xảy ra lỗi khi đăng ký');
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const footerLinks = {
    featured: [
      { name: 'Air Force 1', href: '/air-force-1' },
      { name: 'Jordan 1', href: '/jordan-1' },
      { name: 'Air Max Dn', href: '/air-max-dn' },
      { name: 'Vomero', href: '/vomero' },
    ],
    shoes: [
      { name: 'All Shoes', href: '/shoes' },
      { name: 'Jordan Shoes', href: '/jordan-shoes' },
      { name: 'Running Shoes', href: '/running-shoes' },
      { name: 'Basketball Shoes', href: '/basketball-shoes' },
    ],
    clothing: [
      { name: 'All Clothing', href: '/clothing' },
      { name: 'Tops & T-Shirts', href: '/tops-t-shirts' },
      { name: 'Shorts', href: '/shorts' },
      { name: 'Hoodies & Pullovers', href: '/hoodies-pullovers' },
    ],
    kids: [
      { name: 'Infant & Toddler Shoes', href: '/kids/infant-toddler-shoes' },
      { name: 'Kids Shoes', href: '/kids-shoes' },
      { name: 'Kids Basketball Shoes', href: '/kids-basketball-shoes' },
      { name: 'Kids Running Shoes', href: '/kids-running-shoes' },
    ],
    help: [
      { name: 'Giúp Đỡ', href: '/help' },
      { name: 'Trạng Thái Đơn Hàng', href: '/orders' },
      { name: 'Vận Chuyển Và Giao Hàng', href: '/help/shipping-delivery' },
      { name: 'Trả Hàng', href: '/help/returns' },
      { name: 'Hủy Đơn', href: '/help/order-cancellation' },
      { name: 'Tùy Chọn Thanh Toán', href: '/help/payment-options' },
      { name: 'Mã Giảm Giá', href: '/vouchers' },
      { name: 'Số Dư Thẻ Qùa Tặng', href: '/gift-card-balance' },
      { name: 'Liên Hệ Chúng Tôi', href: '/help/contact' },
    ],
    company: [
      { name: 'Về TOAN', href: '/about' },
      { name: 'Tin Tức', href: '/news' },
      { name: 'Nghề Nghiệp', href: '/careers' },
      { name: 'Đầu Tư', href: '/investors' },
      { name: 'Mục Đích', href: '/purpose' },
      { name: 'Tính Bền Vững', href: '/sustainability' },
    ],
    promotions: [
      { name: 'Học Sinh', href: '/promo/student' },
      { name: 'Giáo Viên', href: '/promo/teacher' },
      { name: 'Sinh Nhật', href: '/promo/birthday' },
    ]
  };

  return (
    <footer className="bg-[#111] text-white pt-10">
      <div className="nike-container">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-10">
          {/* First section - Larger links */}
          <div className="space-y-4">
            <nav className="flex flex-col space-y-2">
              <Link href="/store" className="text-white font-helvetica-medium text-sm">
                Tìm cửa hàng
              </Link>
              <Link href="/sign-up" className="text-white font-helvetica-medium text-sm">
                Trở thành thành viên
              </Link>
              <Link href="/about" className="text-white font-helvetica-medium text-sm">
                Về TOAN
              </Link>
              <Link href="/help/contact" className="text-white font-helvetica-medium text-sm">
                Gửi phản hồi
              </Link>
            </nav>
          </div>

          {/* Middle sections - GET HELP, ABOUT NIKE */}
          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">GET HELP</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.help.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">GIOI THIEU VE TOAN</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.company.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Last section - Promotions & Newsletter */}
          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">PROMOTIONS & DISCOUNTS</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.promotions.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Newsletter */}
            <div className="pt-4 border-t border-gray-700 mt-6">
              <h4 className="font-helvetica-medium text-xs mb-2">ĐĂNG KÝ NHẬN TIN</h4>
              <p className="text-gray-400 text-xs mb-3">
                Nhận thông tin về sản phẩm mới, ưu đãi độc quyền
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2" suppressHydrationWarning>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition disabled:opacity-50 font-medium text-sm"
                  suppressHydrationWarning
                >
                  {loading ? 'Đang gửi...' : 'Đăng ký'}
                </button>
              </form>
              {isMounted && message && (
                <p className={`text-xs mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex space-x-4 py-5">
          <a href="https://twitter.com/_thanhhtoann_" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
            </svg>
          </a>
          <a href="https://www.facebook.com/dtt6924" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
            </svg>
          </a>
          <a href="https://www.youtube.com/@thanhhtoann" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
            </svg>
          </a>
          <a href="https://www.instagram.com/_thanhhtoann_/" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"></path>
            </svg>
          </a>
        </div>

        {/* Bottom footer - Legal and location */}
        <div className="py-6 border-t border-gray-700 flex flex-col md:flex-row justify-between text-gray-400 text-[10px]">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="flex items-center">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="ml-1">Việt Nam</span>
            </span>
            <span>© 2025 TOAN, Inc. All Rights Reserved</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/guides" className="hover:text-white">Guides</Link>
            <Link href="/terms" className="hover:text-white">Terms of Sale</Link>
            <Link href="/terms-of-use" className="hover:text-white">Terms of Use</Link>
            <Link href="/privacy-policy" className="hover:text-white">TOAN Privacy Policy</Link>
            <Link href="/csr" className="hover:text-white">Corporate Social Responsibility</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
