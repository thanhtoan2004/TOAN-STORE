'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Products', href: '/admin/products' },
    { name: 'Categories', href: '/admin/categories' },
    { name: 'Inventory', href: '/admin/inventory' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Reviews', href: '/admin/reviews' },
    { name: 'Gift Cards', href: '/admin/gift-cards' },
    { name: 'Contact', href: '/admin/contact' },
    { name: 'Wishlist', href: '/admin/wishlist' },
    { name: 'FAQs', href: '/admin/faqs' },
    { name: 'Vouchers', href: '/admin/vouchers' },
    { name: 'Flash Sales', href: '/admin/flash-sales' },
    { name: 'Banners', href: '/admin/banners' },
    { name: 'News', href: '/admin/news' },
    { name: 'Support', href: '/admin/support' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch('/api/auth/admin', { cache: 'no-store' });
        if (!response.ok) {
          router.replace('/admin/login');
          return;
        }
        const data = await response.json();
        const isAdmin = !!(data?.user?.is_admin === 1 || data?.user?.is_admin === true);
        if (!isAdmin) {
          router.replace('/admin/login');
          return;
        }
      } catch {
        router.replace('/admin/login');
        return;
      } finally {
        setCheckingAuth(false);
      }
    };

    check();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-black text-white flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Link href="/admin/dashboard" className="text-xl font-bold">
            Nike Admin
          </Link>
        </div>
        <nav className="mt-8 space-y-2 flex-1 overflow-y-auto px-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-6 py-3 text-sm font-medium transition-colors ${isActive
                  ? 'bg-gray-900 text-white border-l-4 border-white'
                  : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="py-6 px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
