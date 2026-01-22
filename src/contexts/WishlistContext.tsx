"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sale_price?: number;
  image_url: string;
  is_new_arrival?: boolean;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isInWishlist: (id: string) => boolean;
}

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

  // Load wishlist from database when user logs in
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          const response = await fetch(`/api/wishlist?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setWishlist(data);
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
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
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
        if (!wishlist.find((i) => i.id === item.id)) {
          setWishlist((prev) => [...prev, item]);
        }
      } else {
        throw new Error('Không thể thêm vào wishlist');
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào wishlist:', error);
      alert('Có lỗi xảy ra khi thêm vào yêu thích');
    }
  };

  const removeFromWishlist = async (id: string) => {
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
          setWishlist(data); // API trả về array trực tiếp
        }
      } else {
        throw new Error('Không thể xóa khỏi wishlist');
      }
    } catch (error) {
      console.error('Lỗi khi xóa khỏi wishlist:', error);
      alert('Có lỗi xảy ra khi xóa khỏi yêu thích');
    }
  };

  const isInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
