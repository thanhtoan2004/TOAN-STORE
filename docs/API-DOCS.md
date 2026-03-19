# API Documentation

Tài liệu API đầy đủ cho TOAN Store E-commerce. Tất cả API sử dụng prefix `/api/`. Tổng cộng 203+ endpoints.

> **Base URL**: `http://localhost:3000`  
> **Content-Type**: `application/json`  
> **Authentication**: JWT via Cookie (`toan_auth_session` / `toan_admin_session`)
> **Standard**: 100% Backend endpoints được tài liệu hóa qua JSDoc tiếng Việt trong mã nguồn.

---

## 📌 Conventions

| Item        | Format                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Response    | `{ success: boolean, data?: any, message?: string, pagination?: any }` (Standardized via `ResponseWrapper`)        |
| Auth        | JWT Cookie auto-attached by browser (User/Admin separation)                                                        |
| Pagination  | `?page=1&limit=12` (Returns `pagination` metadata in response)                                                     |
| Error Codes | `400` Bad Request · `401` Unauthorized · `403` Forbidden · `404` Not Found · `429` Rate Limit · `500` Server Error |
| Rate Limit  | Redis-backed, **Fail-Closed** for critical tags (Auth, Payment, Admin)                                             |
| Audit Logic | Tất cả hành động nhạy cảm của Admin được ghi log vào `admin_audit_logs`                                            |

---

## 1. 🔐 Authentication (`/api/auth`)

### POST `/api/auth/register`

Đăng ký tài khoản mới.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Nguyen",
  "lastName": "An"
}
```

**Validation (Server-side):**

- `email` — bắt buộc, đúng format regex
- `password` — bắt buộc, tối thiểu 6 ký tự
- `firstName/lastName` — tự động sanitize strip HTML tags (chống XSS)
- Rate Limit: 5 requests/phút

**Response:** `201 Created`

---

### POST `/api/auth/login`

Đăng nhập User.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK` — Set cookies: `toan_auth_session`, `toan_refresh_token`

---

### POST `/api/auth/login-admin`

Đăng nhập Admin.

**Body:**

```json
{
  "email": "admin@toanstore.com",
  "password": "admin123"
}
```

> **Bảo mật**: Sử dụng `email_hash` (Blind Index) để tìm kiếm user do email gốc đã được mã hoá (PII Compliance).

**Response:** `200 OK` — Set cookie: `toan_admin_session`

---

### GET `/api/auth/me`

Lấy thông tin user hiện tại. Yêu cầu Auth.

---

### POST `/api/auth/forgot-password`

Gửi email reset password.

**Body:** `{ "email": "user@example.com" }`

---

### POST `/api/auth/reset-password`

Đặt lại mật khẩu bằng token.

**Body:** `{ "token": "reset-token-here", "password": "new_password" }`

---

### POST `/api/auth/logout`

Đăng xuất thiết bị hiện tại.

---

### POST `/api/auth/logout-all`

Đăng xuất khỏi **tất cả** thiết bị bằng cách tăng `token_version` trong DB.

---

### POST `/api/auth/refresh`

Làm mới access token bằng refresh token. Tự động rotate refresh token (phát hiện token bị đánh cắp).

---

### GET `/api/auth/google` · GET `/api/auth/google/callback`

OAuth2 flow với Google.

### GET `/api/auth/facebook` · GET `/api/auth/facebook/callback`

OAuth2 flow với Facebook.

### POST `/api/auth/2fa/send`

Gửi mã OTP qua email (hạn 5 phút).

### POST `/api/auth/2fa/verify`

Xác nhận OTP để hoàn tất đăng nhập (trả về JWT Tokens).

### POST `/api/auth/2fa/toggle`

Bật/tắt 2FA cho tài khoản (yêu cầu Auth).

### GET `/api/auth/admin`

Lấy thông tin admin hiện tại (từ bảng `admin_users`).

---

## 2. 👤 Account (`/api/account`)

| Method | Endpoint                       | Description                                                        |
| ------ | ------------------------------ | ------------------------------------------------------------------ |
| PUT    | `/api/account/update`          | Cập nhật thông tin cá nhân (firstName, lastName, phone, avatar...) |
| POST   | `/api/account/change-password` | Đổi mật khẩu (cần `oldPassword`, `newPassword`)                    |
| GET    | `/api/account/export`          | Xuất dữ liệu cá nhân (GDPR compliance)                             |
| POST   | `/api/account/consent`         | Cập nhật đồng ý điều khoản/theo dõi                                |

