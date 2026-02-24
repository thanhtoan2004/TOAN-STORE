"use client";
import React from "react";
import Link from "next/link";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import ProductCard from "@/components/ui/products/ProductCard";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Kiểm tra đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">{t.wishlist.login_required}</h2>
          <p className="text-gray-600 mb-6">{t.wishlist.login_desc}</p>
          <Link href="/sign-in">
            <Button className="rounded-full">
              {t.common.login}
            </Button>
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
          <p className="text-gray-600">{t.wishlist.loading}</p>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Heart size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-2">{t.wishlist.empty_title}</h2>
        <p className="text-gray-500 mb-6">{t.wishlist.empty_desc}</p>
        <Link href="/">
          <Button className="rounded-full px-6 py-6">
            {t.wishlist.return_shop}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">{t.wishlist.title}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {wishlist.map((item) => (
          <ProductCard
            key={item.id}
            id={String(item.id)}
            name={item.name}
            category={item.category}
            price={item.price}
            sale_price={item.sale_price}
            image_url={item.image_url}
            is_new_arrival={Boolean(item.is_new_arrival)}
          />
        ))}
      </div>
    </div>
  );
}


