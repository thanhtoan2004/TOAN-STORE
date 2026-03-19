# Security Documentation

Tài liệu bảo mật cho TOAN Store E-commerce. Dự án đã đạt chứng chỉ **Enterprise Grade (Level 3/3)** với điểm kiểm duyệt **10/10**.

---

## 🔐 Authentication Architecture

### JWT Token System

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Client    │──────▶│  Auth API    │──────▶│  MySQL DB  │
│  (Browser)  │      │              │      │            │
│  Cookies:   │      │              │      │  Verify    │
│  - auth     │      └──────┬───────┘      └────────────┘
│  - admin    │             │              (JWT is verified centrally
│  - refresh  │      ┌──────▼───────┐       at Edge Middleware for Admin
│             │      │    Redis     │       with maxTokenAge, issuer,
│             │      │  Refresh     │       audience, and strict fallbacks)
│             │      │  Token Store │
│             │      └──────────────┘
└─────────────┘
```

### Token Types

| Token                | Cookie Name          | Purpose                  | Expiry |
| -------------------- | -------------------- | ------------------------ | ------ |
| Access Token (User)  | `toan_auth_session`  | API authentication       | 15 min |
| Access Token (Admin) | `toan_admin_session` | Admin API authentication | 15 min |
| Refresh Token        | `toan_refresh_token` | Renew access tokens      | 7 days |

### Session Isolation

- User tokens và Admin tokens tách biệt hoàn toàn
- Admin middleware verify JWT signature (không chỉ check cookie)
- Refresh Token rotation: mỗi lần refresh tạo token mới, token cũ bị revoke

### Token Security

- **Token Versioning (tv)**: Lưu `token_version` trong database. Khi đổi mật khẩu hoặc "Đăng xuất tất cả thiết bị", version này tăng lên -> làm tất cả JWT cũ (access/refresh) trở nên vô hiệu ngay cả khi còn hạn.
- **Production Enforcement**: `JWT_SECRET` bắt buộc phải set trong production, app crash nếu thiếu

### Multi-Factor Authentication (MFA/2FA)

- **Email OTP**: Sử dụng mã OTP 6 số gửi qua email (TTL 5 phút).
- **Redis Scoping**: OTP được lưu trong Redis với prefix `2fa:otp:{userId}` để đảm bảo tốc độ và tự động hết hạn.
- **Graceful Migration**: Người dùng cũ được tự động gán trạng thái 2FA mặc định nhưng có thể tùy chỉnh tắt/bật trong Settings.

### Role-Based Access Control (RBAC)

- **Granular Permissions**: Chuyển đổi từ logic check role cứng (`admin`/`super_admin`) sang hệ thống quyền hạn linh hoạt (`permissions`).
- **Higher-Order Protection**: Sử dụng `withPermission(permissionName, handler)` để bao bọc các API routes, đảm bảo tính nhất quán và dễ mở rộng.
- **Default Super Admin**: Role `super_admin` tự động có quyền `all`, bypass mọi kiểm tra quyền cụ thể.
- **Permission Mapping**:
  | Action | Permission Required |
  |--------|---------------------|
  | Quản lý kho | `manage:inventory` |
  | Quản lý đơn hàng | `manage:orders` |
  | Xem báo cáo | `view:reports` |
  | Quản lý người dùng | `manage:users` |
  | Quản lý hệ thống (Settings/Admins/Audit) | `super_admin` role required |
  | Toàn quyền | `all` |

### Super Admin Restricted Actions

Một số hành động đặc biệt nhạy cảm chỉ được thực hiện bởi tài khoản có role `Super Admin`:

- **Quản lý cài đặt hệ thống (Settings):** Chỉnh sửa phí ship, thuế, phí gói quà, v.v.
- **Quản lý nhân sự (Admins):** Thêm, sửa, xóa hoặc đổi trạng thái các tài khoản Admin khác.
- **Truy cập Audit Logs:** Xem toàn bộ lịch sử thao tác của các nhân viên khác.

---

## 🛡️ Data Protection

### Data Protection (Dữ liệu cá nhân)

- **PII Encryption**: Các cột nhạy cảm (`email_encrypted`, `phone_encrypted`, `address_encrypted`) được mã hóa bằng **AES-256-GCM** ở tầng ứng dụng trước khi lưu vào DB.
- **Gift Card Security**:
  - PIN được băm bằng **Bcrypt**.
  - Số thẻ (Card Number) chỉ lưu **Hash (SHA-256)** để tra cứu và **Last 4 digits** để hiển thị.
  - **Policy**: Do không lưu số thẻ gốc, nếu người dùng quên số thẻ, hệ thống không thể khôi phục trực tiếp. Quản trị viên có quyền cấp lại thẻ mới hoặc hủy thẻ cũ dựa trên Proof of Purchase.

### Encryption at Rest

| Data            | Method                       | Details                                                                       |
| --------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Passwords       | **Bcrypt** (salt rounds: 10) | One-way hash                                                                  |
| Gift Card PINs  | **Bcrypt**                   | One-way hash (High security, prevents internal PIN theft)                     |
| Email addresses | **AES-256-GCM**              | PII Protection: stored in `email_encrypted` columns, raw columns masked `***` |
| Phone numbers   | **AES-256-GCM**              | PII Protection: stored in `phone_encrypted` columns, raw columns masked `***` |
| Addresses       | **AES-256-GCM**              | PII Protection: stored in `address_line_encrypted` and address snapshots      |

### Double Column Encryption Strategy

Để đảm bảo an toàn tối đa cho dữ liệu PII (Personally Identifiable Information), hệ thống áp dụng chiến lược **Double Column**:

1. **Dữ liệu thật**: Được mã hóa bằng `AES-256-GCM` (Authenticated Encryption) và lưu vào các cột riêng biệt có postfix `_encrypted` (ví dụ: `phone_encrypted`).
2. **Cột hiển thị (Masked)**: Các cột nguyên bản (ví dụ: `phone`) sẽ được dập nhãn `***`. Điều này ngăn chặn việc dữ liệu nhạy cảm vô tình bị leak ra Logs hoặc giao diện nếu Developer quên che giấu.
3. **Decryption on Demand**: Dữ liệu chỉ được giải mã tại tầng [Repository](src/lib/db/repositories/) khi thực sự cần xử lý.

### Encryption Error Handling

- `encrypt()` → **Throw error** nếu thất bại (không bao giờ lưu plaintext)
- `decrypt()` → Return plaintext fallback nếu thất bại (backward compatibility với data cũ hoặc dữ liệu không chứa định dạng mã hóa `IV:AUTH_TAG:DATA`)

---

## 🚧 Input Validation

### Registration

| Field              | Validation                       | After Audit |
| ------------------ | -------------------------------- | ----------- |
| email              | Required, regex format check     | ✅ Fixed    |
| password           | Required, min 6 characters       | ✅ Fixed    |
| firstName/lastName | Strip HTML tags (XSS prevention) | ✅ Fixed    |

### API-level & Database-level Validations

- **Numeric ranges**: Giá không âm.
- **Strict Negative Inventory Protection**: Database schema thực thi cứng `CHECK (quantity >= 0)` trên bảng `inventory` để ngăn chặn chênh lệch giữa các Race Conditions mua hàng.
- **Status whitelists**: Order status, Review status chỉ chấp nhận giá trị hợp lệ.
- **Ownership checks**: Mỗi resource kiểm tra thuộc về user hiện tại (IDOR prevention).
- **SQL Parameterization**: 100% queries sử dụng parameterized statements.
- **Database Safety Triggers**:
  - `trg_inventory_before_insert`: Kiểm tra chặn số lượng âm trước khi thêm bản ghi kho mới.
  - `trg_inventory_before_update`: Đảm bảo `quantity >= 0` và `reserved <= quantity` trong mọi giao dịch cập nhật kho, ngăn chặn Race Condition làm sai lệch tồn kho thực tế.
- **Code Quality & Reliability**: Đạt 100% ESLint compliance, quy chuẩn hóa `const` cho toàn bộ logic nghiệp vụ, giảm thiểu rủi ro lỗi gán biến và side-effects ngoài ý muốn.

### IDOR Prevention (Phase 63.2)

| Resource                | Protection                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| Cart Items (PUT/DELETE) | `cart_items JOIN carts WHERE c.user_id = ?` — kiểm tra ownership tại database |
| Orders (GET/PUT/DELETE) | `order.user_id === session.userId`                                            |
| Review Purchase Check   | Session-based `userId` (không nhận từ query param)                            |
| Promo Code History      | Non-admin chỉ xem lịch sử của mình, admin có full access                      |

---

## 🔒 Request Security

### CSRF Protection (Enterprise Target Strict Match)

- Origin/Host matching tuyệt đối 100% (`===`) cho mutating requests (POST, PUT, PATCH, DELETE)
- Loại bỏ các ngoại lệ lách luật bằng Header `X-Requested-With`. Origin phải trùng khớp hoàn toàn trên Production.
- Đi kèm bảo mật SameSite Cookie.

### Response Standardization (`ResponseWrapper`)

Toàn bộ hệ thống API sử dụng một lớp bao bọc duy nhất `ResponseWrapper` để đảm bảo:

- **Consistent Structure:** Mọi phản hồi đều cùng một định dạng (JSON).
- **Safe Error Handling:** Không rò rỉ stack trace khi xảy ra lỗi server (500). Tự động log lỗi vào hệ thống log tập trung (Pino/Sentry).
- **Standardized Status Codes:** Tuân thủ chuẩn 401 (Unauthorized), 403 (Forbidden), 429 (Rate Limit) cho mọi module.

### Rate Limiting

| Endpoint Group          | Limit        | Window   |
| ----------------------- | ------------ | -------- |
| Auth (login/register)   | 5 requests   | 1 minute |
| General API             | 100 requests | 1 minute |
| Payment                 | 10 requests  | 1 minute |
| Forgot Password         | 3 requests   | 1 minute |
| Newsletter Subscribe    | 5 requests   | 1 minute |
| Gift Card Check Balance | 10 requests  | 1 minute |
| Cart Gift Card Check    | Rate limited | Per IP   |

Implementation: **100% Redis-backed sliding window**. Không còn phụ thuộc vào bảng `rate_limits` của MySQL để đạt tốc độ xử lý lớn nhất.

- **Fail-Closed**: Với các tag nhạy cảm (`auth`, `admin`, `payment`), hệ thống sẽ **chặn** request nếu Redis lỗi.
- **Fail-Open**: Với các API thông thường (GET products), hệ thống sẽ cho phép đi qua.

### Security Headers (Anti-Spectre & XSS Hardened)

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://maps.googleapis.com; connect-src 'self' https://maps.googleapis.com https://api.toanstore.com; object-src 'none'; frame-ancestors 'none'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (prod only)
```