---

## 3. 📍 Addresses (`/api/addresses`)

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/addresses` | Danh sách địa chỉ của user   |
| POST   | `/api/addresses` | Thêm địa chỉ mới             |
| PUT    | `/api/addresses` | Cập nhật địa chỉ             |
| DELETE | `/api/addresses` | Xóa địa chỉ (`?addressId=1`) |

**POST Body:**

```json
{
  "label": "Nhà riêng",
  "fullName": "Nguyễn Toàn",
  "phone": "0987654321",
  "addressLine": "Số 1 Đại Cồ Việt",
  "ward": "Bách Khoa",
  "district": "Hai Bà Trưng",
  "city": "Hà Nội",
  "isDefault": true
}
```

---

## 4. 🛍️ Products (`/api/products`)

| Method | Endpoint                     | Description                                 |
| ------ | ---------------------------- | ------------------------------------------- |
| GET    | `/api/products`              | Danh sách sản phẩm (filter, sort, paginate) |
| GET    | `/api/products/:id`          | Chi tiết sản phẩm                           |
| GET    | `/api/products/search`       | Tìm kiếm (`?q=toan&limit=10`)               |
| GET    | `/api/products/:id/related`  | Sản phẩm liên quan                          |
| GET    | `/api/products/:id/variants` | Biến thể (size, color)                      |
| GET    | `/api/products/:id/reviews`  | Reviews theo sản phẩm                       |

### Query Parameters (GET `/api/products`)

| Param      | Type   | Default | Description                         |
| ---------- | ------ | ------- | ----------------------------------- |
| `page`     | number | 1       | Trang hiện tại                      |
| `limit`    | number | 12      | Số sản phẩm/trang                   |
| `gender`   | string | —       | `men`, `women`, `kids`              |
| `category` | string | —       | `shoes`, `clothing`, `accessories`  |
| `sort`     | string | —       | `price_asc`, `price_desc`, `newest` |
| `minPrice` | number | —       | Giá tối thiểu                       |
| `maxPrice` | number | —       | Giá tối đa                          |

---

## 5. 📂 Categories (`/api/categories`)

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/api/categories` | Danh sách categories |

---

## 6. 🛒 Cart (`/api/cart`)

| Method | Endpoint                  | Description                                           |
| ------ | ------------------------- | ----------------------------------------------------- |
| GET    | `/api/cart`               | Lấy giỏ hàng (yêu cầu Auth)                           |
| POST   | `/api/cart`               | Thêm sản phẩm vào giỏ / Kiểm tra Gift Card            |
| PUT    | `/api/cart/:itemId`       | Cập nhật số lượng (ownership check)                   |
| DELETE | `/api/cart/:itemId`       | Xóa item khỏi giỏ (ownership check)                   |
| DELETE | `/api/cart`               | Xóa toàn bộ giỏ hàng                                  |
| POST   | `/api/cart/check-balance` | Kiểm tra số dư Gift Card (**Rate Limit: 10 req/60s**) |
| POST   | `/api/cart/release`       | Giải phóng stock reservation                          |

**Add to Cart Body:**

```json
{
  "productId": 1,
  "size": "42",
  "quantity": 1
}
```

**Gift Card Check Body:**

```json
{
  "cardNumber": "GIFT-XXXX-XXXX",
  "pin": "1234"
}
```

---

## 7. 📦 Orders (`/api/orders`)

