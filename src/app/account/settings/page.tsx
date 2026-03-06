'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Lock,
  MapPin,
  Package,
  Heart,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Star,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamic imports for tab components
const MembershipTab = dynamic(() => import('@/components/account/settings/MembershipTab'), {
  ssr: false,
});
const PersonalInfoTab = dynamic(() => import('@/components/account/settings/PersonalInfoTab'), {
  ssr: false,
});
const SecurityTab = dynamic(() => import('@/components/account/settings/SecurityTab'), {
  ssr: false,
});
const AddressesTab = dynamic(() => import('@/components/account/settings/AddressesTab'), {
  ssr: false,
});
const OrdersTab = dynamic(() => import('@/components/account/settings/OrdersTab'), { ssr: false });
const WishlistTab = dynamic(() => import('@/components/account/settings/WishlistTab'), {
  ssr: false,
});
const NotificationsTab = dynamic(() => import('@/components/account/settings/NotificationsTab'), {
  ssr: false,
});
const PaymentTab = dynamic(() => import('@/components/account/settings/PaymentTab'), {
  ssr: false,
});
const PrivacyTab = dynamic(() => import('@/components/account/settings/PrivacyTab'), {
  ssr: false,
});
const AppearanceTab = dynamic(() => import('@/components/account/settings/AppearanceTab'), {
  ssr: false,
});

