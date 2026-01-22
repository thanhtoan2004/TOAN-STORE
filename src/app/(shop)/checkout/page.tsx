'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);
  
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

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN',{ style:'currency', currency:'VND'}).format(price);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 1000000 ? 0 : 30000;
  const tax = Math.round(subtotal * 0.1);
  const voucherDiscount = appliedVoucher?.discountAmount || 0;
  const giftCardDiscount = Math.min(appliedGiftCard?.balance || 0, subtotal + shippingFee + tax - voucherDiscount);
  const total = Math.max(0, subtotal + shippingFee + tax - voucherDiscount - giftCardDiscount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
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
        notes: formData.note
      };

      const response = await fetch('/api/orders', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(orderData) });
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để tiến hành thanh toán</p>
          <Link href="/sign-in"><button className="shop-button">Đăng nhập</button></Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Không có sản phẩm nào để thanh toán</p>
          <Link href="/cart"><button className="shop-button">Quay lại giỏ hàng</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="nike-container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-nike-futura">Thanh toán</h1>
            <Link href="/cart" className="text-blue-600 hover:text-blue-800">← Quay lại giỏ hàng</Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="nike-container py-8" autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-helvetica-medium mb-6">Thông tin giao hàng</h2>
              
              {/* Address Selection */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Chọn địa chỉ giao hàng</label>
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
                                  Mặc định
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
                            Sửa
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
                          <p className="font-semibold">+ Sử dụng địa chỉ mới</p>
                          <p className="text-sm text-gray-600">Nhập địa chỉ giao hàng khác</p>
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
                      <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Địa chỉ *</label>
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
              <h2 className="text-xl font-helvetica-medium mb-6">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} className="mr-3" />
                  <div>
                    <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận được hàng</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleInputChange} className="mr-3" />
                  <div>
                    <div className="font-medium">Chuyển khoản ngân hàng</div>
                    <div className="text-sm text-gray-600">Chuyển khoản trước khi giao hàng</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input type="radio" name="paymentMethod" value="momo" checked={formData.paymentMethod === 'momo'} onChange={handleInputChange} disabled className="mr-3" />
                  <div>
                    <div className="font-medium">Ví MoMo (Sắp có)</div>
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
              <h2 className="text-xl font-helvetica-medium mb-6">Đơn hàng của bạn</h2>
              
              {/* Voucher Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mã giảm giá</label>
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
                    Áp dụng
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
                      Áp dụng
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
                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{shippingFee===0? <span className="text-green-600">Miễn phí</span> : formatPrice(shippingFee)}</span></div>
                <div className="flex justify-between"><span>Thuế VAT:</span><span>{formatPrice(tax)}</span></div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá voucher:</span>
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
                <div className="flex justify-between font-helvetica-medium text-lg"><span>Tổng cộng:</span><span>{formatPrice(total)}</span></div>
              </div>
              <button type="submit" disabled={loading} className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${loading? 'bg-gray-400 cursor-not-allowed':'bg-black text-white hover:bg-gray-800'}`}>{loading? 'Đang xử lý...' : `Đặt hàng • ${formatPrice(total)}`}</button>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Thông tin của bạn được bảo mật
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}



