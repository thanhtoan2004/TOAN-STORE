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
  gift_wrap_fee: number;
  maintenance_mode: boolean;
  admin_ip_whitelist: string;
  // Dynamic fields
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  copyright_text?: string;
  copyright_text_en?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    store_name: 'TOAN Store',
    store_email: 'admin@toanstore.com',
    store_phone: '0123456789',
    store_address: '123 Main Street',
    store_city: 'Hanoi',
    store_country: 'Vietnam',
    store_currency: 'VND',
    tax_rate: 0.1,
    shipping_cost_domestic: 30000,
    shipping_cost_international: 100000,
    gift_wrap_fee: 25000,
    maintenance_mode: false,
    admin_ip_whitelist: '',
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    copyright_text: '',
    copyright_text_en: '',
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

      if (data.success && Array.isArray(data.data)) {
        // Convert array [{key, value}, ...] to object {key: value, ...}
        const settingsObj: any = {};
        data.data.forEach((item: any) => {
          if (item.key === 'social_links' && typeof item.value === 'object') {
            // Handle legacy nested object
            Object.assign(settingsObj, item.value);
          } else {
            settingsObj[item.key] = item.value;
          }
        });

        // Map database values into the state format
        const formattedSettings: Partial<Settings> = {
          ...settingsObj,
          maintenance_mode:
            settingsObj.maintenance_mode === 'true' ||
            settingsObj.maintenance_mode === '1' ||
            settingsObj.maintenance_mode === true,
          // Numeric conversions
          tax_rate:
            settingsObj.tax_rate !== undefined
              ? parseFloat(settingsObj.tax_rate)
              : settings.tax_rate,
          shipping_cost_domestic:
            settingsObj.shipping_cost_domestic !== undefined
              ? parseFloat(settingsObj.shipping_cost_domestic)
              : settings.shipping_cost_domestic,
          shipping_cost_international:
            settingsObj.shipping_cost_international !== undefined
              ? parseFloat(settingsObj.shipping_cost_international)
              : settings.shipping_cost_international,
          gift_wrap_fee:
            settingsObj.gift_wrap_fee !== undefined
              ? parseFloat(settingsObj.gift_wrap_fee)
              : settings.gift_wrap_fee,
        };

        setSettings((prev) => ({ ...prev, ...formattedSettings }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setSettings((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      setSettings((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
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
        body: JSON.stringify(settings),
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
          <p className="mt-1 text-sm text-gray-500">
            Quản lý thông tin cửa hàng và cài đặt hệ thống
          </p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
                    <input
                      type="text"
                      name="store_country"
                      value={settings.store_country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung bản quyền (Copyright)
                  </label>
                  <input
                    type="text"
                    name="copyright_text"
                    value={settings.copyright_text || ''}
                    onChange={handleChange}
                    placeholder="© 2026 TOAN Store, Inc. Bảo lưu mọi quyền."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 italic">
                    * Dòng chữ hiển thị ở cuối trang web (Footer).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung bản quyền - Tiếng Anh (English Copyright)
                  </label>
                  <input
                    type="text"
                    name="copyright_text_en"
                    value={settings.copyright_text_en || ''}
                    onChange={handleChange}
                    placeholder="© 2026 TOAN Store, Inc. All Rights Reserved."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 italic">
                    * Hiển thị khi khách hàng chuyển sang ngôn ngữ Tiếng Anh.
                  </p>
                </div>
              </div>
            </section>

            {/* Mạng xã hội */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Mạng xã hội & Liên kết</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    value={(settings as any).facebook || ''}
                    onChange={handleChange}
                    placeholder="https://facebook.com/your-store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={(settings as any).instagram || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/your-store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                  <input
                    type="text"
                    name="youtube"
                    value={(settings as any).youtube || ''}
                    onChange={handleChange}
                    placeholder="https://youtube.com/your-store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter (X)
                  </label>
                  <input
                    type="text"
                    name="twitter"
                    value={(settings as any).twitter || ''}
                    onChange={handleChange}
                    placeholder="https://twitter.com/your-store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phí gói quà
                    </label>
                    <input
                      type="number"
                      name="gift_wrap_fee"
                      value={settings.gift_wrap_fee}
                      onChange={handleChange}
                      step="1000"
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

            {/* Cài đặt bảo mật */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Bảo mật & Quản trị</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Whitelist (Admin Panel)
                  </label>
                  <input
                    type="text"
                    name="admin_ip_whitelist"
                    placeholder="Ví dụ: 1.1.1.1, 8.8.8.8 (Để trống để bỏ qua check IP)"
                    value={settings.admin_ip_whitelist}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 italic">
                    * Các IP được phép truy cập vào trang Admin, cách nhau bởi dấu phẩy. Dùng * để
                    cho phép tất cả.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Nhật ký hoạt động (Audit Logs)</h3>
                    <p className="text-xs text-gray-500">
                      Xem lịch sử các thay đổi và đăng nhập của Admin.
                    </p>
                  </div>
                  <a
                    href="/admin/audit-logs"
                    className="text-xs font-bold text-black border border-black px-3 py-1 rounded hover:bg-black hover:text-white transition-colors"
                  >
                    Xem log →
                  </a>
                </div>
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
