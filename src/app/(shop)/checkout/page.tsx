'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import PaymentQRCode from '@/components/checkout/PaymentQRCode';
import { Button } from "@/components/ui/Button";
import { Lock } from 'lucide-react';
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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

  // Payment State
  const [showQR, setShowQR] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Form Schema
  const checkoutSchema = z.object({
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
    address: z.string().min(5, "Địa chỉ quá ngắn"),
    city: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    district: z.string().min(1, "Vui lòng nhập Quận/Huyện"),
    ward: z.string().min(1, "Vui lòng nhập Phường/Xã"),
    paymentMethod: z.enum(["cod", "bank", "momo"]),
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
      note: ''
    },
  });

  // Watch selected address to conditionally show fields? Or just rely on state?
  // We keep `useNewAddress` state for visibility, but `form` handles data.

  // Load addresses on mount
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
        note: ''
      });
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/addresses?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
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
    } catch (error) {
      console.error('Lỗi khi tải địa chỉ:', error);
    }
  };

  const fillFormWithAddress = (address: any) => {
    form.setValue('fullName', address.recipient_name || form.getValues('fullName'));
    form.setValue('phone', address.phone || form.getValues('phone'));
    form.setValue('address', address.address_line || '');
    form.setValue('city', address.city || 'TP. Hồ Chí Minh');
    form.setValue('district', address.state || '');
    form.setValue('ward', address.postal_code || '');
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      fillFormWithAddress(address);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 1000000 ? 0 : 30000;
  const tax = Math.round(subtotal * 0.1);
  const voucherDiscount = appliedVoucher?.discountAmount || 0;
  const giftCardDiscount = Math.min(appliedGiftCard?.balance || 0, subtotal + shippingFee + tax - voucherDiscount);
  const total = Math.max(0, subtotal + shippingFee + tax - voucherDiscount - giftCardDiscount);

  // handleInputChange removed as react-hook-form handles it


  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return alert('Vui lòng nhập mã voucher');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          userId: user?.id || null,
          orderAmount: subtotal + shippingFee + tax
        })
      });
      const result = await response.json();

      if (result.success) {
        setAppliedVoucher(result.data);
        alert(`Áp dụng mã thành công! Giảm ${result.data.discountAmount.toLocaleString('vi-VN')}₫`);
      } else {
        alert(result.message || 'Mã voucher không hợp lệ');
      }
    } catch (error) {
      alert('Lỗi khi kiểm tra voucher');
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardNumber.trim() || !giftCardPin.trim()) {
      return alert('Vui lòng nhập đầy đủ số thẻ và mã PIN');
    }

    try {
      const response = await fetch('/api/giftcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber: giftCardNumber, pin: giftCardPin })
      });
      const result = await response.json();

      if (result.success) {
        setAppliedGiftCard({
          ...result.data,
          cardNumber: giftCardNumber
        });
        alert('Áp dụng thẻ quà tặng thành công!');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Lỗi khi kiểm tra thẻ quà tặng');
    }
  };

  const getPaymentMethodText = (method: string) => method === 'bank' ? 'Chuyển khoản ngân hàng' : method === 'momo' ? 'Ví MoMo' : 'Thanh toán khi nhận hàng';

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    if (!user) return alert('Vui lòng đăng nhập để đặt hàng');
    if (cartItems.length === 0) return alert('Giỏ hàng trống');

    // Payment Logic
    if (values.paymentMethod === 'bank' && !isPaid) {
      setShowQR(true);
      return;
    }

    if (values.paymentMethod === 'momo' && !isPaid) {
      const confirm = window.confirm('Chuyển hướng đến ví MoMo... (Mock)\n\nNhấn OK để thanh toán thành công, Cancel để hủy.');
      if (confirm) {
        setIsPaid(true);
        // We will call handleSubmit again in next tick or imply continuance
        // But for simplicity in this flow, we'll set isPaid and then user clicks Submit again? 
        // Better: Just proceed with API call now with is_paid=true flag
      } else {
        return;
      }
    }

    // Determine payment status based on method and isPaid flag
    // For MoMo mock, if confirmed, it's paid.
    // For Bank, if coming from QR modal "I have paid", it's marked paid or pending verification.
    const finalPaymentStatus = (values.paymentMethod === 'momo' && !isPaid) ? 'paid' : (isPaid ? 'paid' : 'pending');

    try {
      setLoading(true);
      const orderData = {
        userId: user.id,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: values.fullName,
          phone: values.phone,
          address: values.address,
          city: values.city,
          district: values.district,
          ward: values.ward
        },
        phone: values.phone,
        email: values.email || '',
        paymentMethod: getPaymentMethodText(values.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: isPaid ? `${values.note} [Đã thanh toán Online/CK]` : values.note,
        paymentStatus: finalPaymentStatus
      };

      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      const result = await response.json();
      if (result.success) {
        await clearCart();
        router.push(`/order-success?orderNumber=${result.data.orderNumber}`);
      } else {
        alert(result.message || 'Lỗi khi đặt hàng');
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      alert('Lỗi khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle "I have paid" from QR Modal
  const handleQRPaymentConfirmed = () => {
    setIsPaid(true);
    setShowQR(false);

    // Trigger submission
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
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: values.fullName,
          phone: values.phone,
          address: values.address,
          city: values.city,
          district: values.district,
          ward: values.ward
        },
        phone: values.phone,
        email: values.email || '',
        paymentMethod: getPaymentMethodText(values.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: `${values.note} [Đã thanh toán chuyển khoản]`,
        paymentStatus: 'paid'
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

      // ... existing success handling ...
      clearCart();
      router.push(`/order-success?orderId=${orderResult.data.orderNumber}`);
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      alert('Lỗi khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.common.login}</h2>
          <p className="text-gray-600 mb-6">{t.auth.sign_in_title}</p>
          <p className="text-gray-600 mb-6">{t.auth.sign_in_title}</p>
          <Link href="/sign-in"><Button className="rounded-full">{t.common.login}</Button></Link>
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
          <Link href="/cart"><Button className="rounded-full">{t.cart.bag}</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="nike-container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t.checkout.title}</h1>
            <Link href="/cart" className="text-blue-600 hover:text-blue-800">← {t.orders.back_home || 'Back to Cart'}</Link>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="nike-container py-8" autoComplete="off">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-6">{t.checkout.shipping_address}</h2>

                {/* Address Selection */}
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">{t.checkout.delivery_options}</label>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border-2 rounded-lg transition-colors ${selectedAddressId === address.id && !useNewAddress
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
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${useNewAddress
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
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" {...field} value="cod" checked={field.value === 'cod'} className="mr-3" />
                            <div>
                              <div className="font-medium">{t.checkout.cod}</div>
                              <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận được hàng</div>
                            </div>
                          </label>
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" {...field} value="bank" checked={field.value === 'bank'} className="mr-3" />
                            <div>
                              <div className="font-medium">{t.checkout.bank_transfer}</div>
                              <div className="text-sm text-gray-600">Chuyển khoản qua QR Code (VietQR)</div>
                            </div>
                          </label>
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" {...field} value="momo" checked={field.value === 'momo'} className="mr-3" />
                            <div>
                              <div className="font-medium">{t.checkout.momo}</div>
                              <div className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</div>
                            </div>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-helvetica-medium mb-4">Ghi chú đơn hàng (tuỳ chọn)</h2>
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder="Ghi chú về đơn hàng..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      placeholder="Nhập mã voucher"
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
                      ✓ {appliedVoucher.description || `Giảm ${formatPrice(appliedVoucher.discountAmount)}`}
                    </div>
                  )}
                </div>

                {/* Gift Card Section */}
                <div className="mb-4 pb-4 border-b">
                  <label className="block text-sm font-medium mb-2">Thẻ quà tặng</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={giftCardNumber}
                      onChange={(e) => setGiftCardNumber(e.target.value)}
                      placeholder="Số thẻ (16 số)"
                      maxLength={16}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardPin}
                        onChange={(e) => setGiftCardPin(e.target.value)}
                        placeholder="Mã PIN (4 số)"
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
                        ✓ Số dư: {formatPrice(appliedGiftCard.balance)} • Sử dụng: {formatPrice(giftCardDiscount)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between"><span>{t.cart.subtotal}:</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span>{t.checkout.shipping_fee}:</span><span>{shippingFee === 0 ? <span className="text-green-600">{t.checkout.free}</span> : formatPrice(shippingFee)}</span></div>
                  <div className="flex justify-between"><span>{t.cart.tax}:</span><span>{formatPrice(tax)}</span></div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t.footer.vouchers}:</span>
                      <span>-{formatPrice(voucherDiscount)}</span>
                    </div>
                  )}
                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Thẻ quà tặng:</span>
                      <span>-{formatPrice(giftCardDiscount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-helvetica-medium text-lg"><span>{t.cart.total}:</span><span>{formatPrice(total)}</span></div>
                </div>
                <Button type="submit" disabled={loading} size="lg" className="w-full mt-6 rounded-full font-medium transition-colors">{loading ? t.checkout.processing : `${t.checkout.place_order} • ${formatPrice(total)}`}</Button>
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
      {
        showQR && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{t.checkout.payment}</h3>
                <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-black">✕</button>
              </div>
              <PaymentQRCode
                amount={total}
                description={`CK Don hang ${user.email} (Demo)`}
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
        )
      }
    </div >
  );
}
