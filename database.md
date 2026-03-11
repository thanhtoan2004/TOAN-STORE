# 🗄️ Database Review — TOAN Store

> **File:** `database.sql` · **Last Updated:** 2026-03-06 23:20
> **Engine:** MySQL 9.2.0 · InnoDB · utf8mb4
> **Tables:** 76 · **Migrations:** 12 applied

---

## ✅ 26/26 Issues Resolved — Hoàn Tất 100%

Tất cả các vấn đề về Schema, Index và Logic dữ liệu đã được giải quyết triệt để.

| #   | Vấn Đề                                                 | Status    | Đánh Giá                            |
| --- | ------------------------------------------------------ | --------- | ----------------------------------- |
| 1   | `transactions` FK → `ON DELETE RESTRICT / SET NULL`    | ✅ Fixed  | Đã đồng bộ                          |
| 2   | `refund_requests` FK → `ON DELETE RESTRICT / SET NULL` | ✅ Fixed  | Đã đồng bộ                          |
| 3   | `orders.status` → `NOT NULL`                           | ✅ Fixed  | Đã áp dụng                          |
| 4   | `transactions.status` → `NOT NULL`                     | ✅ Fixed  | Đã áp dụng                          |
| 5   | `shipments.status` → `NOT NULL`                        | ✅ Fixed  | Đã áp dụng                          |
| 6   | Duplicate `idx_sku` trên `product_variants`            | ✅ Fixed  | Đã xóa                              |
| 7   | `idx_product_color` trỏ sai cột                        | ✅ Fixed  | Đã trỏ vào `(product_id, color_id)` |
| 8   | `spend` và `redeem` trùng nghĩa                        | ✅ Fixed  | Đã hợp nhất vào `redeem`            |
| 9   | `idx_pt_user_time` composite                           | ✅ Fixed  | (user_id, created_at DESC)          |
| 10  | `idx_coupons_active` `(deleted_at, ends_at)`           | ✅ Fixed  | Đã thêm                             |
| 11  | `idx_coupon_usage_check` `(user_id, coupon_id)`        | ✅ Fixed  | Đã thêm                             |
| 12  | `idx_transactions_order_status` `(order_id, status)`   | ✅ Fixed  | Đã thêm                             |
| 13  | `idx_security_event_time` composite                    | ✅ Fixed  | Đã thêm                             |
| 14  | `idx_orders_voucher_code`                              | ✅ Fixed  | Đã thêm                             |
| 15  | `idx_orders_payment_method`                            | ✅ Fixed  | Đã thêm                             |
| 16  | `idx_shipments_status`                                 | ✅ Fixed  | Đã thêm                             |
| 17  | `idx_gift_cards_status`                                | ✅ Fixed  | Đã thêm                             |
| 18  | `idx_news_published` + `idx_news_published_at`         | ✅ Fixed  | Đã thêm                             |
| 19  | `idx_user_addr_default`                                | ✅ Fixed  | (user_id, is_default)               |
| 20  | `idx_product_images_main`                              | ✅ Fixed  | (product_id, is_main)               |
| 21  | `idx_inventory_logs_time`                              | ✅ Fixed  | (inventory_id, created_at DESC)     |
| 22  | `product_colors` data                                  | ✅ Seeded | 48/53 variants đã được gán màu      |
| 23  | `product_variants.color_id` FK                         | ✅ Fixed  | Đã chuẩn hóa                        |
| 24  | Loyalty dual-points `lifetime/available`               | ✅ Fixed  | Hoàn thiện                          |
| 25  | Zombie tables (`admin_audit_logs`, v.v.)               | ✅ Fixed  | Đã dọn dẹp                          |
| 26  | `users.is_admin`, `users.accumulated_points` legacy    | ✅ Fixed  | Đã xóa                              |

---

## 🏗️ Kiến Trúc Hệ Thống (Hiện Tại)

### Loyalty & Points

- `users`: Quản lý song song `lifetime_points` (hạng) và `available_points` (tiêu dùng).
- `point_transactions`: Audit trail đầy đủ với `source` và `source_id`.

### Colors & Variants

- `product_colors`: Bảng chuẩn hóa màu sắc (name, code, image).
- `product_variants`: Liên kết qua `color_id` FK.

### Payment & Orders

- `transactions`: Ghi nhận log từ cổng thanh toán (VNPay/MoMo).
- `orders`: Toàn bộ logic trạng thái (Enum) đã được ép buộc `NOT NULL`.

---

_Reviewed: 2026-03-06 23:20 · TOAN Store v2.13.0 · Production Ready_
domains: database, auth, points, shop.
