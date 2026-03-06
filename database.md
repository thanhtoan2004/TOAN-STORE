# 🗄️ Database Review — TOAN Store

> **File:** `database.sql` · **Dump:** 2026-03-06 16:51:41
> **Engine:** MySQL 9.2.0 · InnoDB · utf8mb4
> **Tables:** 76 (giảm 5 so với dump 11:55)
> **Migrations mới:** 3 migration đã chạy thành công

---

## ✅ Những Gì Đã Được Fix Kể Từ Dump Trước

### 3 Migration Mới Đã Chạy

```
2026_03_06_1001_phase_1_low_risk.sql      — 2026-03-06 06:43
2026_03_06_1002_phase_2_auth_support.sql  — 2026-03-06 07:02
2026_03_06_1003_phase_3_high_risk.sql     — 2026-03-06 07:04
```

### Tables Đã Drop (5 bảng)

| Table               | Lý Do                                           | Đánh Giá |
| ------------------- | ----------------------------------------------- | -------- |
| `attribute_options` | Rỗng, chưa được dùng                            | ✅ Đúng  |
| `user_roles`        | Rỗng, trùng chức năng admin RBAC                | ✅ Đúng  |
| `user_sessions`     | Rỗng, session quản lý ở Redis                   | ✅ Đúng  |
| `payments`          | Rỗng, trùng với `transactions`                  | ✅ Đúng  |
| `product_sizes`     | Rỗng, size đã lưu trong `product_variants.size` | ✅ Đúng  |

### `product_variants` — Fix Color Architecture

```sql
-- TRƯỚC (sai):
`color` varchar(100) DEFAULT NULL  -- string tự do, không FK

-- SAU (đúng):
`color_id` bigint unsigned DEFAULT NULL,
FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL
```

`color` VARCHAR đã được thay bằng `color_id` FK → `product_colors`. Đây là fix quan trọng cho data integrity.

### `point_transactions.type` — Thêm `redeem`

```sql
-- TRƯỚC:
ENUM('earn','spend','expire','refund','adjust')

-- SAU:
ENUM('earn','spend','expire','refund','adjust','redeem')
```

### `product_reviews` — Thêm 3 Composite Index Rất Tốt

```sql
KEY idx_product_approved_created  (product_id, status, created_at DESC)
KEY idx_product_rating            (product_id, rating DESC)
KEY idx_user_created              (user_id, created_at DESC)
```

### `order_items` — Fix NOT NULL

```sql
unit_price  decimal(12,2) NOT NULL  ✅
total_price decimal(12,2) NOT NULL  ✅
```

---

## 🔴 Vấn Đề Còn Lại — Cần Fix

### 1. FK Thiếu `ON DELETE` — `transactions` + `refund_requests` (Chưa Fix)

Vẫn là vấn đề từ report trước. Cả 2 bảng đều dùng `RESTRICT` ngầm định, nghĩa là **không thể xóa `order` hay `user`** nếu còn record liên quan, gây lỗi runtime khi admin xóa data test hoặc hard-delete user.

```sql
-- transactions (cả 2 FK đều thiếu ON DELETE):
FOREIGN KEY (order_id) REFERENCES orders(id)   ⚠️
FOREIGN KEY (user_id)  REFERENCES users(id)    ⚠️

-- refund_requests (cả 2 FK đều thiếu ON DELETE):
FOREIGN KEY (order_id) REFERENCES orders(id)   ⚠️
FOREIGN KEY (user_id)  REFERENCES users(id)    ⚠️
```

```sql
-- Fix transactions:
ALTER TABLE transactions
  DROP FOREIGN KEY transactions_ibfk_1,
  DROP FOREIGN KEY transactions_ibfk_2,
  MODIFY COLUMN user_id BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_fk_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  ADD CONSTRAINT transactions_fk_user
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL;

-- Fix refund_requests:
ALTER TABLE refund_requests
  DROP FOREIGN KEY refund_requests_ibfk_1,
  DROP FOREIGN KEY refund_requests_ibfk_2,
  MODIFY COLUMN user_id BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE refund_requests
  ADD CONSTRAINT refund_requests_fk_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  ADD CONSTRAINT refund_requests_fk_user
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE SET NULL;
```

---

### 2. `product_variants` — Hai Vấn Đề Index

