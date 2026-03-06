# Database Audit Report — `toan_store`

> Generated: 2026-03-06 | Scope: SQL Dump + API-DOCS + DATABASE.md + SECURITY.md + README.md + CHANGELOG.md + DEPLOYMENT.md + openapi.yaml

---

## 0. Tóm tắt Executive

| Loại        | Số lượng |
| ----------- | -------- |
| 🔴 Critical | 4        |
| 🟠 High     | 6        |
| 🟡 Medium   | 7        |
| 🟢 Low      | 5        |
| **Tổng**    | **22**   |

---

## 1. Mâu thuẫn giữa Tài liệu và Thực tế (Documentation vs Reality)

### 1.1 Số lượng bảng sai lệch — 🟠 High

README.md và DATABASE.md đều ghi **"83 tables"** nhưng SQL dump thực tế chỉ có **52 bảng** được tạo. Số lượng này không khớp ở bất kỳ cách đếm nào.

### 1.2 `admin_audit_logs` vs `admin_activity_logs` — 🔴 Critical

Đây là mâu thuẫn nghiêm trọng nhất xuyên suốt toàn bộ tài liệu:

| Nguồn                | Tên bảng dùng                                         |
| -------------------- | ----------------------------------------------------- |
| SQL Dump (thực tế)   | `admin_activity_logs` (có 29 records, đang hoạt động) |
| DATABASE.md          | `admin_audit_logs`                                    |
| SECURITY.md          | `admin_audit_logs`                                    |
| API-DOCS.md          | `admin_audit_logs`                                    |
| CHANGELOG.md [2.2.0] | `admin_audit_logs`                                    |

Tên khác nhau hoàn toàn. Code đang ghi vào `admin_activity_logs`, tài liệu mô tả `admin_audit_logs`. Nếu có logic nào đọc từ tên sai sẽ trả về rỗng.

Schema trong DATABASE.md cũng sai — mô tả cột `admin_id`, `target_type`, `target_id` nhưng thực tế bảng có `admin_user_id`, `entity_type`, `entity_id`, `old_values`, `new_values`.

### 1.3 `users.accumulated_points` không tồn tại — 🔴 Critical

DATABASE.md mô tả cột `accumulated_points` trong bảng `users`, nhưng SQL dump thực tế có **hai cột khác**:

- `lifetime_points` — tổng điểm tích lũy từ trước đến nay
- `available_points` — điểm hiện có thể dùng

Đây không phải rename đơn giản — đây là hai trường có ý nghĩa khác nhau. Tài liệu đang mô tả sai hoàn toàn cấu trúc loyalty points.

### 1.4 `product_variants` schema sai — 🟠 High

DATABASE.md mô tả `product_variants` có cột `color_id FK→product_colors`, nhưng SQL dump thực tế:

```sql
-- Thực tế:
`color` VARCHAR(100)  -- lưu string trực tiếp, không phải FK

-- DATABASE.md mô tả:
color_id  BIGINT FK→product_colors
```

Bảng `product_colors` tồn tại trong DB nhưng **rỗng hoàn toàn** và không có FK nào từ `product_variants` trỏ vào nó.

### 1.5 `users.phone` type sai trong tài liệu — 🟡 Medium

DATABASE.md ghi `phone VARCHAR(50)` nhưng thực tế là `VARCHAR(255)` — cần đủ dài để chứa cipher text AES-256-GCM.

### 1.6 `user_addresses.receiver_name` không tồn tại — 🟡 Medium

DATABASE.md dùng tên cột `receiver_name`, SQL dump thực tế là `recipient_name` và `recipient_name_encrypted`.

### 1.7 `news.author_id` FK sai — 🟡 Medium

CHANGELOG.md [2.11.0] ghi rõ: _"Chuyển FK `author_id` từ bảng `users` sang `admin_users`"_. Nhưng SQL dump vẫn là:

```sql
CONSTRAINT news_ibfk_1 FOREIGN KEY (author_id) REFERENCES users(id)
```