export default function AccountSettings() {
  const { t, language: currentLang, setLanguage } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showAlert } = useModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Sensitive action states (used by SecurityTab and PrivacyTab)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [pendingAction, setPendingAction] = useState<'export' | 'delete' | 'toggle2fa' | null>(
    null
  );
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // General Confirmation Modal state (used by SecurityTab and AddressesTab)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    danger: false,
    onConfirm: () => {},
  });

  // States for PersonalInfoTab
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: '',
  });

  // States for NotificationsTab
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [smsOrderNotifications, setSmsOrderNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  // States for PrivacyTab
  const [dataPersistence, setDataPersistence] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // States for SecurityTab
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // States for AddressesTab
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
    is_default: false,
  });

  // 1. Hook kiểm tra Auth & URL Params (chạy 1 lần trên client mount và khi auth thay đổi)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        avatarUrl: '',
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
      setFormData((prev) => {
        // Tránh reset nếu user đang gõ (chỉ cập nhật nếu form đang rỗng hoặc được tải lại sau khi save)
        return {
          firstName: user.firstName || prev.firstName || '',
          lastName: user.lastName || prev.lastName || '',
          email: user.email || prev.email || '',
          phone: user.phone || prev.phone || '',
          dateOfBirth: formatDateForInput(user.dateOfBirth) || prev.dateOfBirth || '',
          gender: user.gender || prev.gender || '',
          avatarUrl: (user as any).avatar_url || (user as any).avatarUrl || prev.avatarUrl || '',
        };
      });

      // Initialize settings from user object
      if (user.email_notifications !== undefined) setEmailNotifications(user.email_notifications);
      if (user.promo_notifications !== undefined) setPromoNotifications(user.promo_notifications);
      if (user.order_notifications !== undefined) setOrderNotifications(user.order_notifications);
      if (user.push_notifications !== undefined) setPushNotifications(user.push_notifications);
      if (user.sms_notifications !== undefined) setSmsNotifications(user.sms_notifications);
      if (user.sms_order_notifications !== undefined)
        setSmsOrderNotifications(user.sms_order_notifications);
      if (user.data_persistence !== undefined) setDataPersistence(user.data_persistence);
      if (user.public_profile !== undefined) setPublicProfile(user.public_profile);
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
      message:
        sessionId === 'all'
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
              setSessions((prev) => prev.filter((s: any) => s.id !== sessionId));
            }
          }
        } catch (e) {
          console.error('Revoke session error:', e);
        } finally {
          setRevokingSession(null);
        }
      },
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const url = editingAddress ? '/api/addresses' : '/api/addresses';

      const method = editingAddress ? 'PUT' : 'POST';

      const body = editingAddress
        ? { userId: user.id, addressId: editingAddress.id, ...addressForm }
        : { userId: user.id, ...addressForm };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          is_default: false,
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
    if (!user) return;

    showAlert({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/addresses?userId=${user.id}&addressId=${addressId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setMessage('Xóa địa chỉ thành công!');
            loadAddresses();
            setTimeout(() => setMessage(''), 3000);
          }
        } catch (error) {
          setMessage('Không thể xóa địa chỉ');
        }
      },
    });
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
          action: 'setDefault',
        }),
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
      is_default: address.is_default === 1,
    });
    setShowAddressForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        body: JSON.stringify(formData),
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

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/account/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          avatarUrl: formData.avatarUrl,
          email_notifications: emailNotifications,
          promo_notifications: promoNotifications,
          order_notifications: orderNotifications,
          sms_notifications: smsNotifications,
          sms_order_notifications: smsOrderNotifications,
          push_notifications: pushNotifications,
          data_persistence: dataPersistence,
          public_profile: publicProfile,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Đã lưu thay đổi cài đặt');
        setMessage('Cập nhật cài đặt thành công!');
        setTimeout(() => {
          setMessage('');
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.message || 'Lỗi khi lưu cài đặt');
      }
    } catch (error) {
      toast.error('Không thể kết nối đến server');
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
        a.download = `toan_personal_data_${user?.id}.json`;
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
        showAlert({
          title: 'Thành công',
          message:
            'Tài khoản của bạn đã được xóa thành công. Bạn sẽ được chuyển hướng về trang chủ.',
          type: 'success',
          onConfirm: () => (window.location.href = '/'),
        });
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
        body: JSON.stringify({ password: passwordValue }),
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
          password: passwordValue,
        }),
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
    { id: 'appearance', label: t.common.appearance, icon: 'palette' },
  ];

  // Helper function to calculate progress (for MembershipTab)
  const getMembershipProgress = (points: number, tier: string) => {
    if (tier === 'platinum') return 100;
    if (tier === 'gold')
      return Math.max(0, Math.min(100, ((points - 5000) / (10000 - 5000)) * 100));
    if (tier === 'silver')
      return Math.max(0, Math.min(100, ((points - 1000) / (5000 - 1000)) * 100));
    return Math.max(0, Math.min(100, (points / 1000) * 100));
  };

  const getNextTierPoints = (tier: string) => {
    if (tier === 'platinum') return 0;
    if (tier === 'gold') return 10000;
    if (tier === 'silver') return 5000;
    return 1000;
  };

  const currentAvailablePoints = (user as any)?.availablePoints || 0;
  const currentLifetimePoints = (user as any)?.lifetimePoints || 0;
  const currentTier = (user as any)?.membershipTier || 'bronze';
  const progress = getMembershipProgress(currentLifetimePoints, currentTier);
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
                    star: Star,
                    user: User,
                    lock: Lock,
                    'map-pin': MapPin,
                    package: Package,
                    heart: Heart,
                    bell: Bell,
                    'credit-card': CreditCard,
                    shield: Shield,
                    palette: Palette,
                    ticket: Ticket,
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
                <div
                  className={`mb-6 p-4 rounded-lg ${message.includes('thành công') || message.includes('tải xuống') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
                >
                  {message}
                </div>
              )}

              {activeTab === 'membership' && (
                <MembershipTab
                  currentTier={currentTier}
                  currentAvailablePoints={currentAvailablePoints}
                  currentLifetimePoints={currentLifetimePoints}
                  progress={progress}
                  nextCheckpoint={nextCheckpoint}
                />
              )}

              {activeTab === 'personal' && (
                <PersonalInfoTab
                  user={user}
                  formData={formData}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  setFormData={setFormData}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  t={t}
                />
              )}

              {activeTab === 'security' && (
                <SecurityTab
                  user={user}
                  loading={loading}
                  sessions={sessions}
                  loadingSessions={loadingSessions}
                  revokingSession={revokingSession}
                  loadSessions={loadSessions}
                  revokeSession={revokeSession}
                  setConfirmConfig={setConfirmConfig}
                  setIsConfirmModalOpen={setIsConfirmModalOpen}
                  setPendingAction={setPendingAction}
                  setPasswordValue={setPasswordValue}
                  setPasswordError={setPasswordError}
                  setIsPasswordModalOpen={setIsPasswordModalOpen}
                  setMessage={setMessage}
                  setLoading={setLoading}
                />
              )}

              {activeTab === 'addresses' && (
                <AddressesTab
                  user={user}
                  t={t}
                  returnUrl={returnUrl}
                  showAddressForm={showAddressForm}
                  setShowAddressForm={setShowAddressForm}
                  editingAddress={editingAddress}
                  setEditingAddress={setEditingAddress}
                  addressForm={addressForm}
                  setAddressForm={setAddressForm}
                  handleAddressFormChange={handleAddressFormChange}
                  handleAddressSubmit={handleAddressSubmit}
                  handleDeleteAddress={handleDeleteAddress}
                  handleSetDefaultAddress={handleSetDefaultAddress}
                  handleEditAddress={handleEditAddress}
                  loading={loading}
                  loadingAddresses={loadingAddresses}
                  addresses={addresses}
                />
              )}

              {activeTab === 'orders' && <OrdersTab />}

              {activeTab === 'wishlist' && <WishlistTab />}

              {activeTab === 'notifications' && (
                <NotificationsTab
                  emailNotifications={emailNotifications}
                  setEmailNotifications={setEmailNotifications}
                  promoNotifications={promoNotifications}
                  setPromoNotifications={setPromoNotifications}
                  orderNotifications={orderNotifications}
                  setOrderNotifications={setOrderNotifications}
                  smsNotifications={smsNotifications}
                  setSmsNotifications={setSmsNotifications}
                  smsOrderNotifications={smsOrderNotifications}
                  setSmsOrderNotifications={setSmsOrderNotifications}
                  pushNotifications={pushNotifications}
                  setPushNotifications={setPushNotifications}
                  onSave={handleSaveSettings}
                  loading={loading}
                />
              )}

              {activeTab === 'payment' && <PaymentTab />}

              {activeTab === 'privacy' && (
                <PrivacyTab
                  handleExportData={handleExportData}
                  handleDeleteAccount={handleDeleteAccount}
                  loading={loading}
                  dataPersistence={dataPersistence}
                  setDataPersistence={setDataPersistence}
                  publicProfile={publicProfile}
                  setPublicProfile={setPublicProfile}
                  showAlert={showAlert}
                  onSave={handleSaveSettings}
                />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab
                  currentLang={currentLang as string}
                  setLanguage={setLanguage as any}
                  t={t}
                />
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
            <p className="text-gray-600 mb-6 text-sm">{confirmConfig.message}</p>

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
              {pendingAction === 'export'
                ? 'Xác nhận thông tin'
                : pendingAction === 'toggle2fa'
                  ? 'Xác thực 2 bước (2FA)'
                  : 'Xác nhận xóa tài khoản'}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Vì lý do bảo mật, vui lòng nhập mật khẩu của bạn để{' '}
              {pendingAction === 'export'
                ? 'tải xuống dữ liệu cá nhân'
                : pendingAction === 'toggle2fa'
                  ? 'bật/tắt Xác thực 2 bước'
                  : 'xóa tài khoản vĩnh viễn'}
              .
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