---

## 💰 Business Logic Security

### Price Guard

- Server-side price calculation cho mọi đơn hàng
- Không tin tưởng giá từ client
- Membership discount tính ở server

### Order State Machine

- Centralized transition rules trong `src/lib/order-logic.ts`
- Validate mọi transition trước khi thực hiện
- Không cho phép quay về trạng thái trước (ngoại trừ `cancelled`)
- Terminal states: `cancelled`, `refunded` — không thể thay đổi

### Payment IPN Security

- **VNPay**: Verify checksum bằng `vnp_SecureHash`
- **MoMo**: Verify signature bằng HMAC SHA256
- **Atomicity**: Cả VNPay và MoMo IPN đều được bọc trong **Database Transaction**.
- **Idempotency**: Sử dụng `FOR UPDATE` (Pessimistic Locking) để kiểm tra `transactions.status` trước khi xử lý, ngăn chặn race condition.
- **Amount Verification**: So sánh số tiền IPN với đơn hàng

### Stock Integrity

- **Pessimistic Locking**: `SELECT ... FOR UPDATE` cho stock operations
- **Reservation System**: Stock reserved khi đặt hàng, finalized khi thanh toán
- **Auto-release**: CRON job cleanup expired reservations
- **Flash Sale Limits**: Per-user purchase limits enforced server-side

