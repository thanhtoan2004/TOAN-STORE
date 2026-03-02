'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

/**
 * Kiểu dữ liệu mô tả cấu trúc đầy đủ của một đối tượng User.
 * Bao gồm cả thông tin cá nhân cơ bản và các metadata liên quan đến hạng thành viên, bảo mật.
 */
type User = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
  isVerified?: boolean;
  is_admin?: boolean;
  membershipTier?: string;   // Hạng thẻ (Bạc, Vàng, Kim Cương...)
  accumulatedPoints?: number; // Điểm tích lũy mua hàng
  two_factor_enabled?: boolean; // Tùy chọn 2FA (Xác thực 2 bước) có đang bật hay không
  avatarUrl?: string; // Đường dẫn ảnh đại diện
  email_notifications?: boolean;
  sms_notifications?: boolean;
  sms_order_notifications?: boolean;
  push_notifications?: boolean;
  promo_notifications?: boolean;
  order_notifications?: boolean;
  data_persistence?: boolean;
  public_profile?: boolean;
} | null;

/**
 * Định nghĩa bộ khung (interface) cho Context Xác thực.
 * Đây là tất cả những gì các Component con có thể lấy ra để sử dụng (state và functions).
 */
type AuthContextType = {
  user: User;
  isAuthenticated: boolean; // Biến phái sinh: user != null
  login: (email: string, password: string) => Promise<boolean | { requires2FA: boolean; email: string }>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean; // Trạng thái màn hình loading lúc kiểm tra phiên đăng nhập lần đầu
};

/**
 * Định dạng chuẩn cho Dữ liệu trả về khi Đăng ký
 */
type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
};

// Khởi tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Bao bọc ứng dụng để quản lý trạng thái Đăng Nhập tập trung ở một nơi duy nhất.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Hook chạy 1 lần duy nhất khi ứng dụng tải lên.
   * Dùng để kiểm tra xem cookie/session JWT hiện tại còn hiệu lực hay không.
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Gửi request lên route auth/user để server kiểm tra httpOnly cookie
        const response = await fetch('/api/auth/user', {
          cache: 'no-store', // Không lưu cache để tránh sai lệch thông tin
        });

        if (response.ok) {
          // Token hợp lệ
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401) {
          // Lỗi 401 Unauthorized -> Token hết hạn hoặc không tồn tại
          // Cố gắng tự động nối lại phiên qua route /api/auth/refresh
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            // Refresh thành công, thử lấy thông tin user lại một lần nữa
            const retryRes = await fetch('/api/auth/user', { cache: 'no-store' });
            if (retryRes.ok) {
              const data = await retryRes.json();
              setUser(data.user);
            } else {
              setUser(null);
            }
          } else {
            setUser(null); // Không thể refresh, bắt buộc đăng nhập lại
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra xác thực:', error);
        setUser(null);
      } finally {
        setLoading(false); // Quá trình xác thực ban đầu hoàn tất
      }
    };

    checkAuth();
  }, []);

  /**
   * Hàm xử lý Đăng Nhập
   * @return Promise trả về `true` nếu thẳng tiến vào trong, hoặc Object `require2FA: true` nếu server đòi mã OTP.
   */
  const login = async (email: string, password: string): Promise<boolean | { requires2FA: boolean; email: string }> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Đăng nhập thất bại');
      }

      // Xử lý luồng bảo mật 2 lớp (2FA)
      if (data.requires2FA) {
        // Nếu user có cài 2FA, server không trả JWT ngay mà trả cờ require2FA
        // Frontend sẽ redirect tới form điền OTP dựa trên object trả về này
        return { requires2FA: true, email: data.email };
      }

      // Đăng nhập thường lệ thành công
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hàm xử lý Đăng Ký Tài Khoản
   */
  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      return true;
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hàm xử lý Đăng Xuất
   * Dùng useCallback để tránh render lại mảng phụ thuộc ở các Component con.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  }, []);

  // Tự động đăng xuất sau 15 phút không hoạt động
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 phút

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Session timed out due to inactivity');
        logout();
      }, TIMEOUT_DURATION);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => resetTimer();

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook để sử dụng AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 