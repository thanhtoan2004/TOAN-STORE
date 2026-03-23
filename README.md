# TOAN Store E-commerce 👟

Dự án E-commerce Full-Stack chuyên nghiệp TOAN Store, được xây dựng với kiến trúc **enterprise-grade**, hiệu năng tối ưu và bảo mật đa tầng. Dự án không chỉ dừng lại ở giao diện mà còn tập trung sâu vào **logic kinh doanh phức tạp** như Flash Sales, quản lý kho đa kho (Multi-Warehouse Inventory), hệ thống Loyalty, thanh toán trực tuyến (VNPay/MoMo), và trí tuệ nhân tạo (AI Chatbot).

> **214+ API Routes** · **84 Database Tables** · **58 Unit Tests** · **100% Vietnamese JSDoc (Full Project)** · **Enterprise Grade (Level 3/3)** · **10/10 Security Score** · **v2.19.0 Stable (PWA & Real-time Update) ✅**

---

## 🚀 Technology Stack

### Frontend

| Technology                                                                  | Purpose                                   |
| --------------------------------------------------------------------------- | ----------------------------------------- |
| [Next.js 15+](https://nextjs.org/)                                          | App Router, Server Components, API Routes |
| [Tailwind CSS](https://tailwindcss.com/)                                    | Utility-first styling                     |
| [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) | Accessible UI components                  |
| [Serwist (PWA)](https://serwist.pages.dev/)                                 | Progressive Web App (Offline, Install)    |
| [Socket.io](https://socket.io/)                                             | Real-time Synchronization (Client side)   |
| React Context API                                                           | State Management (Cart, Auth, Language)   |

### Backend & Auth

| Technology                                                       | Purpose                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| [Node.js](https://nodejs.org/)                                   | Runtime                                                 |
| [MySQL 8.0](https://www.mysql.com/)                              | Primary Database (84 tables)                            |
| [Meilisearch v1.10](https://www.meilisearch.com/)                | Full-text Search Engine (typo-tolerance, highlighting)  |
| [Redis](https://redis.io/)                                       | Caching, Rate Limiting, Pub/Sub, Session Management     |
| [RBAC (Granular)](docs/SECURITY.md)                              | Role-Based Access Control (Super Admin, Manager, Staff) |
| [BullMQ](https://optimalbits.github.io/bull/)                    | Background Jobs (Email Queue)                           |
| [MailHog](https://github.com/mailhog/MailHog)                    | Email Testing Server (Local)                            |
| [Google Gemini AI](https://deepmind.google/technologies/gemini/) | AI Chatbot with Function Calling                        |

### Testing

| Technology                            | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| [Vitest](https://vitest.dev/)         | Unit Tests (56 tests — order logic, encryption, utils) |
| [Playwright](https://playwright.dev/) | E2E Tests (28 tests — auth, security, API)             |

### Monitoring & DevOps

| Technology                                         | Purpose                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| [Sentry](https://sentry.io/)                       | Error Tracking & Performance Monitoring (Standard Hooks)              |
| [Pino](https://getpino.io/)                        | Structured JSON Logging with Sentry Integration                       |
| [GitHub Actions](.github/workflows/ci.yml)         | CI/CD Pipeline (Lint, Test, Build)                                    |
| [Docker Compose](https://docs.docker.com/compose/) | Infrastructure (MySQL, Redis, Meilisearch, MailHog) with Healthchecks |

### Payments

| Provider                   | Method                         |
| -------------------------- | ------------------------------ |
| [VNPay](https://vnpay.vn/) | QR Code, ATM, Internet Banking |
| [MoMo](https://momo.vn/)   | E-wallet Payment               |

---

## ✨ Key Features

### 🛍️ Client Experience

- **PWA (Progressive Web App)**: Cài đặt ứng dụng trực tiếp từ trình duyệt, hỗ trợ Offline Caching, Splash Screen và mượt mà như app gốc.
- **Real-time Sync (Socket.io + Redis Pub/Sub)**: Cập nhật tồn kho (Stock) và trạng thái đơn hàng tức thì trên mọi thiết bị đang truy cập mà không cần tải lại trang.
- **Premium Shop**: Duyệt sản phẩm theo danh mục (Nam, Nữ, Trẻ em), tìm kiếm thông minh và bộ lọc nâng cao.
- **Flash Sales**: Trang `/flash-sales` chuyên biệt với bộ đếm ngược thời gian thực, giới hạn suất mua trên mỗi người dùng.
- **Cart & Checkout**: Giỏ hàng lưu trữ thông minh, hỗ trợ Voucher, Coupon, Gift Card, Promo Code, phí giao hàng động và **tự động tính thuế VAT**.
- **Optimistic UI Cart**: Trải nghiệm cập nhật số lượng giỏ hàng tức thì (không độ trễ) nhờ kỹ thuật Optimistic UI và cơ chế tự động Rollback khi gặp lỗi API.
- **Professional Printing**: Hệ thống in hóa đơn (Invoice) và catalog sản phẩm (Spec Sheet) chuyên nghiệp, tối ưu hóa A4, tự động ẩn UI thừa.
- **Membership & Loyalty**: Hệ thống cấp bậc thành viên (Bronze → Silver → Gold → Platinum) tự động tính chiết khẩu và tích điểm. Thu hồi điểm khi hủy/hoàn trả và tự động hết hạn điểm định kỳ.
- **AI Assistant**: Chatbot hỗ trợ tìm sản phẩm, xem hàng mới và tra cứu trạng thái đơn hàng trực tiếp qua ngôn ngữ tự nhiên.
- **Voice Search**: Tìm kiếm bằng giọng nói (`Speech-to-Text`) tích hợp trực tiếp vào thanh điều hướng và giao diện tìm kiếm nâng cao.
- **Smart Notifications**: Hệ thống chuông thông báo (Bell) trên Header (Mobile & Desktop), tự động gửi tin nhắn khi có Voucher mới hoặc thay đổi trạng thái đơn hàng.
- **Reviews & Ratings**: Đánh giá sản phẩm với media (ảnh/video), kiểm tra lịch sử mua hàng.
- **Refund Request & Returns**: Yêu cầu hoàn tiền cho đơn hàng đã giao và quản lý trả hàng (`/help/returns`).
- **Gift Cards & Vouchers**: Mua/tặng Thẻ quà tặng và quản lý Voucher cá nhân tại trang Account (`/account/vouchers`).
- **Order Tracking**: Tra cứu hành trình đơn hàng không cần đăng nhập (`/order-lookup`).
  s & Ratings\*\*: Đánh giá sản phẩm với media (ảnh/video), kiểm tra lịch sử mua hàng.
- **Refund Request & Returns**: Yêu cầu hoàn tiền cho đơn hàng đã giao và quản lý trả hàng (`/help/returns`).
- **Gift Cards & Vouchers**: Mua/tặng Thẻ quà tặng và quản lý Voucher cá nhân tại trang Account (`/account/vouchers`).
- **Order Tracking**: Tra cứu hành trình đơn hàng không cần đăng nhập (`/order-lookup`).
- **Dynamic Navigation**: Hệ thống Header & Footer điều hướng đa cấp (Menus Tree) tải trọng song ngữ (VI/EN) trực tiếp từ database.
- **Multi-language**: Hỗ trợ đa ngôn ngữ (Tiếng Việt, English) chuẩn SEO.
- **Point Redemption**: Đổi điểm thưởng tích lũy lấy Voucher giảm giá, giao dịch an toàn với DB Transaction.

### 📊 Admin Management

- **Analytics Dashboard**: Thống kê doanh thu, đơn hàng, tăng trưởng và biểu đồ trực quan.
- **Product & Inventory**: Quản lý biến thể (Size, Color), theo dõi lịch sử nhập xuất kho (`inventory_logs`), hỗ trợ đa kho (Multi-Warehouse).
- **Order Control**: Quy trình xử lý đơn hàng qua **Order State Machine** (pending → processing → shipped → delivered), hoàn kho tự động khi hủy và hỗ trợ in hóa đơn chuẩn doanh nghiệp.
- **Promotion Management**: Flash Sales, Voucher (với cơ chế **Smart Restore**), Coupon, Promo Codes với giới hạn danh mục sản phẩm.
- **Customer Management**: Quản lý người dùng, Ban/Unban User, xem chi tiết tài khoản cùng quyền hạn linh hoạt.
- **Bulk Import/Export**: Nhập/xuất sản phẩm hàng loạt qua file Excel (.xlsx) với validation và audit log.
- **Menu Manager & CMS Pages**: Giao diện quản lý Menu đa cấp (Parent/Child) và tài liệu nội dung (Pages Manager) linh hoạt không cần sửa code.
- **Drag & Drop Categories**: Kéo thả sắp xếp thứ tự danh mục sản phẩm với `@hello-pangea/dnd`.
- **Manual Metrics Aggregation**: API `/api/admin/metrics/trigger` cho phép Admin chủ động tổng hợp báo cáo doanh thu theo yêu cầu.
- **Support Center**: Hệ thống chat support real-time giữa Admin và khách hàng.
- **Content Management**: Quản lý Banner, News (với hồ sơ Tác giả), FAQ, Contact submissions.

---

## 🔒 Security & Enterprise Architecture

Dự án đã trải qua **Full Security Audit** toàn diện (14 lỗi đã sửa, 0 CRITICAL còn lại):

### Authentication & Authorization

- **JWT Authentication** với cơ chế **Session Isolation** (tách biệt User/Admin tokens)
- **Token Versioning**: Hỗ trợ "Đăng xuất khỏi tất cả thiết bị" tức thì bằng cách vô hiệu hóa Token phiên bản cũ trong DB.
- **Two-Factor Authentication (2FA)**: Bảo mật đăng nhập đa lớp qua OTP Email cho Admin/User.
- **Refresh Token Rotation** với Redis — phát hiện token bị đánh cắp và revoke tự động
- **Middleware JWT Verification** cho Admin routes (xác minh chữ ký, không chỉ check cookie)
- **Super Admin RBAC**: Giới hạn quyền quản lý cài đặt hệ thống và nhân sự chỉ dành cho Super Admin.
- **Rate Limiting** qua Redis cho các endpoint nhạy cảm (Auth, Orders, Payments)

### Data Protection

- **AES-256-GCM Encryption** cho dữ liệu nhạy cảm (email, phone)
- **Bcrypt** cho mật khẩu và PIN thẻ quà tặng.
- **Input Validation**: Email format, password strength, XSS sanitization.
- **Full-Text Search Safety**: Hệ thống tìm kiếm sản phẩm đa cấp. Sử dụng **MySQL FULLTEXT Index** (Match Against) kết hợp Meilisearch, đảm bảo tốc độ cực nhanh kể cả khi DB lớn.
- **SQL Injection Prevention**: Parameterized queries toàn bộ.
- **IDOR Protection**: Kiểm tra ownership cho mọi resource (Cart, Reviews, Orders).
- **Accessibility (A11y)**: Đảm bảo khả năng truy cập và chuẩn SEO với `OptimizedImage` và cấu trúc HTML semantic.

### Business Logic Integrity

- **Order State Machine**: Centralized transition rules với `isValidStatusTransition()`
- **Idempotency**: Payment IPN handlers (VNPay/MoMo) kiểm tra duplicate trước khi xử lý
- **Stock Reservation & Rollback**: Pessimistic locking đảm bảo tồn kho chính xác
- **Gift Card Double-deduction Prevention**: Logic trừ tiền tập trung trong `updateOrderStatus`
- **Loyalty Point Reversal**: Tự động thu hồi điểm khi hủy/hoàn trả đơn hàng đã giao
- **Price Guard (v2)**: Kiểm tra giá và số tiền thanh toán (VNPAY) tại Server thông qua đối soát Database, tuyệt đối không tin tưởng client input.
- **Response Standardization**: 100% API sử dụng `ResponseWrapper` cho tính nhất quán và bảo mật thông báo lỗi.
- **Database Safety Triggers**: Sử dụng `BEFORE INSERT/UPDATE` triggers trên bảng `inventory` để ngăn chặn tuyệt đối tình trạng kho âm hoặc dữ liệu ảo.

### Infrastructure

- **Redis Caching Layer** cho Product API (tối ưu tốc độ phản hồi)
- **Advanced DB Indexing**: Hệ thống Index tối ưu (Composite Indexes, FULLTEXT Indexes) trên các bảng `products`, `orders` và `search_analytics` giúp giảm 70% độ trễ truy vấn.
- **Background Jobs** via BullMQ (gửi Email, cleanup expired orders)
- **CRON Jobs**: Tự động cleanup hết hạn reservations, pending orders và điểm thưởng hết hạn
- **Smart Fallback**: Tự động chuyển sang MySQL/SMTP trực tiếp nếu Redis/Docker không sẵn dùng
- **Security Headers**: CSP, X-Frame-Options, HSTS, XSS-Protection
- **CSRF Protection**: Header-based cho production
- **GDPR Compliance**: `user_consents`, `cookie_consents`, `data_requests` tables + Consent API

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (shop)/              # Client pages (Home, Products, Cart, Checkout...)
│   ├── admin/               # Admin dashboard pages
│   └── api/                 # 203+ RESTful API routes
│       ├── auth/            # Authentication (13 routes)
│       ├── account/         # User account management
│       ├── cart/             # Cart operations
│       ├── orders/          # Order CRUD
│       ├── payment/         # VNPay & MoMo integration
│       ├── reviews/         # Product reviews
│       ├── refunds/         # Refund requests
│       ├── admin/           # Admin APIs (36+ routes)
│       ├── cron/            # Scheduled cleanup jobs
│       └── ...              # Products, Categories, News, etc.
├── components/              # Reusable UI components
├── contexts/                # React Context (Auth, Cart, Language)
├── lib/
│   ├── db/
│   │   ├── mysql.ts         # Database connection & queries
│   │   ├── init.ts          # Schema initialization & migrations
│   │   └── repositories/    # Data access layer (order, refund, shipment)
│   ├── auth.ts              # JWT verification & generation
│   ├── encryption.ts        # AES-256-GCM encryption
│   ├── order-logic.ts       # Order State Machine
│   ├── rate-limit.ts        # Redis-backed rate limiter
│   ├── redis/               # Redis utilities (cache, lock, rateLimit)
│   ├── payment/             # VNPay & MoMo SDK
│   └── email-templates.ts   # Email notification templates
├── middleware.ts             # Security headers, CSRF, Admin guard
tests/                        # Playwright E2E tests (auth, security, api)
src/test/                     # Vitest unit tests (order-logic, encryption, utils)
docs/                         # API-DOCS, DATABASE, SECURITY, DEPLOYMENT, BACKUP_RESTORE
```

---

## ⚙️ Getting Started

### 1. Prerequisites

- **Node.js**: v20+
- **MySQL**: 8.0+
- **Docker Desktop**: Để chạy Redis, MySQL, Meilisearch và MailHog

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Copy file `.env.example` sang `.env` và điền thông tin:

```bash
cp .env.example .env
```

> Xem chi tiết tất cả 30+ biến trong [`.env.example`](.env.example) (Dev) hoặc [`.env.production.example`](.env.production.example) (Production)

### 4. Running the Project

```bash
# Chạy hạ tầng (MySQL, Redis, MailHog)
npm run infra:up

# Chạy ứng dụng ở chế độ phát triển
npm run dev

# Build production
npm run build
```

### 5. Infrastructure Management

| Service        | Command                | URL                     |
| -------------- | ---------------------- | ----------------------- |
| Start all      | `docker-compose up -d` | —                       |
| MailHog UI     | —                      | `http://localhost:8025` |
| Meilisearch UI | —                      | `http://localhost:7700` |
| MySQL          | —                      | `localhost:3307`        |
| Redis          | —                      | `localhost:6379`        |
| Stop           | `docker-compose stop`  | —                       |
| Remove         | `docker-compose down`  | —                       |

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm run test     # 56 tests across 4 files
```

| File                  | Tests | Coverage                                       |
| --------------------- | ----- | ---------------------------------------------- |
| `order-logic.test.ts` | 24    | State machine, transitions, stock actions      |
| `encryption.test.ts`  | 16    | AES-256-GCM encrypt/decrypt, tamper detection  |
| `utils.test.ts`       | 15    | formatCurrency, formatDate, formatRelativeTime |
| `sample.test.tsx`     | 1     | Component render                               |

### E2E Tests (Playwright)

```bash
npm run dev              # Terminal 1
npx playwright test      # Terminal 2
```

| File               | Tests | Coverage                           |
| ------------------ | ----- | ---------------------------------- |
| `auth.spec.ts`     | 7     | Login, Register, Forgot Password   |
| `security.spec.ts` | 12    | Protected routes, Admin auth, IDOR |
| `api.spec.ts`      | 9     | Public API endpoints validation    |

### API Testing (Postman)

Import file `toan-store-api.postman_collection.json` vào [Postman](https://www.postman.com/) để test toàn bộ **203 API endpoints**. Toàn bộ file đã được tổ chức thành 6 thư mục nghiệp vụ (Entity-based grouping), đi kèm ví dụ Body JSON chuẩn chỉnh cho từng request POST/PUT/PATCH. Hỗ trợ đầy đủ từ khâu xác thực Blind Index, xử lý đăng ký nhận tin (Newsletter) đến hoàn tiền đơn hàng.

> [!TIP]
> **Source-of-Truth Documentation**: Tất cả các API routes đều được tích hợp tài liệu **JSDoc tiếng Việt** trực tiếp trong mã nguồn (`route.ts`).

### API Groups

| Group        | Routes | Description                                               |
| ------------ | ------ | --------------------------------------------------------- |
| Auth & User  | 13     | Login, Register, OAuth, Refresh Token, Logout             |
| Account      | 7      | Profile, Password, Data export, Consent, Sessions         |
| Products     | 6      | List, Detail, Search, Categories                          |
| Cart         | 5      | Add/Remove/Update items, Gift Card check                  |
| Orders       | 4      | Create, List, Detail, Cancel                              |
| Payment      | 6      | VNPay/MoMo Create & IPN callbacks                         |
| Reviews      | 5      | Create, List, Update, Delete, Media upload                |
| Refunds      | 3      | Create request, List refunds, Phê duyệt hoàn tiền         |
| Admin        | 90+    | Full CRUD for all entities (Banners, Faqs, Users, v.v...) |
| CRON         | 6      | Cleanup orders, reservations, points, tokens, marketing   |
| Others       | 40+    | Addresses, Wishlist, News, FAQ, Gift Cards...             |
| User Loyalty | 3      | Point Redemption (list + redeem vouchers)                 |
| News Author  | 1      | Author profile & articles                                 |

---

## 🏗️ Order State Machine

```
pending → pending_payment → payment_received → confirmed → processing → shipped → delivered
   ↓           ↓                  ↓                ↓           ↓           ↓
 cancelled   cancelled         cancelled        cancelled   cancelled   → refunded
```

Mỗi transition kích hoạt các side-effects tự động:

- **Stock Finalize**: Khi chuyển sang `payment_received` / `confirmed`
- **Stock Release**: Khi `cancelled` hoặc `refunded`
- **Loyalty Points**: Tích điểm khi `delivered`, thu hồi khi `cancelled`/`refunded`
- **Gift Card Deduction**: Trừ số dư khi `delivered`
- **Email Notifications**: Gửi email tự động ở mỗi bước

---

## 📚 Documentation

| Document                                   | Description                                          |
| ------------------------------------------ | ---------------------------------------------------- |
| [API Documentation](docs/API-DOCS.md)      | Chi tiết 203+ API endpoints, request/response format |
| [Architecture](docs/ARCHITECTURE.md)       | Sơ đồ kiến trúc hệ thống và luồng dữ liệu            |
| [Database Schema](docs/DATABASE.md)        | 52+ tables, ER diagram, column definitions           |
| [Security](docs/SECURITY.md)               | JWT architecture, encryption, audit results          |
| [Testing Guide](docs/TESTING.md)           | Hướng dẫn chạy/viết Unit Test và E2E Test            |
| [Deployment Guide](docs/DEPLOYMENT.md)     | Local, Docker, Cloud deployment, CRON setup          |
| [Backup & Restore](docs/BACKUP_RESTORE.md) | MySQL, Redis, Meilisearch backup & disaster recovery |
| [Changelog](docs/CHANGELOG.md)             | Version history và audit fixes                       |
| [OpenAPI Spec](docs/openapi.yaml)          | Machine-readable API specification                   |

---

## 📖 Glossary (Thuật ngữ)

- **PII (Personally Identifiable Information)**: Thông tin định danh cá nhân (Email, SĐT, Địa chỉ).
- **IDOR (Insecure Direct Object Reference)**: Lỗ hổng truy cập tài nguyên của người khác qua ID.
- **RBAC (Role-Based Access Control)**: Kiểm soát truy cập dựa trên quyền hạn.
- **MSRP (Manufacturer's Suggested Retail Price)**: Giá bán lẻ đề xuất của hãng.
- **IPN (Instant Payment Notification)**: Thông báo trạng thái thanh toán từ cổng thanh toán.

---

## ❌ Common Error Codes

| Code   | Message          | Description                            |
| ------ | ---------------- | -------------------------------------- |
| `E001` | Unauthorized     | Token không hợp lệ hoặc hết hạn        |
| `E002` | Forbidden        | Không có quyền thực hiện hành động này |
| `E003` | Validation Error | Dữ liệu đầu vào sai định dạng          |
| `E004` | Stock Conflict   | Hết hàng hoặc không đủ tồn kho         |
| `E005` | Internal Error   | Lỗi server (đã log vào Sentry)         |

---

© 2026 TOAN Store Development Team. Built for **Performance**, **Scalability**, and **Security**.
