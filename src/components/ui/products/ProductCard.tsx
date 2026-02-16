"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageService } from "@/lib/image-service";

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  sale_price?: number;
  image_url: string;
  colors?: number;
  is_new_arrival?: boolean;
}

const ProductCard = ({
  id,
  name,
  category,
  price,
  sale_price,
  image_url,
  colors = 1,
  is_new_arrival = false,
}: ProductCardProps) => {
  // Kiểm tra nếu sale_price có giá trị và nhỏ hơn giá gốc, tính % giảm giá
  const hasDiscount = sale_price && sale_price < price;
  const discountPercent = hasDiscount
    ? Math.round(((price - sale_price) / price) * 100)
    : 0;

  // Hàm xử lý giá tiền để đảm bảo nó luôn là số và có thể gọi .toFixed()
  const formatPrice = (price: number | undefined) => {
    if (typeof price !== "number" || isNaN(price)) {
      return "0";
    }
    return price.toLocaleString('vi-VN');
  };


  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);
  const { t } = useLanguage();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ id, name, category, price, sale_price, image_url, is_new_arrival });
    }
  };

  return (
    <Link href={`/products/${id}`} className="block w-full group">
      <div className="relative cursor-pointer">
        {/* Hình ảnh sản phẩm */}
        <div className="relative mb-3 overflow-hidden aspect-square rounded-lg bg-gray-100">
          <Image
            src={imageService.getUrl(image_url, { preset: 'PRODUCT_CARD' })}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 mix-blend-multiply"
            loading="lazy"
          />
          {/* Wishlist icon */}
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleWishlist}
              className="p-1 rounded-full bg-white/80 hover:bg-white shadow transition-all duration-200"
              aria-label={inWishlist ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart size={22} className={`transition-colors duration-200 ${inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>
          {/* Các thẻ badges (Giảm giá & Mới) */}
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 items-start">
            {!!is_new_arrival && (
              <div className="bg-black px-2 py-1 text-xs font-bold text-white rounded shadow-sm min-w-[50px] text-center">
                {t.product.new || 'Mới'}
              </div>
            )}
            {hasDiscount && (
              <div className="bg-red-600 px-2 py-1 text-xs font-bold text-white rounded shadow-sm min-w-[50px] text-center">
                -{discountPercent}%
              </div>
            )}
          </div>
        </div>
        {/* Chi tiết sản phẩm */}
        <div className="space-y-1">
          <h3 className="text-base font-medium line-clamp-2 group-hover:text-gray-600 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-500">{category}</p>
          <div className="flex items-center justify-between">
            <div className="text-right">
              {hasDiscount ? (
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-red-600">
                    {formatPrice(sale_price)} ₫
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(price)} ₫
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-black">
                  {formatPrice(price)} ₫
                </span>
              )}
            </div>
            {colors > 1 && (
              <div className="text-sm text-gray-500">{colors} màu</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

