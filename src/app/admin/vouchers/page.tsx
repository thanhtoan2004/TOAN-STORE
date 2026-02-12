'use client';

import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tag, UserCheck, ArrowRight } from 'lucide-react';

export default function VouchersPortalPage() {
  const sections = [
    {
      title: 'Promo Codes',
      description: 'Quản lý mã giảm giá chung cho tất cả khách hàng (VD: SUMMER50, WELCOME).',
      href: '/admin/vouchers/promo-codes',
      icon: <Tag className="w-12 h-12 text-blue-500" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Personal Vouchers',
      description: 'Quản lý voucher cá nhân, mã quà tặng và mã referral dành cho từng user cụ thể.',
      href: '/admin/vouchers/personal-codes',
      icon: <UserCheck className="w-12 h-12 text-green-500" />,
      color: 'bg-green-50'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Vouchers & Coupons</h1>
          <p className="mt-2 text-gray-600">
            Chọn loại mã bạn muốn quản lý bên dưới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Link 
              key={section.title} 
              href={section.href}
              className={`group p-8 rounded-xl border-2 border-transparent transition-all hover:border-black shadow-sm flex flex-col items-center text-center ${section.color}`}
            >
              <div className="mb-6 transform transition-transform group-hover:scale-110">
                {section.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <p className="text-gray-600 mb-8 max-w-xs">{section.description}</p>
              <div className="mt-auto flex items-center font-semibold text-black">
                Truy cập quản lý <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Lưu ý:</strong> Promo Codes áp dụng dựa trên mã nhập tại trang thanh toán. 
                Vouchers thường là số dư credit được cộng trực tiếp vào tài khoản người dùng hoặc mã quà tặng đặc biệt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
