'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, MapPin, Package, Heart, Bell, CreditCard, Shield, Palette } from 'lucide-react';

export default function AccountSettings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('vi');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  
  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    recipient_name: '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  useEffect(() => {
    // Chỉ redirect khi auth check hoàn tất
    if (!authLoading && !isAuthenticated) {
      // Clear form data khi logout
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: ''
      });
      setAddresses([]);
      router.push('/sign-in');
      return;
    }

    // Check for URL params
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const returnUrlParam = params.get('returnUrl');
    
    if (tab) {
      setActiveTab(tab);
    }
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }

    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      });
      
      // Load addresses
      if (activeTab === 'addresses') {
        loadAddresses();
      }
    }
  }, [user, isAuthenticated, authLoading, router, activeTab]);

  const loadAddresses = async () => {
    if (!user) return;
    
    setLoadingAddresses(true);
    try {
      const response = await fetch(`/api/addresses?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải địa chỉ:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const url = editingAddress 
        ? '/api/addresses' 
        : '/api/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';
      
      const body = editingAddress
        ? { userId: user.id, addressId: editingAddress.id, ...addressForm }
        : { userId: user.id, ...addressForm };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMessage(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
          label: '',
          recipient_name: '',
          phone: '',
          address_line: '',
          city: '',
          state: '',
          postal_code: '',
          is_default: false
        });
        loadAddresses();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setMessage('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!user || !confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

    try {
      const response = await fetch(`/api/addresses?userId=${user.id}&addressId=${addressId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('Xóa địa chỉ thành công!');
        loadAddresses();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          addressId, 
          action: 'setDefault' 
        })
      });

      if (response.ok) {
        setMessage('Đã đặt làm địa chỉ mặc định!');
        loadAddresses();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Không thể cập nhật địa chỉ');
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || '',
      recipient_name: address.recipient_name || '',
      phone: address.phone || '',
      address_line: address.address_line || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default === 1
    });
    setShowAddressForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/account/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Cập nhật thông tin thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setMessage('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: 'user' },
    { id: 'security', label: 'Bảo mật & Mật khẩu', icon: 'lock' },
    { id: 'addresses', label: 'Địa chỉ giao hàng', icon: 'map-pin' },
    { id: 'orders', label: 'Cài đặt đơn hàng', icon: 'package' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { id: 'notifications', label: 'Thông báo', icon: 'bell' },
    { id: 'payment', label: 'Thanh toán', icon: 'credit-card' },
    { id: 'privacy', label: 'Quyền riêng tư', icon: 'shield' },
    { id: 'appearance', label: 'Giao diện', icon: 'palette' }
  ];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-nike-futura mb-2">Cài đặt tài khoản</h1>
          <p className="text-gray-600">Quản lý thông tin và tùy chọn của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 lg:sticky lg:top-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const IconComponent = {
                    'user': User,
                    'lock': Lock,
                    'map-pin': MapPin,
                    'package': Package,
                    'heart': Heart,
                    'bell': Bell,
                    'credit-card': CreditCard,
                    'shield': Shield,
                    'palette': Palette
                  }[item.icon];
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                        activeTab === item.id ? 'bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.includes('thành công') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message}
                </div>
              )}

              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Thông tin cá nhân</h2>
                  <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Họ *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tên *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input type="email" name="email" value={formData.email} disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 cursor-not-allowed" />
                      <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0123456789" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ngày sinh</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Giới tính</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent">
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                      <Link href="/" className="flex-1">
                        <button type="button" className="w-full py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors">Hủy</button>
                      </Link>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Bảo mật</h2>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Đổi mật khẩu</h3>
                    <p className="text-sm text-gray-600 mb-4">Cập nhật mật khẩu của bạn</p>
                    <Link href="/account/change-password"><button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">Đổi mật khẩu</button></Link>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-semibold">Địa chỉ giao hàng</h2>
                      {returnUrl && (
                        <button
                          onClick={() => router.push(returnUrl)}
                          className="px-4 py-2 text-sm border-2 border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors"
                        >
                          ← Quay lại Checkout
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowAddressForm(true);
                        setEditingAddress(null);
                        setAddressForm({
                          label: '',
                          recipient_name: '',
                          phone: '',
                          address_line: '',
                          city: '',
                          state: '',
                          postal_code: '',
                          is_default: false
                        });
                      }}
                      className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                    >
                      + Thêm địa chỉ mới
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="mb-6 p-6 border-2 border-black rounded-lg bg-gray-50">
                      <h3 className="text-xl font-semibold mb-4">
                        {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                      </h3>
                      <form onSubmit={handleAddressSubmit} className="space-y-4" autoComplete="off">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nhãn địa chỉ (Nhà, Văn phòng...)</label>
                          <input
                            type="text"
                            name="label"
                            value={addressForm.label}
                            onChange={handleAddressFormChange}
                            placeholder="Ví dụ: Nhà riêng, Văn phòng"
                            autoComplete="off"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Tên người nhận *</label>
                            <input
                              type="text"
                              name="recipient_name"
                              value={addressForm.recipient_name}
                              onChange={handleAddressFormChange}
                              required
                              className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={addressForm.phone}
                              onChange={handleAddressFormChange}
                              required
                              className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Địa chỉ *</label>
                          <input
                            type="text"
                            name="address_line"
                            value={addressForm.address_line}
                            onChange={handleAddressFormChange}
                            required
                            placeholder="Số nhà, tên đường"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Thành phố *</label>
                            <input
                              type="text"
                              name="city"
                              value={addressForm.city}
                              onChange={handleAddressFormChange}
                              required
                              className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Quận/Huyện</label>
                            <input
                              type="text"
                              name="state"
                              value={addressForm.state}
                              onChange={handleAddressFormChange}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mã bưu điện</label>
                            <input
                              type="text"
                              name="postal_code"
                              value={addressForm.postal_code}
                              onChange={handleAddressFormChange}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_default"
                            checked={addressForm.is_default}
                            onChange={handleAddressFormChange}
                            className="w-4 h-4"
                          />
                          <label className="text-sm font-medium">Đặt làm địa chỉ mặc định</label>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 rounded-full font-medium transition-colors ${
                              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            {loading ? 'Đang lưu...' : editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                            }}
                            className="flex-1 py-3 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {loadingAddresses ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                      <p className="text-gray-600 mt-4">Đang tải...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Chưa có địa chỉ giao hàng nào</p>
                      <p className="text-sm text-gray-500">Thêm địa chỉ để thanh toán nhanh hơn</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-6 border-2 rounded-lg ${
                            address.is_default ? 'border-black bg-gray-50' : 'border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              {address.label && (
                                <span className="inline-block px-3 py-1 bg-black text-white text-xs rounded-full mb-2">
                                  {address.label}
                                </span>
                              )}
                              {address.is_default === 1 && (
                                <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs rounded-full mb-2 ml-2">
                                  Mặc định
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold text-lg mb-1">{address.recipient_name}</p>
                          <p className="text-gray-600 mb-1">{address.phone}</p>
                          <p className="text-gray-600 mb-3">
                            {address.address_line}
                            {address.state && `, ${address.state}`}
                            {address.city && `, ${address.city}`}
                            {address.postal_code && ` ${address.postal_code}`}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:border-black transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-full hover:bg-red-50 transition-colors"
                            >
                              Xóa
                            </button>
                            {address.is_default !== 1 && (
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:border-black transition-colors"
                              >
                                Đặt mặc định
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Giao diện</h2>
                  <div><label className="block text-sm font-medium mb-3">Ngôn ngữ</label><select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