**A) Duplicate index `sku` vẫn còn:**

```sql
UNIQUE KEY `sku`    (`sku`)   -- ← UNIQUE đã tạo index ngầm
KEY       `idx_sku` (`sku`)   -- ← TRÙNG, lãng phí
```

**B) `idx_product_color` trỏ sai cột:**

```sql
-- HIỆN TẠI (sai — trỏ vào product_id thay vì color_id):
KEY `idx_product_color` (`product_id`)

-- ĐÚNG phải là composite (product_id, color_id):
KEY `idx_product_color` (`product_id`, `color_id`)
```

Sau khi đổi `color VARCHAR` → `color_id FK`, index cũ `idx_product_color(product_id)` không còn ý nghĩa (đã có `idx_product_id` và `idx_product_size` cover rồi). Index đúng phải là composite `(product_id, color_id)` để query "lấy tất cả variant màu X của sản phẩm Y".

```sql
-- Fix:
DROP INDEX idx_sku          ON product_variants;
DROP INDEX idx_product_color ON product_variants;
CREATE INDEX idx_product_color ON product_variants (product_id, color_id);
```

---

### 3. `status` Columns Vẫn Nullable Trên 3 Bảng

```sql
orders.status      — DEFAULT 'pending'  nullable ⚠️
transactions.status — DEFAULT 'pending' nullable ⚠️
shipments.status   — DEFAULT 'pending'  nullable ⚠️
```

Về logic nghiệp vụ, 3 cột này không bao giờ được là NULL — luôn phải có giá trị. Nullable gây risk nếu INSERT thiếu giá trị và DEFAULT không được apply.

```sql
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending','pending_payment_confirmation','payment_received',
    'confirmed','processing','shipped','delivered','cancelled','refunded'
  ) NOT NULL DEFAULT 'pending';

ALTER TABLE transactions
  MODIFY COLUMN status ENUM('pending','success','failed','refunded')
    NOT NULL DEFAULT 'pending';

ALTER TABLE shipments
  MODIFY COLUMN status ENUM('pending','shipped','delivered','returned','cancelled')
    NOT NULL DEFAULT 'pending';
```

---

### 4. `point_transactions.type` — `spend` vs `redeem` Trùng Nghĩa

```sql
ENUM('earn', 'spend', 'expire', 'refund', 'adjust', 'redeem')
```

Hiện tại có **cả `spend` lẫn `redeem`** trong enum — nhưng cả 2 đều mô tả hành động dùng điểm để đổi voucher. Transaction thực tế duy nhất đang dùng `spend`. Cần quyết định:

- **Nếu giữ `redeem`** = dùng điểm đổi voucher, thì `spend` = dùng điểm trực tiếp thanh toán (2 concept khác nhau) → OK, nhưng cần **document rõ sự khác biệt**.
- **Nếu `spend` = `redeem`** → drop một trong hai để tránh nhầm lẫn khi code.

```sql
-- Nếu muốn merge spend → redeem:
UPDATE point_transactions SET type = 'redeem' WHERE type = 'spend';
ALTER TABLE point_transactions
  MODIFY COLUMN type ENUM('earn','redeem','expire','refund','adjust') NOT NULL;
```

---

### 5. `product_colors` Vẫn Rỗng Sau Khi Đã Có FK

`product_variants.color_id` đã được tạo FK → `product_colors`, nhưng bảng `product_colors` vẫn **hoàn toàn rỗng**. Toàn bộ 53 variants đang có `color_id = NULL`. FK đã đúng về cấu trúc nhưng chưa có data để hoạt động.

Cần seed data cho `product_colors` và update `color_id` trên các variants hiện có.

---

## 🟡 Index Còn Thiếu Từ Optimization Report Trước

Các index này **chưa được thêm vào**:

### Single-Column

```sql
CREATE INDEX idx_orders_voucher_code   ON orders     (voucher_code);
CREATE INDEX idx_orders_payment_method ON orders     (payment_method);
CREATE INDEX idx_shipments_status      ON shipments  (status);
CREATE INDEX idx_gift_cards_status     ON gift_cards (status);
CREATE INDEX idx_news_status           ON news       (status);
CREATE INDEX idx_news_published_at     ON news       (published_at);
CREATE INDEX idx_user_addr_default     ON user_addresses (user_id, is_default);
CREATE INDEX idx_product_images_main   ON product_images (product_id, is_main);
```

