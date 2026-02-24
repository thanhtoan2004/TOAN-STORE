'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

/**
 * Interface định nghĩa cấu trúc dữ liệu của 1 sản phẩm trong Giỏ hàng
 */
interface CartItem {
  id: number;           // ID của bản ghi trong bảng `cart_items` ở Database
  productId: number;    // ID của sản phẩm gốc
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;     // Số lượng người dùng đã chọn
  stock: number;        // Tồn kho tối đa cho phép
}

/**
 * Interface định nghĩa các hàm và biến mà CartContext sẽ cung cấp ra ngoài
 */
interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;      // Tổng số lượng sản phẩm (Tính tổng quantity của tất cả item)
  loading: boolean;       // Trạng thái đang tải API
  addToCart: (productId: number, quantity?: number, size?: string, color?: string) => Promise<boolean>;
  addMultipleToCart: (items: { productId: number; quantity: number; size: string }[]) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<boolean>;
  removeItem: (itemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

// Khởi tạo Context
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * CartProvider Component
 * Bọc bên ngoài ứng dụng để cung cấp trạng thái Giỏ Hàng toàn cục.
 * Mọi thay đổi trong provider này sẽ tự động cập nhật lên UI (ví dụ icon giỏ hàng trên Header).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Lấy thông tin user hiện tại để gán giỏ hàng cho đúng người

  // Computed value: Tính tổng số lượng hàng có trong giỏ
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * Gọi API để lấy dữ liệu giỏ hàng mới nhất từ Database
   */
  const refreshCart = useCallback(async () => {
    if (!user) return; // Nếu khách chưa đăng nhập thì không tải giỏ hàng từ CSDL

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

  /**
   * Tự động Fetch cart items mỗi khi có sự thay đổi về user log in/out
   */
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]); // Reset giỏ hàng nếu user đăng xuất
    }
  }, [user, refreshCart]);

  /**
   * Thêm 1 sản phẩm vào giỏ hàng
   */
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
        await refreshCart(); // Gọi DB lấy cục data mới sau khi Add thành công
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

  /**
   * Thêm nhiều sản phẩm cùng lúc (Dùng cho tính năng Re-order / Mua lại giỏ hàng cũ)
   */
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

  /**
   * Cập nhật số lượng của 1 sản phẩm đang có trong giỏ (Dùng khi user bấm nút +/- trong trang Cart)
   */
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
        // Tối ưu UI: Cập nhật biến state thủ công trên client trước mà không cần chờ refreshCart()
        // Giúp giao diện phản hồi tức thì
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

  /**
   * Xóa 1 sản phẩm khỏi giỏ hàng
   */
  const removeItem = useCallback(async (itemId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Lọc bỏ item đã xóa khỏi state hiện tại
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

  /**
   * Làm trống toàn bộ giỏ hàng (Thường dùng sau khi thanh toán thành công)
   */
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

  // Đóng gói các hàm và biến có thể công khai ra ngoài
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

/**
 * Custom Hook: useCart()
 * Dùng hook này ở bất kỳ Component con nào để dễ dàng lấy ra API của giỏ hàng thay vì dùng useContext() trần.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

