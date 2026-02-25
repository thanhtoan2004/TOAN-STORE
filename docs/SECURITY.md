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
| Token | Cookie Name | Purpose | Expiry |
|-------|-------------|---------|--------|
| Access Token (User) | `nike_auth_session` | API authentication | 15 min |
| Access Token (Admin) | `nike_admin_session` | Admin API authentication | 15 min |
| Refresh Token | `nike_refresh_token` | Renew access tokens | 7 days |

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
  | Toàn quyền | `all` |

---

## 🛡️ Data Protection

### Encryption at Rest
| Data | Method | Details |
|------|--------|---------|
| Passwords | **Bcrypt** (salt rounds: 10) | One-way hash |
| Gift Card PINs | **Bcrypt** | One-way hash |
| Email addresses | **AES-256-GCM** | Two-way encryption |
| Phone numbers | **AES-256-GCM** | Two-way encryption |

### Encryption Error Handling
- `encrypt()` → **Throw error** nếu thất bại (không bao giờ lưu plaintext)
- `decrypt()` → Return plaintext fallback nếu thất bại (backward compatibility với data cũ)

---

## 🚧 Input Validation

### Registration
| Field | Validation | After Audit |
|-------|-----------|-------------|
| email | Required, regex format check | ✅ Fixed |
| password | Required, min 6 characters | ✅ Fixed |
| firstName/lastName | Strip HTML tags (XSS prevention) | ✅ Fixed |

### API-level Validations
- **Numeric ranges**: Giá không âm, quantity > 0
- **Status whitelists**: Order status, Review status chỉ chấp nhận giá trị hợp lệ
- **Ownership checks**: Mỗi resource kiểm tra thuộc về user hiện tại (IDOR prevention)
- **SQL Parameterization**: 100% queries sử dụng parameterized statements

### IDOR Prevention (Phase 63.2)
| Resource | Protection |
|----------|------------|
| Cart Items (PUT/DELETE) | `cart_items JOIN carts WHERE c.user_id = ?` — kiểm tra ownership tại database |
| Orders (GET/PUT/DELETE) | `order.user_id === session.userId` |
| Review Purchase Check | Session-based `userId` (không nhận từ query param) |
| Promo Code History | Non-admin chỉ xem lịch sử của mình, admin có full access |

---

## 🔒 Request Security

### CSRF Protection (Enterprise Target Strict Match)
- Origin/Host matching tuyệt đối 100% (`===`) cho mutating requests (POST, PUT, PATCH, DELETE)
- Loại bỏ các ngoại lệ lách luật bằng Header `X-Requested-With`. Origin phải trùng khớp hoàn toàn trên Production.
- Đi kèm bảo mật SameSite Cookie.

### Rate Limiting
| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth (login/register) | 5 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Payment | 10 requests | 1 minute |
| Forgot Password | 3 requests | 1 minute |
| Newsletter Subscribe | 5 requests | 1 minute |
| Gift Card Check Balance | 10 requests | 1 minute |
| Cart Gift Card Check | Rate limited | Per IP |

Implementation: Redis-backed sliding window.  
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

| Issue | Severity | Status | Description |
|-------|----------|--------|-------------|
| Rate Limit Fail-Open | MEDIUM | ✅ Fixed | Đã chuyển sang Fail-Closed cho auth/payment/admin |
| Cart Dual-Purpose POST | MEDIUM | Known | POST `/api/cart` xử lý cả add-to-cart và gift card check |
| Orders JS Pagination | MEDIUM | Known | Dùng JS slice thay vì SQL LIMIT/OFFSET |
| Review ORDER BY | LOW | ✅ Fixed | Đã sử dụng whitelist mapping toàn bộ |
| CSRF Dev Mode | LOW | Known | CSRF protection disabled trong development |
| Debug Sentry Open | HIGH | ✅ Fixed | Đã thêm `checkAdminAuth` — chỉ admin truy cập được |
| Cron Auth Bypass | HIGH | ✅ Fixed | Đã đổi logic: reject nếu `CRON_SECRET` chưa cấu hình |
| Newsletter No Rate Limit | MEDIUM | ✅ Fixed | Thêm rate limit 5 req/60s |
| Gift Card Brute Force | MEDIUM | ✅ Fixed | Thêm rate limit 10 req/60s |
| Promo Codes Data Leak | LOW | ✅ Fixed | Giới hạn fields trả về (ẩn discount_value, usage_limit) |

---

## 📞 Reporting Security Issues

Nếu phát hiện lỗ hổng bảo mật, vui lòng liên hệ trực tiếp qua email thay vì tạo public issue.
