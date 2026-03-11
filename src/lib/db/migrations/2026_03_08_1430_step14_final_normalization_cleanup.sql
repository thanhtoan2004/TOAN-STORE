-- =============================================================================
-- Migration: 2026_03_08_1430_step14_final_normalization_cleanup.sql
-- Phase 9: Final Database Cleanup and integrity
-- =============================================================================

SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- 1. CLEANUP: Nullify orphan voucher codes in orders
--    Tìm các voucher_code không tồn tại trong bảng vouchers và set về NULL để tránh lỗi FK.
UPDATE `orders` 
SET `voucher_code` = NULL 
WHERE `voucher_code` IS NOT NULL 
AND `voucher_code` NOT IN (SELECT `code` FROM `vouchers`);

-- 2. NORMALIZATION: Drop legacy items column from stock_reservations
--    Dữ liệu đã được chuyển sang stock_reservation_items (theo audit and code logic).
ALTER TABLE `stock_reservations` DROP COLUMN `items`;

-- 3. INTEGRITY: Bridge missing FK for orders.voucher_code
--    Đảm bảo voucher_code trong orders phải tồn tại trong bảng vouchers.
--    Dùng ON DELETE SET NULL để giữ order record nếu voucher bị xóa (nếu logic cho phép).
ALTER TABLE `orders` 
ADD CONSTRAINT `fk_orders_voucher` 
FOREIGN KEY (`voucher_code`) REFERENCES `vouchers`(`code`) ON DELETE SET NULL;

-- 3. INTEGRITY: Ensure consistency between users.available_points and lifetime_points (Double Check)
--    Đã có CHECK constraint trong migration trước, ở đây đảm bảo index cho performance nếu cần.
--    Thường CHECK constraint đã đủ cho data integrity.

-- =============================================================================
-- End of Migration
-- =============================================================================