| Method | Endpoint                            | Description                                                      |
| ------ | ----------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/orders`                       | Danh sách đơn hàng của user (`?status=pending&page=1`)           |
| POST   | `/api/orders`                       | Tạo đơn hàng mới                                                 |
| GET    | `/api/orders/:orderNumber`          | Chi tiết đơn hàng                                                |
| PUT    | `/api/orders/:orderNumber`          | Hủy đơn hàng (Status-only change)                                |
| DELETE | `/api/orders/:orderNumber`          | Hủy đơn hàng (Deep logic: hồi kho, Flash Sale slot, user points) |
| GET    | `/api/orders/lookup`                | Tra cứu đơn (`?email=...&orderNumber=...`)                       |
| GET    | `/api/orders/:orderNumber/tracking` | Điểm API theo dõi hành trình đơn hàng                            |
| PATCH  | `/api/orders/:orderNumber/tracking` | Cập nhật thông tin vận đơn (chỉ Admin)                           |

**Order Detail Data Fields:**
Ngoài các thông tin cơ bản, dữ liệu đơn hàng hiện bao gồm:

- `tax`: Số tiền thuế VAT (10%).
- `voucherDiscount`: Số tiền giảm giá từ VoucherCode.
- `giftcardDiscount`: Số tiền từ Thẻ quà tặng.
- `discount`: Tổng giảm giá (bao gồm chiết khấu hạng thành viên).

### Order State Machine

```
pending → pending_payment → payment_received → confirmed → processing → shipped → delivered
   ↓           ↓                  ↓                ↓           ↓           ↓
 cancelled   cancelled         cancelled        cancelled   cancelled   → refunded
```

**Side-effects tự động:**

- `cancelled` → Stock release, Flash Sale slot release, Loyalty point reversal
- `delivered` → Gift Card deduction, Loyalty points earned
- `payment_received` → Stock finalize (transactional)
- `refunded` → Stock release, Point deduction, Gift Card balance restoration, Coupon usage reversal (Atomic Transaction)

---

## 8. 💳 Payment (`/api/payment`)

| Method | Endpoint                    | Description                           |
| ------ | --------------------------- | ------------------------------------- |
| POST   | `/api/payment/vnpay/create` | Tạo URL thanh toán VNPay              |
| GET    | `/api/payment/vnpay/return` | VNPay redirect callback               |
| GET    | `/api/payment/vnpay/ipn`    | VNPay IPN (idempotent, State Machine) |
| POST   | `/api/payment/momo/create`  | Tạo URL thanh toán MoMo               |
| GET    | `/api/payment/momo/return`  | MoMo redirect callback                |
| POST   | `/api/payment/momo/ipn`     | MoMo IPN (idempotent, State Machine)  |

> **Idempotency & Atomicity**: Cả VNPay và MoMo IPN đều được bọc trong **Database Transaction** với cơ chế **Pessimistic Locking (`FOR UPDATE`)**. Đảm bảo không có race condition giữa các thông báo trùng lặp.

---

## 9. ⭐ Reviews (`/api/reviews`)

| Method | Endpoint       | Description                                          |
| ------ | -------------- | ---------------------------------------------------- |
| GET    | `/api/reviews` | Danh sách review (`?productId=1&page=1&sort=newest`) |
| POST   | `/api/reviews` | Tạo review mới (yêu cầu đã mua hàng)                 |
| PUT    | `/api/reviews` | Cập nhật review (User Ownership check)               |
| DELETE | `/api/reviews` | Xóa review                                           |

**POST Body:**

```json
{
  "productId": 1,
  "rating": 5,
  "comment": "Sản phẩm rất tuyệt vời!",
  "images": ["url1", "url2"]
}
```

**Admin Review Status** (PUT): Chỉ chấp nhận `approved`, `rejected`, `pending`.  
**Sorting**: Sử dụng whitelist mapping (`newest`, `highest`, `lowest`) để đảm bảo an toàn SQL Injection.

---

## 10. 💸 Refunds (`/api/refunds`)

| Method | Endpoint       | Description                                 |
| ------ | -------------- | ------------------------------------------- |
| GET    | `/api/refunds` | Danh sách yêu cầu hoàn tiền                 |
| POST   | `/api/refunds` | Tạo yêu cầu hoàn tiền (chỉ đơn `delivered`) |

---

## 11. 🎟️ Promotions (Vouchers & Promo Codes)

| Method | Endpoint                     | Description                                                                                                                                |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/user/vouchers`         | Danh sách Voucher cá nhân của User (được Admin gán)                                                                                        |
| GET    | `/api/promo-codes/available` | Danh sách mã giảm giá công khai (bao gồm: `code`, `description`, `discount_type`, `discount_value`, `starts_at`, `ends_at`, `usage_limit`) |
| POST   | `/api/promo-codes/validate`  | Kiểm tra mã (`{ "code": "TOAN2024", "cartTotal": 1000000 }`)                                                                               |
| GET    | `/api/promo-codes/history`   | Lịch sử sử dụng mã (Auth + RBAC: user chỉ xem lịch sử mình, admin full access)                                                             |

