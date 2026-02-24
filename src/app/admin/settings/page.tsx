'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Settings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_country: string;
  store_currency: string;
  tax_rate: number;
  shipping_cost_domestic: number;
  shipping_cost_international: number;
  maintenance_mode: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    store_name: 'TOAN Store',
    store_email: 'admin@nike-clone.com',
    store_phone: '0123456789',
    store_address: '123 Main Street',
    store_city: 'Hanoi',
    store_country: 'Vietnam',
    store_currency: 'VND',
    tax_rate: 0.1,
    shipping_cost_domestic: 30000,
    shipping_cost_international: 100000,
    maintenance_mode: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.success && data.data) {
        // Ensure types are correct from database strings
        const formattedSettings = {
          ...data.data,
          maintenance_mode: data.data.maintenance_mode === 'true' || data.data.maintenance_mode === '1' || data.data.maintenance_mode === true,
          tax_rate: parseFloat(data.data.tax_rate) || 0,
          shipping_cost_domestic: parseFloat(data.data.shipping_cost_domestic) || 0,
          shipping_cost_international: parseFloat(data.data.shipping_cost_international) || 0
        };
        setSettings(formattedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setSettings(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setMessage('Cài đặt đã được lưu thành công!');
      } else {
        setMessage('Lỗi khi lưu cài đặt');
      }
    } catch (error) {
      setMessage('Có lỗi xảy ra');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt chung</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý thông tin cửa hàng và cài đặt hệ thống</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          {message && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Thông tin cửa hàng */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Thông tin cửa hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên cửa hàng
                  </label>
                  <input
                    type="text"
                    name="store_name"
                    value={settings.store_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="store_email"
                      value={settings.store_email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điện thoại
                    </label>
                    <input
                      type="tel"
                      name="store_phone"
                      value={settings.store_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="store_address"
                    value={settings.store_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành phố
                    </label>
                    <input
                      type="text"
                      name="store_city"
                      value={settings.store_city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quốc gia
                    </label>
                    <input
                      type="text"
                      name="store_country"
                      value={settings.store_country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Cài đặt tài chính */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Cài đặt tài chính</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại tiền tệ
                  </label>
                  <select
                    name="store_currency"
                    value={settings.store_currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="VND">VND (Đồng Việt Nam)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế suất (%)
                    </label>
                    <input
                      type="number"
                      name="tax_rate"
                      value={settings.tax_rate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi phí vận chuyển trong nước
                    </label>
                    <input
                      type="number"
                      name="shipping_cost_domestic"
                      value={settings.shipping_cost_domestic}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi phí vận chuyển quốc tế
                    </label>
                    <input
                      type="number"
                      name="shipping_cost_international"
                      value={settings.shipping_cost_international}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Cài đặt hệ thống */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Cài đặt hệ thống</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-black"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Bật chế độ bảo trì (khách hàng sẽ không thể truy cập)
                </label>
              </div>
            </section>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
