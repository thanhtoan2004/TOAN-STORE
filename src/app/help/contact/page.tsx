'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Clear form when user logs out
  useEffect(() => {
    if (!user) {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể gửi tin nhắn');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi tin nhắn');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="text-gray-600 hover:text-black mb-4 inline-block">
            ← Quay lại Trung Tâm Trợ Giúp
          </Link>
          
          <h1 className="text-4xl font-nike-futura mb-6">Liên Hệ Chúng Tôi</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-helvetica-medium mb-4">Thông Tin Liên Hệ</h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-medium">Email:</p>
                  <a href="mailto:support@toan.com" className="text-black hover:underline">
                    support@toan.com
                  </a>
                </div>
                <div>
                  <p className="font-medium">Hotline:</p>
                  <a href="tel:1900123456" className="text-black hover:underline">
                    1900 123 456
                  </a>
                </div>
                <div>
                  <p className="font-medium">Giờ Làm Việc:</p>
                  <p>Thứ 2 - Chủ Nhật: 8:00 - 22:00</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-helvetica-medium mb-4">Tìm Cửa Hàng</h2>
              <p className="text-gray-700 mb-4">
                Tìm cửa hàng TOAN gần nhất để trải nghiệm sản phẩm trực tiếp.
              </p>
              <Link 
                href="/store"
                className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Tìm Cửa Hàng
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-helvetica-medium mb-6">Gửi Tin Nhắn</h2>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Chủ Đề *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="order">Đơn Hàng</option>
                    <option value="product">Sản Phẩm</option>
                    <option value="shipping">Vận Chuyển</option>
                    <option value="return">Trả Hàng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Tin Nhắn *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Gửi Tin Nhắn
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

