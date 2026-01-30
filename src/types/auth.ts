// Authentication-related types
export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_admin?: boolean;
  is_banned?: number | string | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
  isVerified?: boolean;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserWithoutPassword;
  error?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Order-related types
export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}
