'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: number, quantity?: number, size?: string, color?: string) => Promise<boolean>;
  addMultipleToCart: (items: { productId: number; quantity: number; size: string }[]) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<boolean>;
  removeItem: (itemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  // Computed values
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/cart?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setCartItems(data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch cart items khi user đăng nhập
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user, refreshCart]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = useCallback(async (
    productId: number,
    quantity = 1,
    size?: string,
    color?: string
  ): Promise<boolean> => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return false;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity,
          size,
          color
        }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshCart(); // Refresh để lấy dữ liệu mới nhất
        return true;
      } else {
        alert(data.message || 'Lỗi khi thêm vào giỏ hàng');
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert('Lỗi khi thêm vào giỏ hàng');
      return false;
    }
  }, [user, refreshCart]);

  // Thêm nhiều sản phẩm vào giỏ hàng (cho Reorder)
  const addMultipleToCart = useCallback(async (
    items: { productId: number; quantity: number; size: string }[]
  ): Promise<boolean> => {
    if (!user) {
      alert('Vui lòng đăng nhập để thực hiện');
      return false;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, items }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshCart();
        return true;
      } else {
        alert(data.message || 'Lỗi khi đặt lại đơn hàng');
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi thêm hàng loạt vào giỏ hàng:', error);
      return false;
    }
  }, [user, refreshCart]);

  // Cập nhật số lượng
  const updateQuantity = useCallback(async (itemId: number, quantity: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (data.success) {
        setCartItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        );
        return true;
      } else {
        alert(data.message || 'Lỗi khi cập nhật số lượng');
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      alert('Lỗi khi cập nhật số lượng');
      return false;
    }
  }, []);

  // Xóa sản phẩm
  const removeItem = useCallback(async (itemId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        return true;
      } else {
        alert(data.message || 'Lỗi khi xóa sản phẩm');
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      alert('Lỗi khi xóa sản phẩm');
      return false;
    }
  }, []);

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/cart?userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCartItems([]);
        return true;
      } else {
        alert(data.message || 'Lỗi khi xóa giỏ hàng');
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
      alert('Lỗi khi xóa giỏ hàng');
      return false;
    }
  }, [user]);

  const value: CartContextType = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    addMultipleToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook để sử dụng Cart Context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
