import { db } from '../db/drizzle';
import { bulkDiscounts, flashSaleItems, flashSales } from '../db/schema';
import { eq, and, sql, lte, gte, isNull } from 'drizzle-orm';

/**
 * Lấy danh sách các chương trình giảm giá hàng loạt đang hoạt động.
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
 * Lấy danh sách các sản phẩm đang trong đợt Flash Sale đang diễn ra.
 */
export async function getActiveFlashSaleItems() {
  const now = new Date();
  try {
    const activeFlashSales = await db
      .select({ id: flashSales.id })
      .from(flashSales)
      .where(
        and(
          eq(flashSales.isActive, 1),
          lte(flashSales.startTime, now),
          gte(flashSales.endTime, now),
          isNull(flashSales.deletedAt)
        )
      )
      .limit(1);

    if (activeFlashSales.length === 0) return [];

    return await db
      .select({
        productId: flashSaleItems.productId,
        flashPrice: flashSaleItems.flashPrice,
        discountPercentage: flashSaleItems.discountPercentage,
      })
      .from(flashSaleItems)
      .where(eq(flashSaleItems.flashSaleId, activeFlashSales[0].id));
  } catch (error) {
    console.error('Error fetching active flash items:', error);
    return [];
  }
}

/**
 * Áp dụng logic "Giá tốt nhất" cho sản phẩm.
 * So sánh giữa Giảm giá hàng loạt (Bulk) và Flash Sale.
 */
export function applyBulkDiscount(product: any, discounts: any[], flashItems: any[] = []) {
  const productCatId = product.categoryId || product.category_id;
  const productId = product.id;

  // 1. Tính giá theo Flash Sale (nếu có)
  const flashItem = flashItems.find(
    (fi) => fi.productId === productId || fi.product_id === productId
  );
  let flashPrice = Infinity;
  if (flashItem) {
    flashPrice = parseFloat(flashItem.flashPrice || flashItem.flash_price);
  }

  // 2. Tính giá theo Chiến dịch hàng loạt (Bulk)
  const applicableBulkDiscounts = (discounts || []).filter(
    (d) => d.categoryId === null || d.categoryId === productCatId || d.category_id === productCatId
  );

  let bulkPrice = Infinity;
  let maxBulkPercentage = 0;

  const originalPrice = parseFloat(
    product.msrpPrice || product.priceCache || product.price_cache || 0
  );

  if (applicableBulkDiscounts.length > 0) {
    maxBulkPercentage = Math.max(
      ...applicableBulkDiscounts.map((d) =>
        parseFloat(d.discountPercentage || d.discount_percentage)
      )
    );
    bulkPrice = Math.round(originalPrice * (1 - maxBulkPercentage / 100));
  } else {
    // Nếu không có giảm giá hàng loạt, giữ giá gốc
    bulkPrice = originalPrice;
  }

  // 3. So sánh chọn giá tốt nhất (Rẻ nhất)
  const finalPrice = Math.min(flashPrice, bulkPrice);

  // Nếu không có đợt giảm giá nào hiệu lực (cả 2 đều Infinity hoặc không đổi), trả về nguyên bản
  if (finalPrice === Infinity || (finalPrice === originalPrice && !flashItem)) {
    return product;
  }

  // Xác định xem giá cuối cùng đến từ nguồn nào để hiển thị nhãn
  const isFromFlash = flashItem && finalPrice === flashPrice;
  const effectivePercentage = isFromFlash
    ? flashItem.discountPercentage || flashItem.discount_percentage
    : maxBulkPercentage;

  return {
    ...product,
    msrpPrice: originalPrice,
    priceCache: finalPrice,
    sale_price: finalPrice, // Đồng bộ cho các Component dùng sale_price
    discountPercentage: effectivePercentage,
    isFlashSale: isFromFlash,
    hasBulkDiscount: !isFromFlash && maxBulkPercentage > 0,
  };
}
