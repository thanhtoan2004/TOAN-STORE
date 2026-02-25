'use client';

import { formatDateTime, formatDate, formatCurrency } from '@/lib/date-utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, MapPin, Package, Heart, Bell, CreditCard, Shield, Palette, Star, Award, Building2, Wallet, Ticket, Monitor, Smartphone } from 'lucide-react';

export default function AccountSettings() {
  const { t, language: currentLang, setLanguage } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [darkMode, setDarkMode] = useState(false);
  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [smsOrderNotifications, setSmsOrderNotifications] = useState(false);

  // Privacy states
  const [dataPersistence, setDataPersistence] = useState(true);
  const [researchUsage, setResearchUsage] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [searchableProfile, setSearchableProfile] = useState(false);

  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Sensitive action states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [pendingAction, setPendingAction] = useState<'export' | 'delete' | 'toggle2fa' | null>(null);
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Device Management state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // General Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    danger: false,
    onConfirm: () => { }
  });

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

  // 1. Hook kiểm tra Auth & URL Params (chạy 1 lần trên client mount và khi auth thay đổi)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: ''
      });
      setAddresses([]);
      router.push('/sign-in');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const returnUrlParam = params.get('returnUrl');

    if (tab) setActiveTab(tab);
    if (returnUrlParam) setReturnUrl(returnUrlParam);
  }, [isAuthenticated, authLoading, router]);

  // 2. Hook khởi tạo form data từ user (chỉ chạy khi thông tin user từ AuthContext thay đổi)
  useEffect(() => {
    const formatDateForInput = (dateStr: string | undefined) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return '';
      }
    };

    if (user) {
      setFormData(prev => {
        // Tránh reset nếu user đang gõ (chỉ cập nhật nếu form đang rỗng hoặc được tải lại sau khi save)
        return {
          firstName: user.firstName || prev.firstName || '',
          lastName: user.lastName || prev.lastName || '',
          email: user.email || prev.email || '',
          phone: user.phone || prev.phone || '',
          dateOfBirth: formatDateForInput(user.dateOfBirth) || prev.dateOfBirth || '',
          gender: user.gender || prev.gender || ''
        };
      });
    }
  }, [user]);

  // 3. Hook tải địa chỉ khi mở tab addresses
  useEffect(() => {
    if (user && activeTab === 'addresses') {
      loadAddresses();
    }
  }, [activeTab, user]);

  // 4. Hook tải danh sách phiên đăng nhập khi mở tab security
  useEffect(() => {
    if (user && activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab, user]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/account/sessions');
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setConfirmConfig({
      title: sessionId === 'all' ? 'Đăng xuất khỏi tất cả thiết bị' : 'Thu hồi phiên đăng nhập',
      message: sessionId === 'all'
        ? 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị? Điều này sẽ yêu cầu bạn đăng nhập lại trên mọi thiết bị hiện đang hoạt động.'
        : 'Bạn có chắc chắn muốn thu hồi phiên đăng nhập này? Thiết bị sẽ bị đăng xuất ngay lập tức.',
      confirmText: sessionId === 'all' ? 'Đăng xuất tất cả' : 'Thu hồi',
      cancelText: 'Hủy',
      danger: true,
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        setRevokingSession(sessionId);
        try {
          const res = await fetch('/api/account/sessions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.success) {
            if (sessionId === 'all') {
              window.location.href = '/sign-in';
            } else {
              setSessions(prev => prev.filter((s: any) => s.id !== sessionId));
            }
          }
        } catch (e) {
          console.error('Revoke session error:', e);
        } finally {
          setRevokingSession(null);
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

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
      console.error('DEBUG: loadAddresses Fetch Error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('DEBUG: Network error or server is unreachable');
      }
      setMessage('Không thể tải địa chỉ. Vui lòng thử lại sau.');
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
        // Refresh trang để lấy data mới cho AuthContext
        setTimeout(() => {
          setMessage('');
          window.location.reload();
        }, 1500);
      } else {
        setMessage(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setMessage('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    // If password not verified yet, open modal
    if (!isPasswordModalOpen || pendingAction !== 'export') {
      setPendingAction('export');
      setPasswordValue('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/account/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nike_personal_data_${user?.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setMessage('Dữ liệu của bạn đang được tải xuống.');
        setIsPasswordModalOpen(false);
        setPendingAction(null);
      } else {
        setMessage('Không thể xuất dữ liệu. Vui lòng thử lại sau.');
      }
    } catch (error) {
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // If password not verified yet, open modal
    if (!isPasswordModalOpen || pendingAction !== 'delete') {
      setPendingAction('delete');
      setPasswordValue('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsPasswordModalOpen(false);
        setPendingAction(null);
        alert('Tài khoản của bạn đã được xóa thành công. Bạn sẽ được chuyển hướng về trang chủ.');
        window.location.href = '/';
      } else {
        const data = await response.json();
        setMessage(data.message || 'Không thể xóa tài khoản');
      }
    } catch (error) {
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValue) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    setVerifyingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/account/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordValue })
      });

      const data = await response.json();

      if (response.ok) {
        // Password verified, execute the pending action
        if (pendingAction === 'export') {
          handleExportData();
        } else if (pendingAction === 'delete') {
          handleDeleteAccount();
        } else if (pendingAction === 'toggle2fa') {
          handleToggle2FA();
        }
      } else {
        setPasswordError(data.message || 'Mật khẩu không chính xác');
      }
    } catch (error) {
      setPasswordError('Lỗi kết nối server');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !(user as any)?.two_factor_enabled,
          password: passwordValue
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setIsPasswordModalOpen(false);
        setPendingAction(null);
        window.location.reload();
      } else {
        setPasswordError(data.message || 'Lỗi khi cập nhật 2FA');
      }
    } catch (e) {
      setPasswordError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { id: 'membership', label: t.common.membership, icon: 'star' },
    { id: 'personal', label: t.common.profile, icon: 'user' },
    { id: 'security', label: t.common.security, icon: 'lock' },
    { id: 'addresses', label: t.common.addresses, icon: 'map-pin' },
    { id: 'orders', label: t.common.orders, icon: 'package' },
    { id: 'wishlist', label: t.common.wishlist, icon: 'heart' },
    { id: 'notifications', label: t.common.notifications, icon: 'bell' },
    { id: 'payment', label: t.common.payment, icon: 'credit-card' },
    { id: 'vouchers', label: 'Vouchers của tôi', icon: 'ticket' },
    { id: 'privacy', label: t.common.privacy, icon: 'shield' },
    { id: 'appearance', label: t.common.appearance, icon: 'palette' }
  ];

  // Helper function to calculate progress
  const getMembershipProgress = (points: number, tier: string) => {
    if (tier === 'platinum') return 100;
    if (tier === 'gold') return Math.max(0, Math.min(100, (points - 5000) / (10000 - 5000) * 100));
    if (tier === 'silver') return Math.max(0, Math.min(100, (points - 1000) / (5000 - 1000) * 100));
    return Math.max(0, Math.min(100, points / 1000 * 100));
  };

  const getNextTierPoints = (tier: string) => {
    if (tier === 'platinum') return 0;
    if (tier === 'gold') return 10000;
    if (tier === 'silver') return 5000;
    return 1000;
  };

  const getTierColor = (tier: string) => {
    if (tier === 'platinum') return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (tier === 'gold') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (tier === 'silver') return 'text-gray-500 bg-gray-50 border-gray-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const currentPoints = (user as any)?.accumulatedPoints || 0;
  const currentTier = (user as any)?.membershipTier || 'bronze';
  const progress = getMembershipProgress(currentPoints, currentTier);
  const nextCheckpoint = getNextTierPoints(currentTier);

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
          <h1 className="text-3xl font-bold mb-2">{t.common.settings}</h1>
          <p className="text-gray-600">Quản lý thông tin và tùy chọn của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 lg:sticky lg:top-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const IconComponent = {
                    'star': Star,
                    'user': User,
                    'lock': Lock,
                    'map-pin': MapPin,
                    'package': Package,
                    'heart': Heart,
                    'bell': Bell,
                    'credit-card': CreditCard,
                    'shield': Shield,
                    'palette': Palette,
                    'ticket': Ticket
                  }[item.icon];

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'vouchers') {
                          router.push('/account/vouchers');
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === item.id ? 'bg-black text-white' : 'hover:bg-gray-100'
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
                <div className={`mb-6 p-4 rounded-lg ${message.includes('thành công') || message.includes('tải xuống') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message}
                </div>
              )}

              {activeTab === 'membership' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <Award className="w-8 h-8" />
                    Hạng thành viên
                  </h2>

                  <div className={`p-6 border rounded-xl mb-6 ${getTierColor(currentTier)}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-wider font-semibold opacity-70">Hạng hiện tại</p>
                        <h3 className="text-3xl font-bold uppercase mt-1">
                          {currentTier === 'platinum' ? 'Bạch kim (Platinum)' : currentTier === 'gold' ? 'Vàng (Gold)' : currentTier === 'silver' ? 'Bạc (Silver)' : 'Đồng (Bronze)'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-wider font-semibold opacity-70">Điểm tích lũy</p>
                        <p className="text-3xl font-bold mt-1">{currentPoints.toLocaleString('vi-VN')} điểm</p>
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-white bg-opacity-50">
                          {Math.round(progress)}%
                        </div>
                        {currentTier !== 'platinum' && (
                          <div className="text-xs font-semibold inline-block">
                            Còn {Math.max(0, nextCheckpoint - currentPoints).toLocaleString('vi-VN')} điểm để thăng hạng
                          </div>
                        )}
                        {currentTier === 'platinum' && (
                          <div className="text-xs font-semibold inline-block">
                            Bạn đang ở hạng cao nhất!
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-black bg-opacity-10">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className={`p-4 border rounded-lg ${currentTier === 'bronze' ? 'ring-2 ring-black bg-gray-50' : 'opacity-60'}`}>
                      <h4 className="font-bold text-lg mb-2 text-amber-900">Đồng (Bronze)</h4>
                      <p className="text-sm text-gray-600 mb-2">0 - 999 điểm</p>
                      <ul className="text-sm space-y-1">
                        <li>• Tích điểm đổi quà</li>
                        <li>• Ưu đãi sinh nhật</li>
                      </ul>
                    </div>
                    <div className={`p-4 border rounded-lg ${currentTier === 'silver' ? 'ring-2 ring-black bg-gray-50' : 'opacity-60'}`}>
                      <h4 className="font-bold text-lg mb-2 text-gray-600">Bạc (Silver)</h4>
                      <p className="text-sm text-gray-600 mb-2">1,000 - 4,999 điểm</p>
                      <ul className="text-sm space-y-1">
                        <li>• Tất cả quyền lợi hạng Đồng</li>
                        <li>• Freeship mọi đơn hàng</li>
                        <li>• Giảm 5% khi mua hàng</li>
                      </ul>
                    </div>
                    <div className={`p-4 border rounded-lg ${currentTier === 'gold' ? 'ring-2 ring-black bg-gray-50' : 'opacity-60'}`}>
                      <h4 className="font-bold text-lg mb-2 text-yellow-600">Vàng (Gold)</h4>
                      <p className="text-sm text-gray-600 mb-2">5,000 - 9,999 điểm</p>
                      <ul className="text-sm space-y-1">
                        <li>• Tất cả quyền lợi hạng Bạc</li>
                        <li>• Giảm 10% khi mua hàng</li>
                        <li>• Quà tặng đặc biệt cuối năm</li>
                      </ul>
                    </div>
                    <div className={`p-4 border rounded-lg ${currentTier === 'platinum' ? 'ring-2 ring-black bg-gray-50' : 'opacity-60'}`}>
                      <h4 className="font-bold text-lg mb-2 text-indigo-700">Bạch kim (Platinum)</h4>
                      <p className="text-sm text-gray-600 mb-2">10,000+ điểm</p>
                      <ul className="text-sm space-y-1">
                        <li>• Tất cả quyền lợi hạng Vàng</li>
                        <li>• Giảm 15% khi mua hàng</li>
                        <li>• Vé mời sự kiện Nike độc quyền</li>
                        <li>• Hỗ trợ ưu tiên 24/7</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'personal' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">{t.common.profile}</h2>
                    <div className="flex gap-2">
                      {user?.membershipTier && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getTierColor(user.membershipTier)}`}>
                          {user.membershipTier}
                        </span>
                      )}
                      {!!user?.isVerified && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100">
                          <Star className="w-3 h-3 fill-current" />
                          Verified
                        </span>
                      )}
                      {!!user?.is_admin && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t.common.last_name} *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t.common.first_name} *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.common.email} *</label>
                      <input type="email" name="email" value={formData.email} disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 cursor-not-allowed" />
                      <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.common.phone}</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0123456789" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.common.dob}</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.common.gender}</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent">
                        <option value="">{t.common.select_gender}</option>
                        <option value="male">{t.common.male}</option>
                        <option value="female">{t.common.female}</option>
                        <option value="other">{t.common.other}</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {loading ? t.common.loading : t.common.save}
                      </button>
                      <Link href="/" className="flex-1">
                        <button type="button" className="w-full py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors">{t.common.cancel}</button>
                      </Link>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Bảo mật</h2>
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Xác thực 2 bước (2FA)</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Bảo vệ tài khoản của bạn bằng cách yêu cầu mã xác thực gửi qua email mỗi khi đăng nhập.
                      </p>
                      <button
                        onClick={() => {
                          if (!isPasswordModalOpen || pendingAction !== 'toggle2fa') {
                            setPendingAction('toggle2fa');
                            setPasswordValue('');
                            setPasswordError('');
                            setIsPasswordModalOpen(true);
                          }
                        }}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(user as any)?.two_factor_enabled ? 'bg-black' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(user as any)?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                      <span className="ml-3 text-sm font-medium">
                        {(user as any)?.two_factor_enabled ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Đổi mật khẩu</h3>
                      <p className="text-sm text-gray-600 mb-4">Cập nhật mật khẩu của bạn</p>
                      <Link href="/account/change-password"><button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">Đổi mật khẩu</button></Link>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">Thiết bị đang đăng nhập</h3>
                          <p className="text-sm text-gray-600 mt-1">Quản lý tất cả thiết bị đang truy cập tài khoản của bạn.</p>
                        </div>
                        <button onClick={loadSessions} className="text-sm text-gray-500 hover:text-black transition-colors underline">
                          Làm mới
                        </button>
                      </div>

                      {loadingSessions ? (
                        <div className="space-y-3">
                          {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : sessions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-4 text-center">Không có dữ liệu phiên đăng nhập. Đăng nhập lại để ghi nhận thiết bị.</p>
                      ) : (
                        <div className="space-y-3">
                          {sessions.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
                                  {s.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{s.os || 'Unknown OS'}</p>
                                  <p className="text-xs text-gray-500">{s.browser} · IP: {s.ip}</p>
                                  <p className="text-xs text-gray-400">{s.loginAt ? new Date(s.loginAt).toLocaleString('vi-VN') : '-'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => revokeSession(s.id)}
                                disabled={revokingSession === s.id}
                                className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors px-3 py-1 border border-red-200 rounded-full hover:bg-red-50"
                              >
                                {revokingSession === s.id ? '...' : 'Thu hồi'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h3 className="font-medium mb-2 text-red-700">Đăng xuất khỏi tất cả các thiết bị</h3>
                      <p className="text-sm text-red-600 mb-4">
                        Nếu bạn nghi ngờ tài khoản bị xâm nhập hoặc làm mất thiết bị, hãy sử dụng tính năng này để buộc đăng xuất khỏi tất cả các thiết bị đang hoạt động.
                      </p>
                      <button
                        onClick={async () => {
                          setConfirmConfig({
                            title: 'Đăng xuất khỏi tất cả thiết bị',
                            message: 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị? Điều này sẽ yêu cầu bạn đăng nhập lại trên mọi thiết bị hiện đang hoạt động.',
                            confirmText: 'Đăng xuất tất cả',
                            cancelText: 'Hủy',
                            danger: true,
                            onConfirm: async () => {
                              setIsConfirmModalOpen(false);
                              try {
                                setLoading(true);
                                const res = await fetch('/api/auth/logout-all', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                  window.location.href = '/login?message=Thành công đăng xuất khỏi tất cả thiết bị';
                                } else {
                                  setMessage(data.message || 'Lỗi khi đăng xuất');
                                }
                              } catch (e) {
                                console.error(e);
                                setMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
                              } finally {
                                setLoading(false);
                              }
                            }
                          });
                          setIsConfirmModalOpen(true);
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Đang xử lý...' : 'Đăng xuất tất cả thiết bị'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-semibold">{t.common.addresses}</h2>
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
                      + {t.common.add_address}
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="mb-6 p-6 border-2 border-black rounded-lg bg-gray-50">
                      <h3 className="text-xl font-semibold mb-4">
                        {editingAddress ? t.common.edit : t.common.add_address}
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
                            <label className="block text-sm font-medium mb-2">{t.common.first_name} & {t.common.last_name} *</label>
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
                            <label className="block text-sm font-medium mb-2">{t.common.phone} *</label>
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
                          <label className="text-sm font-medium">{t.common.set_default}</label>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 rounded-full font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                              }`}
                          >
                            {loading ? t.common.loading : editingAddress ? t.common.save : t.common.add_address}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                            }}
                            className="flex-1 py-3 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {loadingAddresses ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                      <p className="text-gray-600 mt-4">{t.common.loading}</p>
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
                          className={`p-6 border-2 rounded-lg ${address.is_default ? 'border-black bg-gray-50' : 'border-gray-300'
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
                                  {t.common.default}
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
                              {t.common.edit}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-full hover:bg-red-50 transition-colors"
                            >
                              {t.common.delete}
                            </button>
                            {address.is_default !== 1 && (
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:border-black transition-colors"
                              >
                                {t.common.set_default}
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
                  <h2 className="text-2xl font-semibold mb-6">{t.common.appearance}</h2>
                  <div>
                    <label className="block text-sm font-medium mb-3">{t.common.language}</label>
                    <select
                      value={currentLang}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Cài đặt đơn hàng</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Thông báo trạng thái đơn hàng</h3>
                      <p className="text-sm text-gray-600 mb-3">Nhận thông báo khi đơn hàng của bạn được cập nhật</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm">Bật thông báo email</span>
                      </label>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Quản lý đơn hàng</h3>
                      <p className="text-sm text-gray-600 mb-3">Xem và quản lý tất cả đơn hàng của bạn</p>
                      <Link href="/orders"><button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">Xem đơn hàng</button></Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Wishlist</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Cài đặt Wishlist</h3>
                      <p className="text-sm text-gray-600 mb-3">Quản lý sản phẩm yêu thích của bạn</p>
                      <Link href="/wishlist"><button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">Xem Wishlist</button></Link>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Chia sẻ Wishlist</h3>
                      <p className="text-sm text-gray-600 mb-3">Chia sẻ wishlist với bạn bè hoặc gia đình</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm">Cho phép chia sẻ công khai</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Thông báo</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">Thông báo Email</h3>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Nhận email thông báo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={promoNotifications} onChange={(e) => setPromoNotifications(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Thông báo về khuyến mãi và sản phẩm mới</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={orderNotifications} onChange={(e) => setOrderNotifications(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Thông báo về đơn hàng</span>
                      </label>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">Thông báo SMS</h3>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Nhận tin nhắn SMS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={smsOrderNotifications} onChange={(e) => setSmsOrderNotifications(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Thông báo SMS về đơn hàng</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Thanh toán</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Phương thức thanh toán</h3>
                      <p className="text-sm text-gray-600 mb-4">Quản lý các phương thức thanh toán của bạn</p>
                      <div className="space-y-2">
                        <div
                          onClick={() => alert('Chức năng thêm thẻ tín dụng đang được phát triển.')}
                          className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium">Thẻ tín dụng / Ghi nợ</p>
                              <p className="text-xs text-gray-500">Thêm hoặc quản lý thẻ của bạn</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                        <div
                          onClick={() => alert('Chức năng liên kết ngân hàng đang được phát triển.')}
                          className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium">Chuyển khoản ngân hàng</p>
                              <p className="text-xs text-gray-500">Thanh toán trực tiếp từ tài khoản ngân hàng</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                        <div
                          onClick={() => alert('Chức năng liên kết ví điện tử đang được phát triển.')}
                          className="p-3 border rounded bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium">Ví điện tử</p>
                              <p className="text-xs text-gray-500">Liên kết ví điện tử của bạn</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-600">Sắp ra mắt</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Lịch sử giao dịch</h3>
                      <p className="text-sm text-gray-600 mb-3">Xem lịch sử thanh toán và giao dịch của bạn</p>
                      <Link href="/gift-card-balance">
                        <button className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors">Xem lịch sử</button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Quyền riêng tư</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Dữ liệu cá nhân</h3>
                      <p className="text-sm text-gray-600 mb-3">Tải xuống toàn bộ thông tin cá nhân của bạn (GDPR).</p>
                      <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="px-6 py-2 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Đang chuẩn bị...' : 'Xuất dữ liệu cá nhân (JSON)'}
                      </button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Tùy chọn hiển thị</h3>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={dataPersistence} onChange={(e) => setDataPersistence(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Cho phép sử dụng dữ liệu để cá nhân hóa trải nghiệm</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Tài khoản công khai</span>
                      </label>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">Trợ năng (Accessibility)</h3>
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          defaultChecked={typeof window !== 'undefined' && localStorage.getItem('highContrast') === 'true'}
                          onChange={(e) => {
                            document.documentElement.classList.toggle('high-contrast', e.target.checked);
                            localStorage.setItem('highContrast', String(e.target.checked));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="text-sm font-medium">Chế độ tương phản cao</span>
                          <p className="text-xs text-gray-500">Tăng độ tương phản cho văn bản và viền để dễ đọc hơn</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={typeof window !== 'undefined' && localStorage.getItem('colorBlindFriendly') === 'true'}
                          onChange={(e) => {
                            document.documentElement.classList.toggle('color-blind-friendly', e.target.checked);
                            localStorage.setItem('colorBlindFriendly', String(e.target.checked));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="text-sm font-medium">Chế độ thân thiện người mù màu</span>
                          <p className="text-xs text-gray-500">Điều chỉnh bảng màu phù hợp hơn cho người khó phân biệt Đỏ-Xanh (Deuteranopia)</p>
                        </div>
                      </label>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Xóa tài khoản</h3>
                      <p className="text-sm text-gray-600 mb-3">Xóa vĩnh viễn tài khoản và dữ liệu của bạn</p>
                      <button
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn không? Hành động này không thể hoàn tác.')) {
                            handleDeleteAccount();
                          }
                        }}
                        className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-full font-medium hover:bg-red-50 transition-colors"
                      >
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{confirmConfig.title}</h2>
            <p className="text-gray-600 mb-6 text-sm">
              {confirmConfig.message}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                autoFocus
              >
                {confirmConfig.cancelText}
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`flex-1 py-3 text-white rounded-full font-medium transition-colors ${confirmConfig.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'}`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">
              {pendingAction === 'export' ? 'Xác nhận thông tin' : pendingAction === 'toggle2fa' ? 'Xác thực 2 bước (2FA)' : 'Xác nhận xóa tài khoản'}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Vì lý do bảo mật, vui lòng nhập mật khẩu của bạn để {pendingAction === 'export' ? 'tải xuống dữ liệu cá nhân' : pendingAction === 'toggle2fa' ? 'bật/tắt Xác thực 2 bước' : 'xóa tài khoản vĩnh viễn'}.
            </p>

            <form onSubmit={handleVerifyPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all ${passwordError ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Nhập mật khẩu của bạn"
                  autoFocus
                />
                {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPendingAction(null);
                    setPasswordValue('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={verifyingPassword || !passwordValue}
                  className="flex-1 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {verifyingPassword ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