### Composite

```sql
-- Lịch sử điểm user — hiện chỉ có idx_pt_user(user_id) đơn
CREATE INDEX idx_pt_user_time
  ON point_transactions (user_id, created_at DESC);

-- Check user đã dùng coupon chưa — hiện full scan
CREATE INDEX idx_coupon_usage_check
  ON coupon_usage (user_id, coupon_id);

-- IPN callback lookup — hiện chỉ có đơn order_id
CREATE INDEX idx_transactions_order_status
  ON transactions (order_id, status);

-- security_logs — 4 index đơn thay vì 1 composite hiệu quả hơn
CREATE INDEX idx_security_event_time
  ON security_logs (event_type, created_at DESC);

-- coupons active query
CREATE INDEX idx_coupons_active
  ON coupons (deleted_at, ends_at);

-- inventory_logs theo sản phẩm
CREATE INDEX idx_inventory_logs_product
  ON inventory_logs (product_id, created_at DESC);
```

> **Lưu ý về `security_logs`:** Hiện có 4 index đơn riêng lẻ (`event_type`, `ip_address`, `user_id`, `created_at`). MySQL thường chỉ dùng 1 index per query — composite `(event_type, created_at DESC)` sẽ hiệu quả hơn cho query admin phổ biến nhất.

---

## 📊 Scorecard Tổng Thể

### Từ Migration Script (9 Steps)

| Step | Vấn Đề                                | Trạng Thái |
| ---- | ------------------------------------- | ---------- |
| 1    | enum `expire/refund/adjust`           | ✅ Done    |
| 2    | Duplicate index `user_id` pt          | ✅ Done    |
| 3    | `idx_tier_points` → `lifetime_points` | ✅ Done    |
| 4    | Drop `admin_audit_logs`               | ✅ Done    |
| 5    | Drop `role_permissions`               | ✅ Done    |
| 6    | Duplicate CHECK inventory             | ✅ Done    |
| 7    | Drop `users.is_admin`                 | ✅ Done    |
| 8    | Drop `users.accumulated_points`       | ✅ Done    |
| 9    | Fix `balance_after` data              | ✅ Done    |

### Từ Constraint & Optimization Report

| Hạng Mục                             | Trạng Thái          |
| ------------------------------------ | ------------------- |
| FK ON DELETE `transactions`          | 🔴 Chưa fix         |
| FK ON DELETE `refund_requests`       | 🔴 Chưa fix         |
| Duplicate `idx_sku` product_variants | 🔴 Chưa fix         |
| `idx_product_color` sai cột          | 🔴 Bug mới          |
| status columns NOT NULL              | 🟡 Chưa fix         |
| `product_colors` cần data            | 🟡 Pending          |
| `spend` vs `redeem` enum             | 🟡 Cần quyết định   |
| Index đơn còn thiếu (8 index)        | 🟡 Chưa thêm        |
| Composite index còn thiếu (6)        | 🟡 Chưa thêm        |
| `transactions` vẫn rỗng              | ⚠️ Cần kiểm tra IPN |
| `product_reviews` composite          | ✅ Done tốt         |
| `order_items` NOT NULL               | ✅ Done             |
| Architecture loyalty dual-points     | ✅ Done             |
| Color FK → `product_colors`          | ✅ Done             |

---

## 📋 Next Steps — Thứ Tự Ưu Tiên

```
🔴 Ngay bây giờ (schema correctness):
   1. Fix FK ON DELETE → transactions + refund_requests
   2. Drop idx_sku duplicate trên product_variants
   3. Fix idx_product_color trỏ vào (product_id, color_id)
   4. Quyết định spend vs redeem enum

🟡 Sprint tới (performance):
   5. Thêm 6 composite indexes còn thiếu
   6. Thêm 8 single-column indexes còn thiếu
   7. Fix 3 status columns → NOT NULL

🟢 Data + logic:
   8. Seed product_colors + update color_id trên variants
   9. Kiểm tra VNPay/MoMo IPN → transactions vẫn rỗng
  10. Update API earn/redeem để điền source + source_id
```

---

_Reviewed: 2026-03-06 16:51 · TOAN Store v2.12.0 · Migrations: 10/10 applied_
