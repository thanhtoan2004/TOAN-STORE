// Authentication-related types
export interface User {
  id: number;
  email: string;
  email_hash?: string;
  email_encrypted?: string | null;
  is_encrypted?: number | boolean;
  password: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: number | string | boolean;
  is_verified?: number | string | boolean;
  is_banned?: number | string | boolean;
  failed_login_attempts: number;
  lockout_until?: string | null;
  availablePoints?: number;
  lifetimePoints?: number;
  membershipTier?: string;
  token_version: number;
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
  availablePoints?: number;
  lifetimePoints?: number;
  membershipTier?: string;
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
  unit_price?: number;
  total_price?: number;
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
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  totalDiscount?: number;
  voucherDiscount?: number;
  giftcardDiscount?: number;
  giftWrapCost?: number;
  status: string;
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