Migration này chưa được áp dụng vào DB thực tế. Tác giả bài viết ID=3 trong `news` trỏ đến `users.id=3` (admin@nike.com), không phải `admin_users`.

### 1.8 `point_transactions` thiếu field `refund` type — 🟡 Medium

CHANGELOG.md [2.2.0] mô tả type `'refund'` cho reversal khi hủy đơn. DATABASE.md schema ghi `ENUM('earn','spend','expire')`. SQL dump thực tế cột `type` là `ENUM('earn','spend','expire','refund','adjust')` — tài liệu DATABASE.md bị lỗi thời.

### 1.9 README ghi "148+ API Routes" — 🟢 Low

API-DOCS.md liệt kê khoảng 110+ endpoints. openapi.yaml chỉ định nghĩa ~30 paths. Ba nguồn không thống nhất.

---

## 2. Vấn đề Cấu trúc Database (Structural Issues)

### 2.1 Dual Inventory System — 🔴 Critical

Hệ thống đang tồn tại **hai bảng quản lý tồn kho song song** không đồng bộ:

| Bảng            | Cơ chế                                                      | Tình trạng                                     |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `product_sizes` | `stock`, `reserved` trực tiếp                               | 48 records, data từ 2025-12-06, không cập nhật |
| `inventory`     | `quantity`, `reserved` gắn `product_variants` + `warehouse` | Hệ thống chính, đang hoạt động                 |

`order_items` có cột `inventory_id` nhưng 49/51 records có giá trị `NULL` — các đơn hàng cũ không link được inventory, mất khả năng truy vết stock movement.

README mô tả _"Multi-Warehouse Inventory"_ nhưng 100% inventory records đang dùng `warehouse_id=1` (Kho Hà Nội). Warehouse 2 (TP.HCM) không có tồn kho nào.

### 2.2 Dual Auth System — 🟠 High

`admin_users` có cả `role` (enum) lẫn `role_id` (FK→roles). Thực tế:

- `admin_users.role = 'super_admin'` — enum đang được dùng
- `admin_users.role_id = 4` — FK đến `roles.id=4` cũng là 'super_admin'
- Bảng `user_roles` hoàn toàn rỗng
- Customer users không được assign role qua `user_roles` bao giờ

SECURITY.md mô tả RBAC qua `withPermission()` nhưng cơ chế thực thi vẫn dựa trên `admin_users.role` enum.

### 2.3 Gift Card PIN — ba cơ chế hash — 🔴 Critical

```sql
-- Plaintext (seed data cũ, vẫn trong DB):
(2,  '2345678901234567', '2345', ...)
(9,  '1234567890123456', '1234', ...)
(11, '1111222233334444', '9999', ...)

-- bcrypt hash:
(14, '6969696969696969', '$2b$10$RXx...', ...)

-- Custom cipher (hex):
(15, '9696969696969696', 'c74ee807934c21b9...', ...)
```

SECURITY.md khẳng định _"Gift Card PINs — Bcrypt"_ nhưng thực tế có 3 cơ chế. Seed data với PIN plaintext vẫn tồn tại trong production DB.

### 2.4 Thiếu Foreign Key — `vouchers.issued_by_user_id` — 🟡 Medium

```sql
-- Cột tồn tại nhưng không có FK constraint:
issued_by_user_id  BIGINT UNSIGNED DEFAULT NULL
-- Không có: FOREIGN KEY (issued_by_user_id) REFERENCES admin_users(id)
```

### 2.5 `orders` — Phone lưu 3 lần — 🟡 Medium

```sql
phone                     -- luôn là '***'
phone_encrypted           -- AES cipher
shipping_phone_encrypted  -- AES cipher (trong shipping_address_snapshot JSON cũng có phone encrypted)
```

Cùng thông tin phone được encrypt và lưu ở hai cột riêng biệt, cộng thêm một bản trong JSON blob.

---

