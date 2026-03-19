import { db } from '../db/drizzle';
import { bulkDiscounts } from '../db/schema';
import { eq, and, sql, lte, gte } from 'drizzle-orm';

/**
 * Lấy danh sách các chương trình giảm giá đang hoạt động.
 */
export async function getActiveBulkDiscounts() {
  const now = new Date();
  return await db
    .select()
    .from(bulkDiscounts)
    .where(
      and(
        eq(bulkDiscounts.isActive, 1),
        lte(bulkDiscounts.startTime, now),
        gte(bulkDiscounts.endTime, now)
      )
    );
}

/**
 * Áp dụng giảm giá hàng loạt cho sản phẩm.
 * Ưu tiên: Giảm giá cao nhất nếu có nhiều chương trình trùng lặp.
 */
export function applyBulkDiscount(product: any, discounts: any[]) {
  if (!discounts || discounts.length === 0) return product;

  // Tìm chương trình áp dụng cho category của sản phẩm hoặc áp dụng toàn sàn (categoryId is null)
  const applicableDiscounts = discounts.filter(
    (d) => d.categoryId === null || d.categoryId === product.categoryId
  );

  if (applicableDiscounts.length === 0) return product;

  // Lấy mức giảm cao nhất
  const maxDiscount = Math.max(...applicableDiscounts.map((d) => parseFloat(d.discountPercentage)));

  if (maxDiscount > 0) {
    const originalPrice = parseFloat(product.msrpPrice || product.priceCache || 0);
    const discountAmount = originalPrice * (maxDiscount / 100);
    const finalPrice = Math.round(originalPrice - discountAmount);

    return {
      ...product,
      msrpPrice: originalPrice, // Giữ giá gốc làm MSRP
      priceCache: finalPrice, // Cập nhật giá bán hiện tại
      bulkDiscountPercentage: maxDiscount,
      hasBulkDiscount: true,
    };
  }

  return product;
}