### Point Redemption Transaction Security

- **DB Transaction + Pessimistic Locking**: Đổi điểm sử dụng `SELECT FOR UPDATE` trên cả bảng `users` và `vouchers` để ngăn Race Condition (2 request đồng thời trừ điểm).
- **Validate**: voucherId phải là số nguyên dương, user không bị banned/xóa mềm.
- **Atomic Operations**: Trừ điểm → Ghi log → Gán voucher trong cùng 1 transaction (commit hoặc rollback toàn bộ).

### Bulk Import Security

- **File Size Limit**: Tối đa 5MB, chỉ chấp nhận `.xlsx/.xls/.csv`.
- **Row Limit**: Tối đa 500 sản phẩm/lần import.
- **Data Validation**: Giá không âm, tên tối đa 500 ký tự, tự sinh slug/SKU an toàn.
- **Audit Trail**: Ghi nhận Admin nào import, số lượng, tên file vào `admin_audit_logs`.

### Author Profile Privacy

- API công khai chỉ trả về `full_name`, `username`, `avatar_url`, `bio`, `role`.
- **Không bao giờ** trả về `email`, `password` hoặc bất kỳ thông tin nhạy cảm nào của Admin.

---

## 🔍 Audit Trail

### Admin Activity Logs

Mọi hành động admin được ghi nhận:

