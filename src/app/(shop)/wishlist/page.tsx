"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();

  // Kiểm tra đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem danh sách yêu thích</p>
          <Link href="/sign-in">
            <button className="shop-button">
              Đăng nhập
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Heart size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-2">Danh sách yêu thích trống</h2>
        <p className="text-gray-500 mb-6">Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">Quay lại mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Danh sách yêu thích</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => (
          <div key={item.id} className="relative bg-white rounded-lg shadow p-4 flex flex-col">
            <Link href={`/products/${item.id}`} className="block group">
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 relative">
                <Image src={item.image_url} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-lg font-semibold mb-1 line-clamp-2 group-hover:text-gray-600 transition-colors">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{item.category}</p>
              <div className="flex items-center gap-2 mb-2">
                {item.sale_price && item.sale_price < item.price ? (
                  <>
                    <span className="font-semibold text-red-600">{item.sale_price.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-sm text-gray-500 line-through">{item.price.toLocaleString('vi-VN')} ₫</span>
                  </>
                ) : (
                  <span className="font-semibold text-black">{item.price.toLocaleString('vi-VN')} ₫</span>
                )}
              </div>
              {item.is_new_arrival && (
                <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded">MỚI</span>
              )}
            </Link>
            <button
              onClick={() => removeFromWishlist(item.id)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white shadow border border-gray-200"
              aria-label="Xóa khỏi yêu thích"
            >
              <Trash2 size={20} className="text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


