# BÁO CÁO ĐÁNH GIÁ CHUYÊN SÂU HỆ THỐNG CƠ SỞ DỮ LIỆU

> **Dự án**: Nike Clone
> **Trạng thái**: Review & Optimization Phase
> **File gốc**: `reportdatabse.md` (Đề xuất đổi tên thành `DATABASE_TECHNICAL_REVIEW.md`)

---

## 📊 1. TỔNG QUAN HỆ THỐNG

| Thông số | Chi tiết |
| :--- | :--- |
| **Database Engine** | MySQL 9.2.0 (InnoDB) |
| **Quy mô** | ~55 Bảng (Tables) |
| **Kiến trúc** | Phân tán theo Module (Decentralized Modules) |
| **Đánh giá tổng quát** | **Khá (3.8/5.0)** - Cấu trúc nền tảng vững chắc nhưng cần tối ưu hiệu năng và tính nhất quán. |

---

## ✅ 2. CÁC ĐIỂM MẠNH (STRENGTHS)

### 2.1 Thiết kế Module hóa (Modular Design)
Hệ thống được tổ chức thành các nhóm chức năng độc lập, giúp dễ dàng mở rộng:
- **Quản trị**: `admin_users`, `admin_activity_logs`.
- **Sản phẩm & Kho**: `products`, `product_variants`, `inventory`.
- **Kinh doanh**: `orders`, `order_items`, `payments`.
- **Tiếp thị**: `coupons`, `flash_sales`, `gift_cards`.

### 2.2 Quy trình Đơn hàng (Order Workflow)
Bảng `orders` được thiết kế rất chi tiết, hỗ trợ đầy đủ các kịch bản thực tế:
- **Địa chỉ**: Snapshot địa chỉ giao hàng (ngăn lỗi khi người dùng đổi địa chỉ sau khi đặt).
- **Trạng thái**: 8 giai đoạn từ `pending` đến `delivered`/`cancelled`.
- **Thanh toán**: Tích hợp linh hoạt nhiều phương thức.

### 2.3 Khả năng mở rộng Biến thể (Variants Handling)
Việc sử dụng `product_variants` kết hợp với cột `attributes` (JSON) cho phép hệ thống lưu trữ không giới hạn các thuộc tính sản phẩm (Size, Color, Width, Material) mà không cần thay đổi schema.

---

## ⚠️ 3. CÁC VẤN ĐỀ CẦN CẢI THIỆN (WEAKNESSES)

### 3.1 Sự dư thừa dữ liệu (Data Redundancy)
> [!WARNING]
> Bảng `product_sizes` hiện đang tồn tại song song với hệ thống `inventory` và `product_variants`. Điều này gây lãng phí bộ nhớ và tiềm ẩn nguy cơ sai lệch dữ liệu (Data Inconsistency).

### 3.2 Thiếu nhất quán trong Naming Convention
- **Cờ trạng thái**: Một số bảng dùng `is_active` (tinyint), số khác dùng `status` (enum).
- **JSON keys**: Có sự pha trộn giữa `snake_case` và `camelCase`.

### 3.3 Lỗ hổng Bảo mật dữ liệu nhạy cảm
- **Mã PIN**: Cột `gift_cards.pin` hiện lưu trữ dưới dạng văn bản thuần (Plaintext).
- **Log**: Cần đảm bảo `old_values` và `new_values` trong `admin_activity_logs` được che (mask) các trường nhạy cảm như mật khẩu.

---

## 🛠️ 4. KHUYẾN NGHỊ TỐI ƯU (RECOMMENDATIONS)

### 4.1 Tối ưu hiệu năng (Performance Tuning)
Cần bổ sung các Index cho các truy vấn báo cáo và lọc dữ liệu:

```sql
-- Tối ưu truy vấn danh sách đơn hàng cho Admin
ALTER TABLE orders ADD INDEX idx_status_placed (status, placed_at);

-- Tối ưu lọc sản phẩm theo danh mục và trạng thái
ALTER TABLE products ADD INDEX idx_category_active (category_id, is_active);

-- Tối ưu tìm kiếm văn bản (Full-text Search) cho tên sản phẩm
ALTER TABLE products ADD FULLTEXT INDEX ft_product_name (name);
```

### 4.2 Tăng cường ràng buộc dữ liệu (Data Integrity)
Bổ sung `CHECK` constraints để đảm bảo tính hợp lệ của số liệu:

```sql
-- Đảm bảo tồn kho không bao giờ âm
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0);

-- Đảm bảo giá trị Gift Card hợp lý
ALTER TABLE gift_cards ADD CONSTRAINT chk_giftcard_balance CHECK (current_balance <= initial_balance);
```

### 4.3 Phân đoạn dữ liệu (Data Partitioning)
Với quy mô đơn hàng tăng trưởng nhanh, nên áp dụng Partitioning cho bảng `orders` theo thời gian:

```sql
ALTER TABLE orders PARTITION BY RANGE (YEAR(placed_at)) (
    PARTITION p_old VALUES LESS THAN (2025),
    PARTITION p_current VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## 🚀 5. LỘ TRÌNH THỰC HIỆN (ROADMAP)

### Giai đoạn 1: Dọn dẹp & Bảo mật (1-2 tuần)
- [ ] Loại bỏ bảng `product_sizes` sau khi đã migrate toàn bộ stock sang `inventory`.
- [ ] Mã hóa cột `pin` trong bảng `gift_cards`.
- [ ] Áp dụng các Index quan trọng đã nêu ở mục 4.1.

### Giai đoạn 2: Chuẩn hóa & RBAC (3-4 tuần)
- [ ] Khởi chạy hệ thống phân quyền thực tế qua bảng `user_roles` và `permissions` (thay vì chỉ dùng cờ `is_admin`).
- [ ] Chuẩn hóa lại các cột `is_active` về một chuẩn `status` duy nhất.

### Giai đoạn 3: Mở rộng tính năng (Dài hạn)
- [ ] Triển khai bảng `price_history` để theo dõi biến động giá sản phẩm.
- [ ] Thêm hệ thống `notifications` lưu trữ lịch sử thông báo cho người dùng.

---
**Người thực hiện**: AI Assistant & User Team
**Ngày phê duyệt**: .../.../2026