## 3. Vấn đề Dữ liệu (Data Quality)

### 3.1 `product_variants` giá = 0 — 🟠 High

Product ID=7 (Nike Mercurial Vapor 16 Elite, giá niêm yết 7,319,000₫) có 5 variants với `price = 0.00`. SECURITY.md đề cập _"Price Guard — Server-side price calculation"_ nhưng không rõ fallback khi variant price = 0.

### 3.2 `product_variants` SKU = NULL — 🟡 Medium

Toàn bộ 5 variants của product_id=7 có `sku = NULL`. Index `UNIQUE KEY sku` cho phép nhiều NULL nên không báo lỗi DB, nhưng sẽ lỗi nếu logic lookup theo SKU.

### 3.3 `daily_metrics` cron đã ngừng — 🟡 Medium

Chỉ có dữ liệu 8 ngày (2026-02-07 đến 2026-02-14), sau đó dừng hẳn. CHANGELOG.md [2.3.0] đề cập _"Daily Metrics Aggregation"_ và DEPLOYMENT.md có hướng dẫn chạy `aggregate-metrics.ts`, nhưng cron này đang không chạy.

### 3.4 Test accounts trong production DB — 🟡 Medium

~28/34 users có email pattern `test_verification_177XXXXXXX@test.com` và `testuser_XXXX@example.com` từ E2E automation. Các test orders (TEST-ORD-_, TEST-EMAIL-_) cũng còn trong bảng `orders`.

### 3.5 Tax tính trên subtotal gốc — 🟡 Medium

```sql
-- Logic hiện tại: tax = subtotal * 10%  (trước discount)
-- Order NK1769775001613:
subtotal=3,829,000 → tax=382,900  (10% của subtotal gốc)
total = subtotal - discount + tax = 3,111,900
```

Tax tính trên subtotal trước giảm giá thay vì sau giảm giá. Không sai nếu là business decision nhưng không được document ở bất kỳ đâu.

---

## 4. Bảng Không Dùng / Dư Thừa

| Bảng                        | Records | Phân loại                          | Khuyến nghị |
| --------------------------- | ------- | ---------------------------------- | ----------- |
| `user_roles`                | 0       | Unused                             | Drop        |
| `user_sessions`             | 0       | Unused (dùng JWT)                  | Drop        |
| `payments`                  | 0       | Unused (`transactions` mới dùng)   | Drop        |
| `stock_reservations`        | 0       | Unused (dùng `inventory.reserved`) | Drop        |
| `transactions`              | 0       | MoMo/VNPay chưa có key             | Giữ         |
| `data_requests`             | 0       | GDPR — chưa implement              | Giữ         |
| `cookie_consents`           | 0       | GDPR — chưa implement              | Giữ         |
| `user_consents`             | 0       | GDPR — chưa implement              | Giữ         |
| `product_embeddings`        | 0       | AI Search — chưa có data           | Giữ         |
| `inventory_transfers`       | 0       | Feature chưa dùng                  | Giữ         |
| `attribute_options`         | 0       | Feature chưa dùng                  | Giữ         |
| `attribute_values`          | 0       | Feature chưa dùng                  | Giữ         |
| `product_attribute_values`  | 0       | Feature chưa dùng                  | Giữ         |
| `product_gender_categories` | 0       | Feature chưa dùng                  | Giữ         |
| `product_colors`            | 0       | Feature chưa dùng                  | Giữ         |

---

## 5. Index Issues

### 5.1 Duplicate Index trong `flash_sales` — 🟢 Low

```sql
KEY idx_active_time  (is_active, start_time, end_time)
KEY idx_active_dates (is_active, start_time, end_time)
-- Hai index giống hệt nhau
ALTER TABLE flash_sales DROP INDEX idx_active_time;
```

### 5.2 Thiếu Composite Index — 🟢 Low

