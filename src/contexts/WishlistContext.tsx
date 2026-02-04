"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string | number;
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
  removeFromWishlist: (id: string | number) => Promise<void>;
  isInWishlist: (id: string | number) => boolean;
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
            // Ensure numbers for prices as MySQL driver might return strings for DECIMAL
            const typedData = data.map((item: any) => {
              const basePrice = Number(item.price); // DB returns base_price as 'price'
              const retailPrice = item.sale_price ? Number(item.sale_price) : 0; // DB returns retail_price as 'sale_price'

              // Logic: ProductCard expects price = Original(MSRP) and sale_price = Discounted(Base)
              // If retailPrice > basePrice (MSRP > Selling), then we have a discount.

              if (retailPrice && retailPrice > basePrice) {
                return {
                  ...item,
                  price: retailPrice,      // Original Price (Crossed out)
                  sale_price: basePrice    // Selling Price (Red)
                };
              }

              // No discount or invalid data, just show selling price as standard price
              return {
                ...item,
                price: basePrice,
                sale_price: undefined
              };
            });
            setWishlist(typedData);
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
        // Ensure strictly comparable via String()
        if (!wishlist.find((i) => String(i.id) === String(item.id))) {
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

  const isInWishlist = (id: string | number) => wishlist.some((item) => String(item.id) === String(id));

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