---

## 11b. 🎁 Point Redemption (`/api/user/redeem`)

| Method | Endpoint           | Description                                               |
| ------ | ------------------ | --------------------------------------------------------- |
| GET    | `/api/user/redeem` | Danh sách Voucher có thể đổi điểm + điểm hiện có của User |
| POST   | `/api/user/redeem` | Đổi điểm lấy Voucher                                      |

**Redeem Body:**

```json
{ "voucherId": 1 }
```

**Bảo mật:**

- Yêu cầu Auth (JWT User Cookie)
- DB Transaction + `SELECT FOR UPDATE` chống Race Condition
- Validate voucherId là số nguyên dương
- Kiểm tra user không bị banned/xóa mềm

**Công thức quy đổi điểm:**

- Voucher giảm % → điểm = giá_trị × 10 (VD: giảm 10% = 100 điểm)
- Voucher giảm cố định → điểm = giá_trị / 1000 (VD: giảm 50.000₫ = 50 điểm)

---

## 12. 🔔 Notifications (`/api/notifications`)

| Method | Endpoint                      | Description                               |
| ------ | ----------------------------- | ----------------------------------------- |
| GET    | `/api/notifications`          | Lấy danh sách thông báo của user hiện tại |
| PATCH  | `/api/notifications/:id/read` | Đánh dấu thông báo là đã đọc              |
| DELETE | `/api/notifications/:id`      | Xóa thông báo                             |
| POST   | `/api/notifications/read-all` | Đánh dấu tất cả là đã đọc                 |

---

## 13. ⚡ Flash Sales (`/api/flash-sales`)

| Method | Endpoint           | Description                        |
| ------ | ------------------ | ---------------------------------- |
| GET    | `/api/flash-sales` | Danh sách Flash Sales đang diễn ra |

---

## 14. ❤️ Wishlist (`/api/wishlist`)

| Method | Endpoint        | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/api/wishlist` | Danh sách Wishlist |
| POST   | `/api/wishlist` | Thêm sản phẩm      |
| DELETE | `/api/wishlist` | Xóa khỏi Wishlist  |

---

## 15. 📰 Content APIs

| Method | Endpoint                 | Description                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/api/news`              | Tin tức                                        |
| GET    | `/api/news/:slug`        | Chi tiết tin tức                               |
| POST   | `/api/news/:id/comments` | Bình luận bài viết                             |
| GET    | `/api/news/:id/comments` | Lấy bình luận                                  |
| GET    | `/api/faqs`              | FAQ                                            |
| POST   | `/api/contact`           | Gửi form liên hệ                               |
| POST   | `/api/newsletter`        | Đăng ký newsletter (**Rate Limit: 5 req/60s**) |
| GET    | `/api/banners`           | Danh sách banner                               |
| POST   | `/api/banners/click`     | Ghi nhận click banner                          |
| GET    | `/api/stores`            | Danh sách cửa hàng                             |
| GET    | `/api/news/author/:id`   | Hồ sơ tác giả + danh sách bài viết của họ      |
| POST   | `/api/upload`            | Load file hình ảnh qua Cloudinary/S3           |

---

## 16. 🤖 AI Chatbot (`/api/chat`)

| Method | Endpoint            | Description                   |
| ------ | ------------------- | ----------------------------- |
| POST   | `/api/chat`         | Gửi tin nhắn cho AI Assistant |
| GET    | `/api/chat/history` | Lịch sử chat                  |

---

## 17. 🔧 CRON Jobs (`/api/cron`)

| Method | Endpoint                         | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/api/cron/cleanup-orders`       | Cleanup đơn hàng hết hạn               |
| GET    | `/api/cron/cleanup-reservations` | Cleanup stock reservations hết hạn     |
| GET    | `/api/cron/cleanup-points`       | Dọn dẹp điểm thưởng đã hết hạn         |
| GET    | `/api/cron/abandoned-cart`       | Gửi email nhắc nhở giỏ hàng bị bỏ quên |

---

## 18. 🏥 System Health & Maintenance

| Method | Endpoint                 | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/api/health`            | Kiểm tra trạng thái DB và Redis      |
| GET    | `/api/maintenance-check` | Kiểm tra trạng thái bảo trì hệ thống |