```sql
-- Voucher lookup theo recipient + status thường xuyên
ALTER TABLE vouchers
  ADD INDEX idx_recipient_status (recipient_user_id, status, valid_until);

-- Point transaction lookup theo source
ALTER TABLE point_transactions
  ADD INDEX idx_source (source, source_id);
```

---

## 6. Vấn đề Tài liệu Thuần (Docs-only Issues)

### 6.1 openapi.yaml thiếu ~80% endpoints — 🟢 Low

openapi.yaml chỉ định nghĩa ~30 paths trong khi API-DOCS.md có 110+ endpoints. Spec không thể dùng để generate client SDK hay test tự động.

### 6.2 SECURITY.md "Known Limitations" đã cũ — 🟢 Low

Một số issue được đánh dấu ✅ Fixed nhưng một số mô tả không còn chính xác với code hiện tại (ví dụ: "Orders JS Pagination" đã được fix trong CHANGELOG [2.12.0] nhưng vẫn còn trong Known Limitations).

---

## 7. Tóm tắt theo Mức độ Ưu tiên

| #   | Vấn đề                                              | Mức độ      | Action                                                          |
| --- | --------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| 1   | `admin_activity_logs` vs `admin_audit_logs`         | 🔴 Critical | Đồng bộ tên bảng + schema trong tài liệu                        |
| 2   | `accumulated_points` vs `lifetime/available_points` | 🔴 Critical | Cập nhật DATABASE.md                                            |
| 3   | Dual inventory (`product_sizes` + `inventory`)      | 🔴 Critical | Migrate & drop `product_sizes`                                  |
| 4   | Gift Card PIN — 3 cơ chế hash                       | 🔴 Critical | Re-hash toàn bộ seed data bằng bcrypt                           |
| 5   | `product_variants.color_id` vs `color` string       | 🟠 High     | Fix DATABASE.md hoặc migrate schema                             |
| 6   | `news.author_id` FK chưa migrate sang `admin_users` | 🟠 High     | Chạy migration theo CHANGELOG [2.11.0]                          |
| 7   | Product variant giá = 0                             | 🟠 High     | Fix data + thêm CHECK constraint                                |
| 8   | Dual auth system (enum + FK)                        | 🟠 High     | Chọn một cơ chế, xóa cái còn lại                                |
| 9   | Số bảng sai (README: 83 vs thực tế: 52)             | 🟠 High     | Đếm lại và cập nhật README                                      |
| 10  | `user_addresses.receiver_name` vs `recipient_name`  | 🟡 Medium   | Cập nhật DATABASE.md                                            |
| 11  | `point_transactions` type `refund` thiếu trong docs | 🟡 Medium   | Cập nhật DATABASE.md                                            |
| 12  | `orders` phone lưu 3 lần                            | 🟡 Medium   | Remove cột duplicate                                            |
| 13  | `daily_metrics` cron đã ngừng                       | 🟡 Medium   | Restart cron                                                    |
| 14  | `vouchers.issued_by_user_id` thiếu FK               | 🟡 Medium   | Thêm FK constraint                                              |
| 15  | Tax logic không được document                       | 🟡 Medium   | Thêm comment vào code + docs                                    |
| 16  | Test accounts/orders trong production               | 🟡 Medium   | Soft-delete hoặc tag                                            |
| 17  | Product variant SKU = NULL                          | 🟡 Medium   | Sinh SKU cho product_id=7                                       |
| 18  | Multi-Warehouse chỉ dùng 1 kho                      | 🟡 Medium   | Document hoặc populate warehouse 2                              |
| 19  | Duplicate index `flash_sales`                       | 🟢 Low      | Drop 1 index                                                    |
| 20  | Thiếu composite index                               | 🟢 Low      | Thêm 2 index theo mục 5.2                                       |
| 21  | Drop 4 bảng unused                                  | 🟢 Low      | `user_roles`, `user_sessions`, `payments`, `stock_reservations` |
| 22  | openapi.yaml thiếu 80% endpoints                    | 🟢 Low      | Bổ sung spec hoặc dùng JSDoc làm source-of-truth                |
