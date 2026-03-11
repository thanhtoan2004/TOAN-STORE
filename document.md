# Supplemental Documentation — TOAN Store v2.12.0

> Tài liệu này bổ sung và đính chính các nội dung còn thiếu hoặc mâu thuẫn trong bộ docs hiện tại.

---

## 📋 Mục lục

1. [Sửa lỗi trong tài liệu hiện có](#1-sửa-lỗi-trong-tài-liệu-hiện-có)
2. [ARCHITECTURE.md — Kiến trúc hệ thống](#2-architecturemd)
3. [TESTING.md — Hướng dẫn kiểm thử](#3-testingmd)
4. [API-DOCS bổ sung — Các endpoint còn thiếu](#4-api-docs-bổ-sung)
5. [DATABASE bổ sung — Đính chính schema thực tế](#5-database-bổ-sung)
6. [ERROR CODES — Danh sách lỗi chuẩn hóa](#6-error-codes)
7. [GLOSSARY — Thuật ngữ dự án](#7-glossary)

---

## 1. Sửa lỗi trong tài liệu hiện có

### API-DOCS.md

| Vị trí                            | Lỗi                                                                                         | Đính chính                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Section 13 (trùng lặp)            | Có **2 section mang số 13**: "Flash Sales" và "Wishlist"                                    | Đổi Wishlist thành **Section 14**, Content APIs thành **Section 15**, v.v.                          |
| `/api/account/consent`            | Được đề cập trong CHANGELOG v2.12.0 nhưng **không có trong API-DOCS**                       | Xem mục 4 bên dưới                                                                                  |
| `DELETE /api/orders/:orderNumber` | Mô tả "Hủy đơn hàng" nhưng `PUT` cũng có mô tả tương tự                                     | `PUT` = hủy đơn (user-facing), `DELETE` = `cancelOrder()` nội bộ kèm side-effects; cần phân biệt rõ |
| `/api/reviews` - `PUT`            | "Duyệt review (Admin)" nhưng endpoint này là `/api/reviews` không phải `/api/admin/reviews` | Admin duyệt review nên dùng `PUT /api/admin/reviews/:id`                                            |

### DATABASE.md

| Vị trí             | Lỗi                                                      | Thực tế (từ database.sql)                                                                  |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `admin_users`      | Liệt kê cột `bio`, `avatar_url`, `social_links`          | **Không tồn tại** trong schema thực tế (AUTO_INCREMENT=3 chứng minh bảng cũ)               |
| `products`         | Liệt kê `stock_quantity`, `reserved_quantity`, `gender`  | Thực tế dùng bảng `inventory` riêng; `gender` nằm trong bảng `product_gender_categories`   |
| `product_variants` | Liệt kê `stock_quantity`, `reserved_quantity`            | Không có — stock quản lý qua bảng `inventory`                                              |
| `orders`           | Liệt kê `cancelled_at`, `email`, `email_encrypted`       | `cancelled_at` không tồn tại; `email` dùng `contact_email_enc`; không có `email_encrypted` |
| `inventory_logs`   | `product_id`, `warehouse_id`, `action`, `reference_type` | Thực tế: `inventory_id`, `quantity_change`, `reason`, `reference_id`                       |
| `seo_metadata`     | Liệt kê `page_path`                                      | Thực tế: `entity_type` (ENUM) + `entity_id`                                                |
| `refunds`          | Liệt kê `processed_by` FK→admin_users                    | Không tồn tại; bảng có `request_id` FK→refund_requests                                     |
| Tổng số bảng       | Ghi "77 bảng"                                            | Dump thực tế có **~52 bảng** (không tính archive)                                          |

### SECURITY.md

| Vị trí                                   | Lỗi                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| "Gift Card PINs dùng AES-256-GCM"        | Thực tế PIN trong `gift_cards.pin` dùng **Bcrypt** (`$2b$10$...`), không phải AES |
| Known Limitations "Orders JS Pagination" | CHANGELOG v2.12.0 ghi đã fix — nên cập nhật status thành ✅ Fixed                 |

---

## 2. ARCHITECTURE.md

```
TOAN Store — System Architecture
=================================

┌──────────────────────────────────────────────────────────┐
│                        CLIENT                            │
│           Next.js 15 App Router (React 18)               │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │  Pages   │  │  Admin   │  │    AI Chatbot UI      │  │
│   │ /shop/*  │  │/admin/*  │  │  (Gemini streaming)   │  │
│   └──────────┘  └──────────┘  └──────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP/HTTPS
┌────────────────────────▼─────────────────────────────────┐
│                  NEXT.JS EDGE MIDDLEWARE                  │
│   - JWT verify (Admin routes)                            │
│   - Maintenance mode check                               │
│   - CSRF origin validation                               │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   API ROUTES (/api/*)                     │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth Layer  │  │  Rate Limit  │  │  RBAC Check   │  │
│  │  (JWT Cookie)│  │  (Redis)     │  │  withPermission│  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └─────────────────┼──────────────────┘           │
│                           ▼                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │               Business Logic Layer                 │  │
│  │  order-logic.ts │ encryption.ts │ point-logic.ts   │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              Repository / DB Layer                  │  │
│  │         mysql2 (connection pool, parameterized)     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────┬──────────────────┘
               │                        │
┌──────────────▼───────┐  ┌─────────────▼────────────────┐
│       MySQL 8.0       │  │           Redis 7             │
│   toan_store DB       │  │  ┌──────────┬──────────────┐ │
│  - 52+ tables         │  │  │Rate Limit│  Session/OTP │ │
│  - AES-256 PII        │  │  ├──────────┼──────────────┤ │
│  - CHECK constraints  │  │  │API Cache │  BullMQ Jobs │ │
│  - Soft deletes       │  │  └──────────┴──────────────┘ │
└──────────────────────┘  └──────────────────────────────┘

External Services
─────────────────
┌──────────────┐  ┌──────────────┐  ┌────────────────────┐
│  Google      │  │  Gemini AI   │  │   Cloudinary       │
│  OAuth 2.0   │  │  (Chatbot)   │  │   (Image CDN)      │
└──────────────┘  └──────────────┘  └────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌────────────────────┐
│  VNPay       │  │  MoMo Wallet │  │  Meilisearch       │
│  (Payment)   │  │  (Payment)   │  │  (Full-text Search)│
└──────────────┘  └──────────────┘  └────────────────────┘
┌──────────────┐  ┌──────────────┐
│  Nodemailer  │  │  Sentry      │
│  (Email)     │  │  (Monitoring)│
└──────────────┘  └──────────────┘
```

### Tech Stack

| Layer       | Technology          | Version     | Purpose                         |
| ----------- | ------------------- | ----------- | ------------------------------- |
| Framework   | Next.js             | 15          | App Router, SSR/SSG, API Routes |
| Language    | TypeScript          | 5+          | Type safety                     |
| Database    | MySQL               | 8.0         | Primary data store              |
| Cache/Queue | Redis               | 7+          | Caching, Rate limiting, BullMQ  |
| Search      | Meilisearch         | Latest      | Full-text product search        |
| ORM         | mysql2              | —           | Raw SQL với parameterization    |
| Auth        | JWT + Cookie        | —           | HTTP-Only cookies, rotation     |
| Encryption  | AES-256-GCM         | —           | PII data at rest                |
| Email       | Nodemailer + BullMQ | —           | Async email queue               |
| AI          | Google Gemini       | 2.5/2.0/1.5 | Chatbot với Function Calling    |
| Image       | Cloudinary          | —           | CDN + transformation            |
| Testing     | Vitest + Playwright | —           | Unit + E2E                      |
| Monitoring  | Sentry              | —           | Error tracking                  |
| Container   | Docker Compose      | —           | Dev infrastructure              |

### Luồng dữ liệu — Order Lifecycle

```
User adds to cart
      │
      ▼
Stock reservation (Redis TTL 15min)
      │
      ▼
Checkout → Order created (status: pending)
      │
      ├─── COD ──────────────────────────────┐
      │                                       │
      └─── VNPay/MoMo → IPN callback         │
                │         (FOR UPDATE lock)   │
                ▼                             │
         payment_received                     │
                │                             │
                ▼                             ▼
           confirmed ◄──────────── Admin confirms
                │
                ▼
           processing → shipped → delivered
                                      │
                                      ├─ Points earned
                                      ├─ Gift card deducted
                                      └─ Email notification
```

---

## 3. TESTING.md

### Cấu trúc Test

```
tests/
├── unit/                    # Vitest unit tests (56 tests)
│   ├── order-logic.test.ts  # 24 tests — State machine, pricing
│   ├── encryption.test.ts   # 16 tests — AES-256-GCM encrypt/decrypt
│   └── utils.test.ts        # 15 tests — Slug, format, sanitize
│
└── e2e/                     # Playwright E2E tests (28 tests)
    ├── auth.spec.ts          # 7 tests — Register, login, 2FA
    ├── security.spec.ts      # 12 tests — Auth enforcement
    └── api.spec.ts           # 9 tests — API contract tests
```

### Chạy Tests

```bash
# Unit tests
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# E2E tests (cần server đang chạy)
npm run test:e2e          # Headless
npm run test:e2e:ui       # Playwright UI mode

# Security audit (automated)
npx playwright test tests/e2e/security.spec.ts
```

### Coverage Targets

| Module               | Target | Hiện tại |
| -------------------- | ------ | -------- |
| Order logic          | 90%    | ✅ Đạt   |
| Encryption           | 95%    | ✅ Đạt   |
| Utils                | 80%    | ✅ Đạt   |
| Auth endpoints (E2E) | 100%   | ✅ Đạt   |

### Test Conventions

```typescript
// Unit test — Vitest
import { describe, it, expect, vi } from 'vitest';

describe('cancelOrder', () => {
  it('should release stock when order cancelled', async () => {
    // Arrange
    const mockOrder = { id: 1, status: 'confirmed' };
    // Act
    const result = await cancelOrder(mockOrder.id);
    // Assert
    expect(result.status).toBe('cancelled');
  });
});
```

```typescript
// E2E test — Playwright
test('should reject unauthenticated admin API access', async ({ request }) => {
  const response = await request.get('/api/admin/dashboard');
  expect(response.status()).toBe(401);
});
```

### Mock Strategy

- **Database**: `vi.mock('../../lib/db')` với fake `executeQuery`
- **Redis**: Mock client trả về `null` để test Fail-Open/Fail-Closed
- **Email**: MailHog (dev) — `localhost:8025` để verify email được gửi
- **Payment**: Sandbox endpoints của VNPay/MoMo

---

## 4. API-DOCS bổ sung

### GDPR & Consent (`/api/account/consent`) — Thêm từ v2.12.0

| Method | Endpoint               | Auth | Description                                |
| ------ | ---------------------- | ---- | ------------------------------------------ |
| GET    | `/api/account/consent` | User | Lấy trạng thái đồng ý hiện tại của user    |
| POST   | `/api/account/consent` | User | Cập nhật consent (marketing, analytics...) |

**POST Body:**

```json
{
  "consentType": "marketing",
  "isGranted": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consentType": "marketing",
    "isGranted": true,
    "grantedAt": "2026-03-08T10:00:00Z",
    "ipAddress": "127.0.0.1"
  }
}
```

> Ghi chú: IP + User-Agent được log tự động (immutable audit trail).

---

### Addresses — Chi tiết Body

**POST `/api/addresses`**

```json
{
  "label": "Nhà",
  "recipientName": "DANG THANH TOAN",
  "phone": "0901234567",
  "addressLine": "123 Đường ABC",
  "ward": "700000",
  "district": "Hóc Môn",
  "city": "TP. Hồ Chí Minh",
  "isDefault": true
}
```

> Dữ liệu `phone` và `addressLine` được mã hóa AES-256-GCM trước khi lưu. Cột gốc bị mask thành `***`.

---

### Reviews — Chi tiết

**POST `/api/reviews`**

```json
{
  "productId": 1,
  "rating": 5,
  "title": "Sản phẩm tốt",
  "comment": "Chất lượng xuất sắc",
  "images": ["base64_or_url"]
}
```

> Yêu cầu user đã mua sản phẩm (`is_verified_purchase`). Kiểm tra qua `order_items` JOIN `orders` WHERE `user_id = session.userId`.

---

### News Comments

| Method | Endpoint                            | Auth       | Description                 |
| ------ | ----------------------------------- | ---------- | --------------------------- |
| GET    | `/api/news/:slug/comments`          | —          | Danh sách comments (nested) |
| POST   | `/api/news/:slug/comments`          | User       | Đăng comment / Reply        |
| POST   | `/api/news/:slug/comments/:id/like` | User       | Like/Unlike comment         |
| DELETE | `/api/news/:slug/comments/:id`      | User/Admin | Xóa comment                 |

---

### Đính chính numbering API-DOCS.md

| Section hiện tại                | Đúng là               |
| ------------------------------- | --------------------- |
| 13. Flash Sales                 | 13. Flash Sales ✓     |
| 13. Wishlist (trùng)            | **14.** Wishlist      |
| 14. Content APIs                | **15.** Content APIs  |
| 15. AI Chatbot                  | **16.** AI Chatbot    |
| 16. CRON Jobs                   | **17.** CRON Jobs     |
| 17. Health (trùng số với Admin) | **18.** System Health |
| 17. Admin APIs                  | **19.** Admin APIs    |

---

## 5. DATABASE bổ sung

### Bảng thực tế bị thiếu trong DATABASE.md

#### `product_embeddings`

| Column     | Type                      | Description                    |
| ---------- | ------------------------- | ------------------------------ |
| id         | BIGINT PK                 | —                              |
| product_id | BIGINT FK→products UNIQUE | —                              |
| embedding  | JSON                      | Vector embedding cho AI search |
| updated_at | TIMESTAMP                 | —                              |

#### `sports`

| Column    | Type                | Description                      |
| --------- | ------------------- | -------------------------------- |
| id        | BIGINT PK           | —                                |
| name      | VARCHAR(200)        | Running, Basketball, Football... |
| slug      | VARCHAR(255) UNIQUE | —                                |
| is_active | TINYINT(1)          | —                                |

> `products.sport_id` FK→`sports.id` — dùng để filter sản phẩm theo môn thể thao.

#### `collections`

| Column      | Type                | Description                       |
| ----------- | ------------------- | --------------------------------- |
| id          | BIGINT PK           | —                                 |
| name        | VARCHAR(200)        | Air Max, Air Force, Dunk, Pegasus |
| slug        | VARCHAR(255) UNIQUE | —                                 |
| description | TEXT                | —                                 |

> `products.collection_id` FK→`collections.id`

#### `brands`

| Column      | Type                | Description           |
| ----------- | ------------------- | --------------------- |
| id          | BIGINT PK           | —                     |
| name        | VARCHAR(200) UNIQUE | Nike, Jordan, Nike SB |
| slug        | VARCHAR(255) UNIQUE | —                     |
| description | TEXT                | —                     |

#### `stores` + `store_hours`

Danh sách cửa hàng vật lý với tọa độ GPS, giờ mở cửa theo từng ngày trong tuần.

#### `pages`

CMS cho trang tĩnh: About, Privacy Policy, Terms of Use, Guides.

#### `payment_methods`

Bảng config cho các phương thức thanh toán (COD, Bank Transfer, MoMo, VNPay, ZaloPay).

---

### Sơ đồ quan hệ bổ sung — Inventory

```
products
  └── product_variants (size, color_id, sku, price)
        └── inventory (variant_id, warehouse_id, quantity, reserved)
              └── inventory_logs (quantity_change, reason, reference_id)

warehouses
  └── inventory (FK)
  └── inventory_transfers (from/to warehouse)
```

> **Lưu ý quan trọng**: Stock KHÔNG lưu trực tiếp trong `products` hay `product_variants`. Toàn bộ tồn kho quản lý qua bảng `inventory` với constraint `CHECK (quantity >= 0)` và `CHECK (reserved <= quantity)`.

---

### Loyalty Point System

```
Tích điểm:
  order.total / 1000 = points earned (khi delivered)

Hạng thành viên (dựa trên lifetime_points):
  Bronze:   0 - 999 points
  Silver:   1,000 - 4,999 points
  Gold:     5,000 - 9,999 points
  Platinum: 10,000+ points

Chiết khấu theo hạng:
  Bronze:   0%
  Silver:   5%
  Gold:     10%
  Platinum: 15%

Đổi điểm:
  Voucher % → cost = value × 10  (VD: 10% off = 100 điểm)
  Voucher cố định → cost = value / 1000  (VD: 50,000₫ = 50 điểm)
```

---

## 6. ERROR CODES

### HTTP Status Codes (chuẩn hóa)

| Code  | Scenario                           | Example                                |
| ----- | ---------------------------------- | -------------------------------------- |
| `400` | Validation failed, bad body        | Email sai format, thiếu field bắt buộc |
| `401` | Chưa đăng nhập / Token hết hạn     | Cookie không có hoặc expired           |
| `403` | Đăng nhập rồi nhưng không có quyền | User thường gọi Admin API              |
| `404` | Resource không tồn tại             | Sản phẩm bị xóa, đơn hàng sai ID       |
| `409` | Conflict — trùng lặp               | Email đã tồn tại, SKU trùng            |
| `422` | Business rule violation            | Hủy đơn đã giao, đổi điểm không đủ     |
| `429` | Rate limit exceeded                | 5+ login attempts/phút                 |
| `500` | Internal server error              | DB connection fail, encryption error   |
| `503` | Maintenance mode                   | `settings.maintenance_mode = true`     |

### Business Error Messages (chuẩn hóa)

```typescript
// Recommended error message keys (i18n-ready)
const ERRORS = {
  AUTH: {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    ACCOUNT_LOCKED: 'Tài khoản bị khóa. Vui lòng thử lại sau {minutes} phút',
    EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi đăng nhập',
    BANNED: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ',
  },
  ORDER: {
    CANNOT_CANCEL: 'Không thể hủy đơn hàng ở trạng thái này',
    INSUFFICIENT_STOCK: 'Sản phẩm không đủ hàng',
    INVALID_TRANSITION: 'Trạng thái đơn hàng không hợp lệ',
  },
  PAYMENT: {
    INVALID_CHECKSUM: 'Chữ ký thanh toán không hợp lệ',
    DUPLICATE_IPN: 'Thông báo thanh toán đã được xử lý',
  },
  GIFT_CARD: {
    LOCKED: 'Thẻ quà tặng đã bị khóa do nhập sai quá nhiều lần',
    INSUFFICIENT_BALANCE: 'Số dư thẻ quà tặng không đủ',
    EXPIRED: 'Thẻ quà tặng đã hết hạn',
  },
  POINTS: {
    INSUFFICIENT: 'Điểm thưởng không đủ để đổi voucher này',
    RACE_CONDITION: 'Yêu cầu đổi điểm đang được xử lý. Vui lòng thử lại',
  },
};
```

---

## 7. GLOSSARY

| Thuật ngữ             | Định nghĩa                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Price Cache**       | `products.price_cache` — Giá thấp nhất của variant, denormalized để tránh JOIN khi render danh sách   |
| **MSRP**              | Manufacturer Suggested Retail Price — Giá niêm yết gốc, dùng để hiển thị "strikethrough" price        |
| **PII**               | Personally Identifiable Information — Dữ liệu cá nhân (phone, address, email) được mã hóa AES-256-GCM |
| **Soft Delete**       | Xóa mềm — Dùng `deleted_at` timestamp thay vì xóa vật lý, cho phép phục hồi                           |
| **State Machine**     | Order status chỉ được chuyển theo các transition hợp lệ định nghĩa trong `order-logic.ts`             |
| **FOR UPDATE**        | Pessimistic lock trong MySQL — Ngăn race condition khi nhiều request cùng đọc/ghi một row             |
| **Fail-Closed**       | Từ chối request nếu Redis lỗi (cho endpoint nhạy cảm: auth, payment, admin)                           |
| **Fail-Open**         | Cho phép request đi qua nếu Redis lỗi (cho endpoint thông thường)                                     |
| **IPN**               | Instant Payment Notification — Webhook từ VNPay/MoMo thông báo kết quả thanh toán                     |
| **IDOR**              | Insecure Direct Object Reference — Lỗ hổng truy cập resource của user khác qua ID                     |
| **Token Version**     | `users.token_version` — Tăng lên khi đổi mật khẩu / logout-all, invalidate tất cả JWT cũ              |
| **Flash Sale Slot**   | Số lượng giới hạn trong flash sale, được release khi order bị hủy                                     |
| **Voucher vs Coupon** | **Voucher**: Credit cá nhân (1 người dùng, từ Admin). **Coupon**: Mã công khai (nhiều người dùng)     |
| **Reserved**          | `inventory.reserved` — Số lượng đang bị giữ bởi đơn hàng pending, chưa deduct thực sự                 |
| **Double Column**     | Pattern lưu `phone = "***"` (masked) + `phone_encrypted = "IV:TAG:CIPHERTEXT"` (encrypted)            |
| **RPO/RTO**           | Recovery Point Objective / Recovery Time Objective — Mục tiêu phục hồi sau sự cố                      |
| **CRON_SECRET**       | Secret key bảo vệ cron job endpoints, reject nếu không cấu hình (Fail-Secure)                         |