> Yêu cầu header `Authorization: Bearer <CRON_SECRET>`  
> ⚠️ **Fail-Secure**: Nếu `CRON_SECRET` chưa được cấu hình trong `.env`, tất cả request sẽ bị **từ chối** (401).

---

## 19. 🛡️ Admin APIs (`/api/admin`)

> **Authentication**: Yêu cầu JWT Admin Cookie (`toan_admin_session`).
> **Authorization**: Mọi request được kiểm tra quyền hạn bởi hệ thống **RBAC**. Admin chỉ có thể truy cập các route phù hợp với permissions được cấp (e.g., `manage:inventory`).
> **Super Admin Role**: Một số API nhạy cảm (Settings, Admins, Audit Logs) yêu cầu quyền **Super Admin** tuyệt đối.
> **Auditing**: Tất cả hành động nhạy cảm được ghi log tự động vào `admin_audit_logs`.

### Dashboard & Analytics

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| GET    | `/api/admin/dashboard`        | Thống kê tổng quan              |
| GET    | `/api/admin/analytics`        | Biểu đồ doanh thu, đơn hàng     |
| GET    | `/api/admin/analytics/profit` | Chi tiết lợi nhuận              |
| GET    | `/api/admin/search-analytics` | Top keywords tìm kiếm           |
| GET    | `/api/admin/metrics/trigger`  | Kích hoạt cron gom data metrics |
| GET    | `/api/admin/audit-logs`       | Lịch sử thao tác Admin          |

### Products Management

| Method | Endpoint                   | Description                                                                      |
| ------ | -------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/api/admin/products`      | Danh sách sản phẩm                                                               |
| POST   | `/api/admin/products`      | Tạo sản phẩm mới                                                                 |
| GET    | `/api/admin/products/:id`  | Chi tiết sản phẩm                                                                |
| PUT    | `/api/admin/products/:id`  | Cập nhật sản phẩm                                                                |
| DELETE | `/api/admin/products/:id`  | Xóa sản phẩm                                                                     |
| GET    | `/api/admin/products/bulk` | Xuất toàn bộ sản phẩm ra file Excel (.xlsx)                                      |
| POST   | `/api/admin/products/bulk` | Nhập sản phẩm hàng loạt từ file Excel/CSV (multipart form, tối đa 5MB, 500 dòng) |

### Categories

| Method | Endpoint                        | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| GET    | `/api/admin/categories`         | Danh sách danh mục               |
| POST   | `/api/admin/categories`         | Tạo danh mục                     |
| PUT    | `/api/admin/categories/:id`     | Cập nhật                         |
| DELETE | `/api/admin/categories/:id`     | Xóa                              |
| PUT    | `/api/admin/categories/reorder` | Sắp xếp lại thứ tự (Drag & Drop) |

**Reorder Body:**

```json
{
  "items": [
    { "id": 1, "position": 0 },
    { "id": 2, "position": 1 }
  ]
}
```

> Giới hạn: tối đa 100 items/request. Validate id đương và position không âm.

### Orders

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/api/admin/orders`     | Danh sách đơn hàng (filter, paginate)   |
| GET    | `/api/admin/orders/:id` | Chi tiết đơn hàng + shipments           |
| PATCH  | `/api/admin/orders/:id` | Cập nhật trạng thái (qua State Machine) |

**PATCH Body:**

```json
{ "status": "processing" }
```

> Valid statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
> State Machine tự động xử lý stock, loyalty points, gift card, email notifications.

### Inventory & Warehouses

| Method | Endpoint                             | Description                            |
| ------ | ------------------------------------ | -------------------------------------- |
| GET    | `/api/admin/inventory`               | Danh sách tồn kho                      |
| PUT    | `/api/admin/inventory/:id`           | Cập nhật tồn kho                       |
| PATCH  | `/api/admin/inventory/transfers/:id` | Phê duyệt yêu cầu điều chuyển hàng hoá |
| GET    | `/api/admin/warehouses`              | Danh sách kho                          |
| POST   | `/api/admin/warehouses`              | Tạo kho mới                            |
| PUT    | `/api/admin/warehouses/:id`          | Cập nhật kho                           |
| DELETE | `/api/admin/warehouses/:id`          | Xóa kho                                |
| GET    | `/api/admin/shipments`               | Danh sách lô hàng                      |

