"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { useRouter } from 'next/navigation';

/**
 * WishlistItem: Đại diện cho 1 sản phẩm mà người dùng đã bấm thả tim (Yêu thích).
 */
export interface WishlistItem {
  id: string | number;
  name: string;
  category: string;
  price: number;
  sale_price?: number;
  image_url: string;
  slug?: string;
  is_new_arrival?: boolean;
}

/**
 * WishlistContextType: Các hàm và state được bộc lộ ra cho các Component con sử dụng.
 */
interface WishlistContextType {
  wishlist: WishlistItem[];                                     // Danh sách sản phẩm thả tim
  loading: boolean;                                             // Trạng thái đang tải từ API
  addToWishlist: (item: WishlistItem) => Promise<void>;         // Hàm thêm mới (gửi API POST)
  removeFromWishlist: (id: string | number) => Promise<void>;   // Hàm xóa bỏ (gửi API DELETE)
  isInWishlist: (id: string | number) => boolean;               // Kiểm tra sản phẩm đã nằm trong Wishlist chưa (đổi màu trái tim)
}

// Khởi tạo Context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { showAlert } = useModal();
  const router = useRouter();

  // Helper to map and sanitize wishlist data
  const mapWishlistData = (data: any[]): WishlistItem[] => {
    return data.map((item: any) => {
      const basePrice = Number(item.price);
      const retailPrice = item.sale_price ? Number(item.sale_price) : 0;

      if (retailPrice && retailPrice > basePrice) {
        return {
          ...item,
          price: retailPrice,      // Original Price (Crossed out)
          sale_price: basePrice    // Selling Price (Red)
        };
      }

      return {
        ...item,
        price: basePrice,
        sale_price: undefined
      };
    });
  };

  // Load wishlist from database when user logs in
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          const response = await fetch(`/api/wishlist?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setWishlist(mapWishlistData(data));
          }
        } catch (error) {
          console.error('Lỗi khi tải wishlist:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear wishlist when not authenticated
        setWishlist([]);
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, user]);

  const addToWishlist = async (item: WishlistItem) => {
    if (!isAuthenticated || !user) {
      showAlert({
        title: 'Xác nhận thông tin',
        message: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích của bạn.',
        type: 'auth',
        onConfirm: () => router.push('/sign-in')
      });
      return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: item.id })
      });

      if (response.ok) {
        // Add to local state
        // Ensure strictly comparable via String()
        if (!wishlist.find((i) => String(i.id) === String(item.id))) {
          setWishlist((prev) => [...prev, item]);
        }
      } else {
        throw new Error('Không thể thêm vào wishlist');
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào wishlist:', error);
      showAlert({
        title: 'Thông báo',
        message: 'Có lỗi xảy ra khi thêm vào yêu thích. Vui lòng thử lại sau.',
        type: 'error'
      });
    }
  };

  const removeFromWishlist = async (id: string | number) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await fetch(`/api/wishlist?userId=${user.id}&productId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Fetch lại từ database để đảm bảo đồng bộ
        const fetchResponse = await fetch(`/api/wishlist?userId=${user.id}`);
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          setWishlist(mapWishlistData(data));
        }
      } else {
        throw new Error('Không thể xóa khỏi wishlist');
      }
    } catch (error) {
      console.error('Lỗi khi xóa khỏi wishlist:', error);
      showAlert({
        title: 'Thông báo',
        message: 'Có lỗi xảy ra khi xóa khỏi yêu thích. Vui lòng thử lại sau.',
        type: 'error'
      });
    }
  };

  const isInWishlist = (id: string | number) => wishlist.some((item) => String(item.id) === String(id));

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
