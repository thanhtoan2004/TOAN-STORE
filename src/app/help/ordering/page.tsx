'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, CreditCard, Truck } from 'lucide-react';

export default function OrderingGuidePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="nike-container py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                        <Link href="/help" className="hover:text-black">Trợ Giúp</Link>
                        <span>/</span>
                        <span className="text-black font-medium">Đặt Hàng</span>
                    </div>

                    <h1 className="text-4xl font-bold mb-6">Hướng Dẫn Đặt Hàng</h1>
                    <p className="text-gray-600 mb-12 text-lg">
                        Mua sắm tại TOAN thật dễ dàng và thuận tiện. Thực hiện theo các bước đơn giản sau.
                    </p>

                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm flex gap-6 items-start">
                            <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-black text-white rounded-full items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="md:hidden w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                    <h2 className="text-2xl font-helvetica-medium flex items-center gap-2">
                                        <Search className="w-6 h-6" />
                                        Tìm Kiếm Sản Phẩm
                                    </h2>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Sử dụng thanh tìm kiếm hoặc duyệt qua các danh mục (Nam, Nữ, Trẻ Em) để tìm sản phẩm bạn yêu thích.
                                    Bạn có thể lọc theo size, màu sắc, giá cả và môn thể thao.
                                </p>
                                <div className="bg-gray-50 p-4 rounded text-sm text-gray-500 italic">
                                    Mẹo: Kiểm tra bảng size ở trang chi tiết sản phẩm để chọn kích cỡ phù hợp nhất.
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm flex gap-6 items-start">
                            <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-black text-white rounded-full items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="md:hidden w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                    <h2 className="text-2xl font-helvetica-medium flex items-center gap-2">
                                        <ShoppingBag className="w-6 h-6" />
                                        Thêm Vào Giỏ Hàng
                                    </h2>
                                </div>
                                <p className="text-gray-600">
                                    Chọn size và số lượng, sau đó nhấn nút "Thêm vào giỏ hàng". Bạn có thể tiếp tục mua sắm hoặc đi đến giỏ hàng để kiểm tra lại các sản phẩm.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm flex gap-6 items-start">
                            <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-black text-white rounded-full items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="md:hidden w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                    <h2 className="text-2xl font-helvetica-medium flex items-center gap-2">
                                        <CreditCard className="w-6 h-6" />
                                        Thanh Toán
                                    </h2>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Nhập thông tin giao hàng và chọn phương thức thanh toán. Chúng tôi chấp nhận:
                                </p>
                                <ul className="grid grid-cols-2 gap-2 text-sm text-gray-700 font-medium">
                                    <li>• Thanh toán khi nhận hàng (COD)</li>
                                    <li>• Thẻ tín dụng / Ghi nợ quốc tế</li>
                                    <li>• Chuyển khoản ngân hàng / QR</li>
                                    <li>• Ví điện tử (Momo, ZaloPay)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white rounded-lg p-8 shadow-sm flex gap-6 items-start">
                            <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-black text-white rounded-full items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="md:hidden w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                                    <h2 className="text-2xl font-helvetica-medium flex items-center gap-2">
                                        <Truck className="w-6 h-6" />
                                        Xác Nhận & Giao Hàng
                                    </h2>
                                </div>
                                <p className="text-gray-600">
                                    Bạn sẽ nhận được email xác nhận đơn hàng ngay lập tức. Chúng tôi sẽ thông báo khi đơn hàng được gửi đi cùng mã vận đơn để bạn theo dõi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
