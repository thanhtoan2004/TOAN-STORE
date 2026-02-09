'use client';

import React from 'react';
import Link from 'next/link';
import { School, Gift, Truck, Heart, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherPromoPage() {
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
      <div className="relative h-[40vh] md:h-[50vh] bg-gradient-to-r from-green-600 to-teal-600 text-white overflow-hidden">
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
            className="mb-4 text-green-200"
          >
            <School size={64} strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4"
          >
            ƯU ĐÃI GIÁO VIÊN
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg lg:text-xl max-w-2xl"
          >
            Tri ân thầy cô với ưu đãi 20% đặc biệt
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
            Ưu Đãi Dành Riêng Cho Thầy Cô
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12"
          >
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="mb-4 text-green-600 flex justify-center">
                <Percent size={48} strokeWidth={1.5} />
              </div>
              <div className="text-4xl md:text-5xl mb-2 font-bold text-gray-900">20%</div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Giảm Giá</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho tất cả sản phẩm thường xuyên
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="mb-4 text-purple-600 flex justify-center">
                <Gift size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Ưu Đãi Đặc Biệt</h3>
              <p className="text-sm md:text-base text-gray-600">
                Voucher 500K vào ngày 20/11
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="mb-4 text-blue-600 flex justify-center">
                <Truck size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2">Miễn Phí Ship</h3>
              <p className="text-sm md:text-base text-gray-600">
                Cho mọi đơn hàng
              </p>
            </motion.div>
          </motion.div>

          {/* How to Register */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-lg p-6 md:p-10 mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-helvetica-medium mb-6">
              Cách Đăng Ký
            </h2>
            <ol className="space-y-4 text-sm md:text-base">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <strong>Đăng ký tài khoản TOAN</strong>
                  <p className="text-gray-600 mt-1">
                    Tạo tài khoản miễn phí nếu chưa có
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <strong>Xác minh tư cách giáo viên</strong>
                  <p className="text-gray-600 mt-1">
                    Upload thẻ giáo viên hoặc giấy xác nhận từ trường/sở giáo dục
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <strong>Nhận mã giảm giá</strong>
                  <p className="text-gray-600 mt-1">
                    Sau khi được phê duyệt (1-3 ngày), bạn sẽ nhận mã giảm giá 20% qua email
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <strong>Tận hưởng ưu đãi</strong>
                  <p className="text-gray-600 mt-1">
                    Áp dụng mã khi thanh toán và nhận thêm nhiều ưu đãi độc quyền
                  </p>
                </div>
              </li>
            </ol>
          </motion.div>

          {/* Special Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 md:p-8 mb-8 border-l-4 border-green-600"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="text-green-600 fill-green-600" size={24} />
              <h3 className="text-lg md:text-xl font-medium">Lời Cảm Ơn</h3>
            </div>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              TOAN xin gửi lời tri ân sâu sắc đến quý thầy cô - những người thầy đã cống hiến hết mình
              cho sự nghiệp giáo dục. Chương trình ưu đãi này là món quà nhỏ để tri ân công lao to lớn
              của thầy cô trong việc đào tạo thế hệ trẻ Việt Nam.
            </p>
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
              <li>• Áp dụng cho giáo viên đang giảng dạy tại các cơ sở giáo dục được công nhận</li>
              <li>• Cần có thẻ giáo viên hoặc quyết định bổ nhiệm còn hiệu lực</li>
              <li>• Giảm giá 20% cho sản phẩm giá gốc, không áp dụng cho sản phẩm đang sale</li>
              <li>• Miễn phí vận chuyển cho tất cả đơn hàng</li>
              <li>• Mã giảm giá có hiệu lực vĩnh viễn (chừng nào còn là giáo viên)</li>
              <li>• Voucher đặc biệt 500K sẽ được gửi vào ngày 20/11 hàng năm</li>
              <li>• Không kết hợp với các chương trình khuyến mãi khác</li>
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
              className="inline-block bg-black text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium hover:bg-gray-800 transition-colors text-sm md:text-base"
            >
              Đăng Ký Ngay
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
