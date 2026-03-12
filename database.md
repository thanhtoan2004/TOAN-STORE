# 🗄️ Báo Cáo Kiểm Tra Database — `toan_store` (ĐÃ CẬP NHẬT)

> **Ngày kiểm tra:** 12/03/2026  
> **Trạng thái:** 🟢 PRODUCTION READY (Sau khi fix các lỗi Critical)  
> **Số bảng:** 81 bảng | **Số Migration:** 47

---

## 1. 🟢 Các vấn đề đã xử lý (Fixed)

### 1.1 Bảo mật PII (Critical)

- **Email Masking:** Cột `users.email` đã được che dấu thông tin thô (Masking).
- **Security Logs:** Toàn bộ log bảo mật hiện chuyển sang dùng `email_hash` (Blind Index), không còn lộ email plaintext trong JSON.
- **Admin Hardening:** Tài khoản `manager` đã được khóa cứng (Disabled) và đổi mật khẩu hệ thống ngẫu nhiên.

### 1.2 Tính toán Tài chính & Lưu kho (High)

- **Order Tax:** Đã fix lỗi bỏ sót thuế VAT khi lưu đơn hàng tại `order.ts`.
- **Negative Stock:** Đã cài đặt Trigger `trg_inventory_before_update` chặn tồn kho âm trực tiếp từ tầng Database.
- **Voucher Auto-Sync:** Thêm trigger tự chuyển trạng thái Voucher khi đơn hàng hoàn tất.

### 1.3 Hiệu năng & Dữ liệu (Medium)

- **Cost Backfill:** Đã khôi phục giá vốn (`cost_price`) cho các đơn hàng cũ để tính lợi nhuận ròng chính xác trong Dashboard.
- **Index Optimization:** Bổ sung `idx_order_id` cho bảng `gift_card_transactions` và `idx_event_type` cho `security_logs`.

---

## 2. ⚠️ Các vấn đề còn tồn đọng (Low Priority)

| Vấn đề                   | Chi tiết                                                                                                 | Khuyến nghị                                                               |
| :----------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Archive Tables**       | Các bảng `archive_*` hiện đang trống.                                                                    | Cần cài đặt Cron Job chạy hàng tháng để đẩy dữ liệu cũ (> 1 năm) vào đây. |
| **Inconsistent metrics** | Dữ liệu `daily_metrics` có thể sai lệch nếu Admin sửa đơn hàng trực tiếp bằng Tool SQL mà không qua API. | Luôn sử dụng CMS/Admin Dashboard để cập nhật đơn hàng.                    |
| **Tax Rate Sync**        | Tỉ lệ Thuế (10%) đang được hardcode trong một số logic UI.                                               | Nên đồng bộ hóa việc lấy giá trị từ bảng `settings` (key: `tax_rate`).    |

---

## 3. 📊 Thống kê Schema

- **Core Tables:** `users`, `products`, `orders`, `inventory`.
- **Archive Tables:** 5 bảng (Hỗ trợ lưu trữ dữ liệu lịch sử).
- **Security Check:**
  - Password Hashing: Bcrypt (Verified)
  - PII Encryption: AES-256-GCM (Verified)
  - SQL Injection Defense: Parameterized Queries (Verified)

**Người kiểm tra:** Antigravity AI  
**Kết luận:** Hệ thống database đã được vá lỗi và đạt chuẩn an toàn để vận hành thực tế.