### Users

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/admin/users`     | Danh sách người dùng      |
| GET    | `/api/admin/users/:id` | Chi tiết người dùng       |
| PATCH  | `/api/admin/users/:id` | Cập nhật (Ban/Unban/Role) |

### Flash Sales

| Method | Endpoint                           | Description                  |
| ------ | ---------------------------------- | ---------------------------- |
| GET    | `/api/admin/flash-sales`           | Danh sách Flash Sales        |
| POST   | `/api/admin/flash-sales`           | Tạo Flash Sale mới           |
| GET    | `/api/admin/flash-sales/:id`       | Chi tiết                     |
| PUT    | `/api/admin/flash-sales/:id`       | Cập nhật                     |
| DELETE | `/api/admin/flash-sales/:id`       | Xóa                          |
| POST   | `/api/admin/flash-sales/:id/items` | Thêm sản phẩm vào Flash Sale |

### Promotions

| Method | Endpoint                           | Description                            |
| ------ | ---------------------------------- | -------------------------------------- |
| GET    | `/api/admin/vouchers`              | Danh sách vouchers                     |
| GET    | `/api/admin/promo-codes`           | Danh sách promo codes                  |
| GET    | `/api/admin/promo-codes/:id`       | Chi tiết Promo Code                    |
| GET    | `/api/admin/gift-cards`            | Danh sách gift cards                   |
| POST   | `/api/admin/gift-cards`            | Tạo gift card                          |
| GET    | `/api/admin/gift-cards/:id`        | Chi tiết                               |
| PUT    | `/api/admin/gift-cards/:id`        | Cập nhật                               |
| DELETE | `/api/admin/gift-cards/:id`        | Xóa vĩnh viễn thẻ                      |
| PATCH  | `/api/admin/gift-cards/:id/unlock` | Mở khoá thẻ (Anti-Brute Force Lockout) |

### Content Management

| Method         | Endpoint                 | Description            |
| -------------- | ------------------------ | ---------------------- |
| GET/POST       | `/api/admin/banners`     | CRUD banners           |
| GET/POST       | `/api/admin/news`        | CRUD tin tức           |
| GET/PUT/DELETE | `/api/admin/news/:id`    | Quản lý bài viết       |
| GET/PUT        | `/api/admin/faqs`        | Quản lý FAQ            |
| GET            | `/api/admin/contact`     | Danh sách form contact |
| PUT            | `/api/admin/contact/:id` | Phản hồi contact       |

### Reviews & Refunds

| Method | Endpoint                 | Description                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/admin/reviews`     | Quản lý toàn bộ reviews     |
| PATCH  | `/api/admin/reviews/:id` | Duyệt/từ chối review        |
| DELETE | `/api/admin/reviews/:id` | Xóa review                  |
| GET    | `/api/admin/reviews/:id` | Chi tiết review             |
| GET    | `/api/admin/refunds`     | Danh sách yêu cầu hoàn tiền |
| GET    | `/api/admin/refunds/:id` | Chi tiết yêu cầu hoàn tiền  |
| PATCH  | `/api/admin/refunds/:id` | Duyệt/từ chối hoàn tiền     |

### Settings & Support

| Method  | Endpoint                           | Description                 |
| ------- | ---------------------------------- | --------------------------- |
| GET/PUT | `/api/admin/settings`              | Cài đặt hệ thống            |
| GET     | `/api/admin/seo`                   | Quản lý meta tags SEO chung |
| GET     | `/api/admin/support/chats`         | Danh sách chat sessions     |
| GET     | `/api/admin/support/chats/:chatId` | Chi tiết chat               |
| POST    | `/api/admin/cleanup-tokens`        | Dọn dẹp token hết hạn       |

---

## 🔑 Error Response Format

```json
{
  "success": false,
  "message": "Mô tả lỗi chi tiết",
  "error": "Error code (optional)"
}
```

## 🔒 Security Headers

Tất cả responses đều bao gồm:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (production only)
