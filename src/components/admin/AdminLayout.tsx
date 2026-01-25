'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

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
    { name: 'Coupons', href: '/admin/coupons' },
    { name: 'Banners', href: '/admin/banners' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-black text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Link href="/admin/dashboard" className="text-xl font-bold">
            Nike Admin
          </Link>
        </div>
        <nav className="mt-8 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white border-l-4 border-white'
                    : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
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