- Order status changes
- User ban/unban
- Product CRUD
- Flash Sale management
- Settings changes

### Inventory Logs

Mọi thay đổi tồn kho được ghi nhận:

- `reserve`: Đặt chỗ khi tạo đơn
- `finalize`: Xác nhận khi thanh toán
- `release`: Hồi kho khi hủy/hoàn trả
- `manual`: Admin chỉnh tay

---

## ⚠️ Known Limitations

| Issue                    | Severity | Status   | Description                                              |
| ------------------------ | -------- | -------- | -------------------------------------------------------- |
| Rate Limit Fail-Open     | MEDIUM   | ✅ Fixed | Đã chuyển sang Fail-Closed cho auth/payment/admin        |
| Cart Dual-Purpose POST   | MEDIUM   | Known    | POST `/api/cart` xử lý cả add-to-cart và gift card check |
| Orders JS Pagination     | MEDIUM   | ✅ Fixed | Đã chuyển sang SQL LIMIT/OFFSET để tối ưu memory         |
| Review ORDER BY          | LOW      | ✅ Fixed | Đã sử dụng whitelist mapping toàn bộ                     |
| CSRF Dev Mode            | LOW      | Known    | CSRF protection disabled trong development               |
| Debug Sentry Open        | HIGH     | ✅ Fixed | Đã thêm `checkAdminAuth` — chỉ admin truy cập được       |
| Cron Auth Bypass         | HIGH     | ✅ Fixed | Đã đổi logic: reject nếu `CRON_SECRET` chưa cấu hình     |
| Newsletter No Rate Limit | MEDIUM   | ✅ Fixed | Thêm rate limit 5 req/60s                                |
| Gift Card Brute Force    | MEDIUM   | ✅ Fixed | Thêm rate limit 10 req/60s                               |
| Promo Codes Data Leak    | LOW      | ✅ Fixed | Giới hạn fields trả về (ẩn discount_value, usage_limit)  |

---

## 📞 Reporting Security Issues

Nếu phát hiện lỗ hổng bảo mật, vui lòng liên hệ trực tiếp qua email thay vì tạo public issue.
