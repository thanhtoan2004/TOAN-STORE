'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function NewGiftCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    card_number: '',
    pin: '',
    initial_balance: 0,
    expires_at: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initial_balance' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/admin/gift-cards');
      } else {
        setError('Failed to create gift card');
      }
    } catch (err) {
      setError('Error creating gift card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/gift-cards" className="text-blue-600 hover:text-blue-900">
            ← Quay lại
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Tạo Gift Card Mới</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số thẻ
              </label>
              <input
                type="text"
                name="card_number"
                value={formData.card_number}
                onChange={handleChange}
                maxLength={16}
                placeholder="16 chữ số"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN
              </label>
              <input
                type="text"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                maxLength={4}
                placeholder="4 chữ số"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị
              </label>
              <input
                type="number"
                name="initial_balance"
                value={formData.initial_balance}
                onChange={handleChange}
                min="0"
                step="1000"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hết hạn
              </label>
              <input
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Tạo Gift Card'}
              </button>
              <Link
                href="/admin/gift-cards"
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
