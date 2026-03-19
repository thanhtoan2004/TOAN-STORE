'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PaymentQRCode from '@/components/checkout/PaymentQRCode';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils/date-utils';
import { Lock, Gift } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);

  // Gift Wrapping
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftWrapFee, setGiftWrapFee] = useState(25000);

  // Payment State
  const [showQR, setShowQR] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Form Schema
  const checkoutSchema = z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    address: z.string().min(5, 'Địa chỉ quá ngắn'),
    city: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
    district: z.string().min(1, 'Vui lòng nhập Quận/Huyện'),
    ward: z.string().min(1, 'Vui lòng nhập Phường/Xã'),
    paymentMethod: z.enum(['cod', 'bank', 'momo', 'vnpay']),
    note: z.string().optional(),
  });

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
      phone: '',
      email: user?.email || '',
      address: '',
      city: 'TP. Hồ Chí Minh',
      district: '',
      ward: '',
      paymentMethod: 'cod',
      note: '',
    },
  });

  // Watch selected address to conditionally show fields? Or just rely on state?
  // We keep `useNewAddress` state for visibility, but `form` handles data.

  // Load addresses and settings on mount
  useEffect(() => {
    if (user) {
      loadAddresses();
    } else {
      // Clear all data when user logs out
      setAddresses([]);
      setSelectedAddressId(null);
      setVoucherCode('');
      setAppliedVoucher(null);
      setGiftCardNumber('');
      setGiftCardPin('');
      setAppliedGiftCard(null);
      form.reset({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: 'TP. Hồ Chí Minh',
        district: '',
        ward: '',
        paymentMethod: 'cod',
        note: '',
      });
    }
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const res = await response.json();
      if (res.success && res.data) {
        setGiftWrapFee(res.data.gift_wrap_fee || 25000);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/addresses?userId=${user.id}`);
      if (response.ok) {
        const res = await response.json();
        if (res.success && Array.isArray(res.data)) {
          const data = res.data;
          setAddresses(data);

          // Auto-select default address
          const defaultAddress = data.find((addr: any) => addr.is_default === 1);
          if (defaultAddress && data.length > 0) {
            setSelectedAddressId(defaultAddress.id);
            fillFormWithAddress(defaultAddress);
          } else if (data.length > 0) {
            // Select first address if no default
            setSelectedAddressId(data[0].id);
            fillFormWithAddress(data[0]);
          } else {
            // No addresses, use new address form
            setUseNewAddress(true);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải địa chỉ:', error);
    }
  };

  const fillFormWithAddress = (address: any) => {
    // Map existing address fields to form values
    // Handles both camelCase (from backend/drizzle) and snake_case (Legacy/API)
    form.setValue(
      'fullName',
      address.recipientName || address.recipient_name || form.getValues('fullName')
    );
    form.setValue('phone', address.phone || form.getValues('phone'));
    form.setValue('address', address.addressLine || address.address_line || '');
    form.setValue('city', address.city || 'TP. Hồ Chí Minh');
    form.setValue('district', address.state || address.district || '');
    form.setValue('ward', address.postalCode || address.postal_code || '');
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      fillFormWithAddress(address);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Membership Discount & Free Shipping Logic
  const tier = user?.membershipTier?.toLowerCase() || 'bronze';
  let membershipDiscountPercent = 0;
  let isFreeShippingByTier = false;

  if (tier === 'platinum') {
    membershipDiscountPercent = 0.15;
    isFreeShippingByTier = true;
  } else if (tier === 'gold') {
    membershipDiscountPercent = 0.1;
    isFreeShippingByTier = true;
  } else if (tier === 'silver') {
    membershipDiscountPercent = 0.05;
    isFreeShippingByTier = true;
  }

  const membershipDiscountAmount = Math.round(subtotal * membershipDiscountPercent);
  const shippingFee = subtotal >= 500000 || isFreeShippingByTier ? 0 : 30000;

  const tax = Math.round(subtotal * 0.1);
  const voucherDiscount = appliedVoucher?.discountAmount || 0;
  const giftWrapCost = giftWrapping ? giftWrapFee : 0;

  const giftCardDiscount = Math.min(
    appliedGiftCard?.balance || 0,
    subtotal + shippingFee + tax + giftWrapCost - voucherDiscount - membershipDiscountAmount
  );

  const total = Math.max(
    0,
    subtotal +
      shippingFee +
      tax +
      giftWrapCost -
      voucherDiscount -
      membershipDiscountAmount -
      giftCardDiscount
  );

  // handleInputChange removed as react-hook-form handles it

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return toast.error('Vui lòng nhập mã voucher');

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          userId: user?.id || null,
          orderAmount: subtotal + shippingFee + tax,
          items: cartItems.map((item) => ({
            productId: item.productId,
            categoryId: (item as any).categoryId, // Assuming cart items have categoryId
          })),
        }),
      });
      const result = await response.json();

      if (result.success) {
        setAppliedVoucher(result.data);
        toast.success(`Áp dụng mã thành công! Giảm ${formatCurrency(result.data.discountAmount)}`);
      } else {
        toast.error(result.message || 'Mã voucher không hợp lệ');
      }
    } catch (error) {
      toast.error('Lỗi khi kiểm tra voucher');
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardNumber.trim() || !giftCardPin.trim()) {
      return toast.error('Vui lòng nhập đầy đủ số thẻ và mã PIN');
    }

    try {
      const response = await fetch('/api/gift-cards/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber: giftCardNumber, pin: giftCardPin }),
      });
      const result = await response.json();

      if (result.success) {
        setAppliedGiftCard({
          ...result.data,
          cardNumber: giftCardNumber,
        });
        toast.success('Áp dụng thẻ quà tặng thành công!');
      } else {
        toast.error(result.message || 'Thẻ quà tặng không hợp lệ hoặc sai thông tin');
      }
    } catch (error) {
      toast.error('Lỗi khi kiểm tra thẻ quà tặng');
    }
  };

  const getPaymentMethodText = (method: string) =>
    method === 'bank'
      ? 'Chuyển khoản ngân hàng'
      : method === 'momo'
        ? 'Ví MoMo'
        : method === 'vnpay'
          ? 'VNPay (ATM/QR)'
          : 'Thanh toán khi nhận hàng';

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    if (!user) return toast.error('Vui lòng đăng nhập để đặt hàng');
    if (cartItems.length === 0) return toast.error('Giỏ hàng trống');

    try {
      setLoading(true);

      // 1. Create Order FIRST for Bank Transfer to get Order Number for SePay
      if (values.paymentMethod === 'bank' && !isPaid && !createdOrderNumber) {
        const orderData = {
          userId: user.id,
          items: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: values.fullName,
            phone: values.phone,
            address: values.address,
            city: values.city,
            district: values.district,
            ward: values.ward,
          },
          phone: values.phone,
          email: values.email || '',
          paymentMethod: getPaymentMethodText(values.paymentMethod),
          totalAmount: subtotal,
          shippingFee,
          tax,
          discount: voucherDiscount + giftCardDiscount + membershipDiscountAmount,
          membershipDiscount: membershipDiscountAmount,
          voucherCode: appliedVoucher?.code || null,
          voucherDiscount: voucherDiscount,
          giftcardNumber: appliedGiftCard?.cardNumber || null,
          giftcardDiscount: giftCardDiscount,
          notes: values.note,
          paymentStatus: 'pending',
          has_gift_wrapping: giftWrapping,
          gift_wrap_cost: giftWrapFee,
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
        const result = await response.json();

        if (result.success) {
          setCreatedOrderNumber(result.data.orderNumber);
          setShowQR(true);
          setLoading(false);
          return;
        } else {
          toast.error(result.message || 'Lỗi khi tạo đơn hàng');
          setLoading(false);
          return;
        }
      }

      // If already has order number but modal was closed
      if (values.paymentMethod === 'bank' && !isPaid && createdOrderNumber) {
        setShowQR(true);
        setLoading(false);
        return;
      }

      // Determine initial status
      let initialPaymentStatus = 'pending';
      if (values.paymentMethod === 'cod') initialPaymentStatus = 'pending';
      if (values.paymentMethod === 'bank' && isPaid) initialPaymentStatus = 'paid';
      if (values.paymentMethod === 'vnpay' || values.paymentMethod === 'momo')
        initialPaymentStatus = 'pending_payment';

      const orderData = {
        userId: user.id,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: values.fullName,
          phone: values.phone,
          address: values.address,
          city: values.city,
          district: values.district,
          ward: values.ward,
        },
        phone: values.phone,
        email: values.email || '',
        paymentMethod: getPaymentMethodText(values.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount + membershipDiscountAmount,
        membershipDiscount: membershipDiscountAmount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: values.note,
        paymentStatus: initialPaymentStatus,
        has_gift_wrapping: giftWrapping,
        gift_wrap_cost: giftWrapFee,
      };

      // 1. Create Order (if not bank or if bank but already paid)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.message || 'Lỗi khi đặt hàng');
        setLoading(false);
        return;
      }

      const orderId = result.data.orderId;
      const orderNumber = result.data.orderNumber;

      // 2. Clear Cart asynchronously (Fire and Forget) to avoid blocking the redirect
      clearCart().catch(console.error);

      // 3. Handle Payment Redirection
      if (values.paymentMethod === 'vnpay') {
        const paymentRes = await fetch('/api/payment/vnpay/create_url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, amount: total, language: 'vn' }),
        });
        const paymentData = await paymentRes.json();
        if (paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
          return;
        } else {
          toast.error('Lỗi tạo link thanh toán VNPay');
          router.push(`/order-success?orderNumber=${orderNumber}`);
        }
      } else if (values.paymentMethod === 'momo') {
        const paymentRes = await fetch('/api/payment/momo/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, amount: total }),
        });
        const paymentData = await paymentRes.json();
        if (paymentData.payUrl) {
          window.location.href = paymentData.payUrl;
          return;
        } else {
          toast.error('Lỗi tạo link thanh toán Momo');
          router.push(`/order-success?orderNumber=${orderNumber}`);
        }
      } else {
        // COD or Bank Transfer (Manual)
        router.push(`/order-success?orderNumber=${orderNumber}`);
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      toast.error('Lỗi khi đặt hàng. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  // Helper to handle "I have paid" from QR Modal
  const handleQRPaymentConfirmed = () => {
    setIsPaid(true);
    setShowQR(false);

    // After SePay, we can just redirect to success page because the order is already created
    if (createdOrderNumber) {
      clearCart().catch(console.error);
      router.push(`/order-success?orderNumber=${createdOrderNumber}`);
      return;
    }
    // since we can't easily pass the event 'e' here, we construct a fake one or extract submit logic.
    // calls form submit programmatically or just reuse logic
    const values = form.getValues();
    submitOrderAfterPayment(values);
  };

  const submitOrderAfterPayment = async (values: z.infer<typeof checkoutSchema>) => {
    if (!user) return;
    try {
      setLoading(true);
      const orderData = {
        userId: user.id,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: values.fullName,
          phone: values.phone,
          address: values.address,
          city: values.city,
          district: values.district,
          ward: values.ward,
        },
        phone: values.phone,
        email: values.email || '',
        paymentMethod: getPaymentMethodText(values.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount + membershipDiscountAmount,
        membershipDiscount: membershipDiscountAmount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: `${values.note} [Đã thanh toán chuyển khoản]`,
        paymentStatus: 'paid',
        has_gift_wrapping: giftWrapping,
        gift_wrap_cost: giftWrapFee,
      };
      // 3. Create Order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderResult.message || 'Đặt hàng thất bại');
      }

      // 4. Save address if valid and user wants to (logic to be added if needed, currently implicitly saved in order)
      // If we want to save to user_addresses table, we should have a checkbox "Save to address book"
      // For now, we rely on the order saving the address snapshot.
      // IF existing logic was here to save address, REMOVE it or wrap in if (saveAddress) check.

      // Clear cart asynchronously
      clearCart().catch(console.error);
      router.push(`/order-success?orderNumber=${orderResult.data.orderNumber}`);
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      toast.error('Lỗi khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.common.login}</h2>
          <p className="text-gray-600 mb-6">{t.auth.sign_in_title}</p>
          <Link href="/sign-in">
            <Button className="rounded-full">{t.common.login}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.cart.empty}</h2>
          <p className="text-gray-600 mb-6">{t.cart.empty_desc}</p>
          <Link href="/cart">
            <Button className="rounded-full">{t.cart.bag}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="toan-container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t.checkout.title}</h1>
            <Link href="/cart" className="text-blue-600 hover:text-blue-800">
              ← {t.orders.back_home || 'Back to Cart'}
            </Link>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error('Validation Errors:', errors);
            toast.error('Vui lòng kiểm tra và điền đầy đủ thông tin giao hàng');
          })}
          className="toan-container py-8"
          autoComplete="off"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-6">
                  {t.checkout.shipping_address}
                </h2>

                {/* Address Selection */}
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      {t.checkout.delivery_options}
                    </label>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            selectedAddressId === address.id && !useNewAddress
                              ? 'border-black bg-gray-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={selectedAddressId === address.id && !useNewAddress}
                              onChange={() => handleAddressSelect(address.id)}
                              onClick={() => handleAddressSelect(address.id)}
                              className="mt-1 cursor-pointer"
                            />
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleAddressSelect(address.id)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{address.recipient_name}</p>
                                {address.label && (
                                  <span className="px-2 py-0.5 bg-gray-200 text-xs rounded">
                                    {address.label}
                                  </span>
                                )}
                                {address.is_default === 1 && (
                                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                                    {t.common.default}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600">
                                {address.address_line}
                                {address.state && `, ${address.state}`}
                                {address.city && `, ${address.city}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/account/settings?tab=addresses&returnUrl=/checkout');
                              }}
                              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-black transition-colors"
                            >
                              {t.common.edit}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Use New Address Option */}
                      <div
                        onClick={() => setUseNewAddress(true)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          useNewAddress
                            ? 'border-black bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={useNewAddress}
                            onChange={() => setUseNewAddress(true)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold">+ {t.common.add_address}</p>
                            <p className="text-sm text-gray-600">{t.checkout.contact_info}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show form if using new address or no addresses */}
                {(useNewAddress || addresses.length === 0) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ và tên *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nguyễn Văn A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại *</FormLabel>
                            <FormControl>
                              <Input placeholder="0901234567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ *</FormLabel>
                          <FormControl>
                            <Input placeholder="Số nhà, đường..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tỉnh / Thành phố *</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full"
                                {...field}
                              >
                                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Cần Thơ">Cần Thơ</option>
                                <option value="Hải Phòng">Hải Phòng</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quận / Huyện *</FormLabel>
                            <FormControl>
                              <Input placeholder="Quận/Huyện" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phường / Xã *</FormLabel>
                            <FormControl>
                              <Input placeholder="Phường/Xã" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-6">{t.checkout.payment}</h2>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <div className="space-y-3">
                          <div className="space-y-3">
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                {...field}
                                value="cod"
                                checked={field.value === 'cod'}
                                className="mr-3"
                              />
                              <div>
                                <div className="font-medium">{t.checkout.cod}</div>
                                <div className="text-sm text-gray-600">{t.checkout.cod_desc}</div>
                              </div>
                            </label>
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                {...field}
                                value="bank"
                                checked={field.value === 'bank'}
                                className="mr-3"
                              />
                              <div>
                                <div className="font-medium">{t.checkout.bank_transfer}</div>
                                <div className="text-sm text-gray-600">
                                  {t.checkout.bank_transfer_desc}
                                </div>
                              </div>
                            </label>
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                {...field}
                                value="momo"
                                checked={field.value === 'momo'}
                                className="mr-3"
                              />
                              <div>
                                <div className="font-medium">{t.checkout.momo}</div>
                                <div className="text-sm text-gray-600">{t.checkout.momo_desc}</div>
                              </div>
                            </label>
                          </div>
                          <div className="space-y-3 mt-3">
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                {...field}
                                value="vnpay"
                                checked={field.value === 'vnpay'}
                                className="mr-3"
                              />
                              <div>
                                <div className="font-medium">{t.checkout.vnpay} / ATM / QR</div>
                                <div className="text-sm text-gray-600">{t.checkout.vnpay_desc}</div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-4">{t.checkout.order_note}</h2>
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder={t.checkout.note_placeholder}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gift Wrapping Option */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-4">{t.checkout.gift_wrap}</h2>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrapping}
                    onChange={(e) => setGiftWrapping(e.target.checked)}
                    className="mt-1 w-4 h-4"
                  />
                  <div>
                    <span className="font-medium flex items-center gap-2">
                      {t.checkout.gift_wrap_title} <Gift className="w-4 h-4 text-rose-500" />
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{t.checkout.gift_wrap_desc}</p>
                    <p className="text-sm font-medium text-black mt-1">
                      + {formatCurrency(giftWrapFee)}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                <h2 className="text-xl font-helvetica-medium mb-6">{t.checkout.order_summary}</h2>

                {/* Voucher Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">{t.footer.vouchers}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder={t.checkout.voucher_placeholder}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="bg-black text-white hover:bg-gray-800"
                      size="sm"
                    >
                      {t.cart.apply || 'Áp dụng'}
                    </Button>
                  </div>
                  {appliedVoucher && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      <div className="flex justify-between items-center mb-1 font-semibold">
                        <span>✓ {appliedVoucher.code}</span>
                        <span>-{formatCurrency(appliedVoucher.discountAmount)}</span>
                      </div>
                      <p className="opacity-90">{appliedVoucher.description}</p>
                      {appliedVoucher.expirationDate && (
                        <p className="text-[10px] uppercase mt-1 opacity-75">
                          Hạn dùng: {formatDate(appliedVoucher.expirationDate)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-4 pb-4 border-b">
                  <label className="block text-sm font-medium mb-2">{t.checkout.gift_card}</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={giftCardNumber}
                      onChange={(e) => setGiftCardNumber(e.target.value)}
                      placeholder={t.checkout.gift_card_number}
                      maxLength={16}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardPin}
                        onChange={(e) => setGiftCardPin(e.target.value)}
                        placeholder={t.checkout.gift_card_pin}
                        maxLength={4}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyGiftCard}
                        className="bg-black text-white hover:bg-gray-800"
                        size="sm"
                      >
                        {t.cart.apply || 'Áp dụng'}
                      </Button>
                    </div>
                    {appliedGiftCard && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                        <div className="flex justify-between items-center mb-1 font-semibold">
                          <span>
                            ✓ Gift Card ({appliedGiftCard.cardNumber.slice(-4).padStart(16, '*')})
                          </span>
                          <span>-{formatCurrency(giftCardDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-xs opacity-90">
                          <span>Số dư còn lại:</span>
                          <span>{formatCurrency(appliedGiftCard.balance)}</span>
                        </div>
                        {appliedGiftCard.expiresAt && (
                          <p className="text-[10px] uppercase mt-1 opacity-75">
                            Hạn dùng: {formatDate(appliedGiftCard.expiresAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>{t.cart.subtotal}:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.checkout.shipping_fee}:</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-600">{t.checkout.free}</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.cart.tax}:</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t.footer.vouchers}:</span>
                      <span>-{formatCurrency(voucherDiscount)}</span>
                    </div>
                  )}
                  {membershipDiscountAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span className="flex items-center gap-1">
                        Chiết khấu {tier.charAt(0).toUpperCase() + tier.slice(1)}:
                      </span>
                      <span>-{formatCurrency(membershipDiscountAmount)}</span>
                    </div>
                  )}
                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Thẻ quà tặng:</span>
                      <span>-{formatCurrency(giftCardDiscount)}</span>
                    </div>
                  )}
                  {giftWrapping && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-rose-500" />
                        Gói quà tặng:
                      </span>
                      <span>+{formatCurrency(giftWrapFee)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-helvetica-medium text-lg">
                    <span>{t.cart.total}:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full mt-6 rounded-full font-medium transition-colors"
                >
                  {loading
                    ? t.checkout.processing
                    : `${t.checkout.place_order} • ${formatCurrency(total)}`}
                </Button>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600">
                    <Lock className="w-4 h-4 mr-2" />
                    {t.common.security || 'Secure Transaction'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{t.checkout.payment}</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            <PaymentQRCode
              amount={total}
              description={
                createdOrderNumber ? `${createdOrderNumber}` : `Thanh toan don hang ${user?.email}`
              }
            />
            <div className="mt-4 space-y-2">
              <Button
                onClick={handleQRPaymentConfirmed}
                disabled={loading}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {loading ? t.checkout.processing : 'Tôi đã chuyển khoản'}
              </Button>
              <Button
                onClick={() => setShowQR(false)}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                Thanh toán sau (COD)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
