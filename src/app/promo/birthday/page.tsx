'use client';

import React from 'react';
import Link from 'next/link';
import { Cake, Ticket, Gift, Sparkles, PartyPopper, HeartHandshake, Package, Target, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BirthdayPromoPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative nike-container h-full flex flex-col justify-center items-center text-center px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mb-4 text-pink-200"
          >
            <Cake size={64} strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4"
          >
            ƯU ĐÃI SINH NHẬT
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg lg:text-xl max-w-2xl"
          >
            Chúc mừng sinh nhật! Nhận ngay voucher trị giá 200.000đ
          </motion.p>
        </motion.div>
      </div>

      {/* Benefits Section */}
      <div className="nike-container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl lg:text-4xl font-helvetica-medium mb-6 md:mb-8 text-center"
          >
            Quà Tặng Sinh Nhật Của Bạn
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12"
          >
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200">
              <div className="mb-4 text-pink-500 flex justify-center">
                <Ticket size={48} strokeWidth={1.5} />
              </div>
              <div className="text-4xl md:text-5xl mb-2 font-bold text-gray-900">200K</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Voucher</h3>
              <p className="text-sm md:text-base text-gray-600">
                Áp dụng cho đơn từ 1.000.000đ
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200">
              <div className="mb-4 text-purple-500 flex justify-center">
                <Gift size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Quà Đặc Biệt</h3>
              <p className="text-sm md:text-base text-gray-600">
                Tặng vớ hoặc túi vải cao cấp
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200">
              <div className="mb-4 text-yellow-500 flex justify-center">
                <Sparkles size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Điểm Thưởng x2</h3>
              <p className="text-sm md:text-base text-gray-600">
                Tích điểm gấp đôi trong tháng sinh nhật
              </p>
            </motion.div>
          </motion.div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-lg p-6 md:p-10 mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-helvetica-medium mb-6">
              Cách Nhận Ưu Đãi
            </h2>
            <ol className="space-y-4 text-sm md:text-base">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <strong>Đăng ký làm thành viên TOAN</strong>
                  <p className="text-gray-600 mt-1">
                    Cập nhật đầy đủ thông tin cá nhân, đặc biệt là ngày sinh
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <strong>Nhận email chúc mừng</strong>
                  <p className="text-gray-600 mt-1">
                    Vào ngày sinh nhật, bạn sẽ nhận email chúc mừng kèm mã voucher
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <strong>Sử dụng voucher</strong>
                  <p className="text-gray-600 mt-1">
                    Áp dụng mã voucher khi thanh toán trong vòng 30 ngày
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <strong>Nhận quà và điểm thưởng</strong>
                  <p className="text-gray-600 mt-1">
                    Nhận quà tặng kèm đơn hàng và tích điểm gấp đôi suốt tháng sinh nhật
                  </p>
                </div>
              </li>
            </ol>
          </motion.div>

          {/* Birthday Month Benefits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <PartyPopper className="text-purple-600" size={32} />
              <h3 className="text-xl md:text-2xl font-medium">Đặc Quyền Tháng Sinh Nhật</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <HeartHandshake className="text-pink-500 shrink-0" size={24} />
                <div>
                  <strong className="block mb-1">Ưu tiên hỗ trợ</strong>
                  <p className="text-sm text-gray-700">Được ưu tiên xử lý yêu cầu hỗ trợ</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-blue-500 shrink-0" size={24} />
                <div>
                  <strong className="block mb-1">Giao hàng ưu tiên</strong>
                  <p className="text-sm text-gray-700">Giao hàng nhanh trong 24h nội thành</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="text-red-500 shrink-0" size={24} />
                <div>
                  <strong className="block mb-1">Sản phẩm độc quyền</strong>
                  <p className="text-sm text-gray-700">Được mua sản phẩm limited edition</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="text-purple-500 shrink-0" size={24} />
                <div>
                  <strong className="block mb-1">Gói quà miễn phí</strong>
                  <p className="text-sm text-gray-700">Gói quà đẹp miễn phí cho đơn hàng</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-gray-200 pt-8"
          >
            <h3 className="text-lg md:text-xl font-medium mb-4">Điều Kiện & Điều Khoản</h3>
            <ul className="space-y-2 text-sm md:text-base text-gray-600">
              <li>• Áp dụng cho tất cả thành viên TOAN có cập nhật ngày sinh</li>
              <li>• Voucher 200.000đ áp dụng cho đơn hàng từ 1.000.000đ trở lên</li>
              <li>• Voucher có hiệu lực 30 ngày kể từ ngày sinh nhật</li>
              <li>• Điểm thưởng gấp đôi áp dụng cho tất cả đơn hàng trong tháng sinh nhật</li>
              <li>• Quà tặng được giao kèm đơn hàng, không áp dụng cho đơn hàng dưới 500.000đ</li>
              <li>• Không kết hợp với các chương trình khuyến mãi khác trừ tích điểm</li>
              <li>• Mỗi tài khoản chỉ nhận 1 voucher sinh nhật/năm</li>
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              href="/sign-up"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all text-sm md:text-base shadow-lg"
            >
              Đăng Ký Ngay Để Nhận Ưu Đãi
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Đã có tài khoản? <Link href="/login" className="text-black underline">Đăng nhập</Link> để cập nhật ngày sinh
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
