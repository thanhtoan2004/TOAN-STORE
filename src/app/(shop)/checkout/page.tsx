'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import PaymentQRCode from '@/components/checkout/PaymentQRCode';

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

  const [formData, setFormData] = useState({
    fullName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    paymentMethod: 'cod',
    note: ''
  });

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
      setFormData({
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
    setFormData(prev => ({
      ...prev,
      fullName: address.recipient_name || prev.fullName,
      phone: address.phone || prev.phone,
      address: address.address_line || '',
      city: address.city || 'TP. Hồ Chí Minh',
      district: address.state || '',
      ward: address.postal_code || ''
    }));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Vui lòng đăng nhập để đặt hàng');
    if (cartItems.length === 0) return alert('Giỏ hàng trống');
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.district.trim() || !formData.ward.trim()) return alert('Vui lòng điền đầy đủ thông tin giao hàng');

    // Payment Logic
    if (formData.paymentMethod === 'bank' && !isPaid) {
      setShowQR(true);
      return;
    }

    if (formData.paymentMethod === 'momo' && !isPaid) {
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
    const finalPaymentStatus = (formData.paymentMethod === 'momo' && !isPaid) ? 'paid' : (isPaid ? 'paid' : 'pending');

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
        shippingAddress: { name: formData.fullName, phone: formData.phone, address: formData.address, city: formData.city, district: formData.district, ward: formData.ward },
        phone: formData.phone,
        email: formData.email,
        paymentMethod: getPaymentMethodText(formData.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: isPaid ? `${formData.note} [Đã thanh toán Online/CK]` : formData.note,
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
    // Since we can't easily pass the event 'e' here, we construct a fake one or extract submit logic.
    // simpler: call a function that calls api
    submitOrderAfterPayment();
  };

  const submitOrderAfterPayment = async () => {
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
        shippingAddress: { name: formData.fullName, phone: formData.phone, address: formData.address, city: formData.city, district: formData.district, ward: formData.ward },
        phone: formData.phone,
        email: formData.email,
        paymentMethod: getPaymentMethodText(formData.paymentMethod),
        totalAmount: subtotal,
        shippingFee,
        tax,
        discount: voucherDiscount + giftCardDiscount,
        voucherCode: appliedVoucher?.code || null,
        voucherDiscount: voucherDiscount,
        giftcardNumber: appliedGiftCard?.cardNumber || null,
        giftcardDiscount: giftCardDiscount,
        notes: `${formData.note} [Đã thanh toán chuyển khoản]`,
        paymentStatus: 'paid'
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
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.common.login}</h2>
          <p className="text-gray-600 mb-6">{t.auth.sign_in_title}</p>
          <Link href="/sign-in"><button className="shop-button">{t.common.login}</button></Link>
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
          <Link href="/cart"><button className="shop-button">{t.cart.bag}</button></Link>
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

      <form onSubmit={handleSubmit} className="nike-container py-8" autoComplete="off">
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.auth.full_name} *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.common.phone} *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">{t.common.email}</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">{t.common.addresses} *</label>
                      <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Số nhà, tên đường..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tỉnh/Thành phố</label>
                      <select name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent">
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Quận/Huyện *</label>
                      <input type="text" name="district" value={formData.district} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Phường/Xã *</label>
                      <input type="text" name="ward" value={formData.ward} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">{t.checkout.payment}</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} className="mr-3" />
                  <div>
                    <div className="font-medium">{t.checkout.cod}</div>
                    <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận được hàng</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleInputChange} className="mr-3" />
                  <div>
                    <div className="font-medium">{t.checkout.bank_transfer}</div>
                    <div className="text-sm text-gray-600">Chuyển khoản qua QR Code (VietQR)</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="momo" checked={formData.paymentMethod === 'momo'} onChange={handleInputChange} className="mr-3" />
                  <div>
                    <div className="font-medium">{t.checkout.momo}</div>
                    <div className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-4">Ghi chú đơn hàng (tuỳ chọn)</h2>
              <textarea name="note" value={formData.note} onChange={handleInputChange} rows={3} placeholder="Ghi chú về đơn hàng của bạn..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
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
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    {t.cart.apply || 'Áp dụng'}
                  </button>
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
                    <button
                      type="button"
                      onClick={handleApplyGiftCard}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                    >
                      {t.cart.apply || 'Áp dụng'}
                    </button>
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
              <button type="submit" disabled={loading} className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>{loading ? t.checkout.processing : `${t.checkout.place_order} • ${formatPrice(total)}`}</button>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  {t.common.security || 'Secure Transaction'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* QR Code Modal */}
      {showQR && (
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
              <button
                onClick={handleQRPaymentConfirmed}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800"
              >
                {loading ? t.checkout.processing : 'Tôi đã chuyển khoản'}
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="w-full border border-gray-300 py-2 rounded font-medium hover:bg-gray-50"
              >
                Thanh toán sau (COD)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
