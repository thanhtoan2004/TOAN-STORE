# TOAN E-commerce 👟

Dự án E-commerce Full-Stack chuyên nghiệp mô phỏng hệ thống Nike, được xây dựng với kiến trúc **enterprise-grade**, hiệu năng tối ưu và bảo mật đa tầng. Dự án không chỉ dừng lại ở giao diện mà còn tập trung sâu vào **logic kinh doanh phức tạp** như Flash Sales, quản lý kho đa kho (Multi-Warehouse Inventory), hệ thống Loyalty, thanh toán trực tuyến (VNPay/MoMo), và trí tuệ nhân tạo (AI Chatbot).

> **105+ API Routes** · **Enterprise Grade (Level 3/3)** · **10/10 Security Score** · **Full Audit Passed ✅**

---

## 🚀 Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| [Next.js 15+](https://nextjs.org/) | App Router, Server Components, API Routes |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) | Accessible UI components |
| React Context API | State Management (Cart, Auth, Language) |

### Backend & AI
| Technology | Purpose |
|-----------|---------|
| [Node.js](https://nodejs.org/) | Runtime |
| [MySQL 8.0](https://www.mysql.com/) | Primary Database (Docker port 3307) |
| [Redis](https://redis.io/) | Caching, Rate Limiting, Session Management |
| [BullMQ](https://optimalbits.github.io/bull/) | Background Jobs (Email Queue) |
| [MailHog](https://github.com/mailhog/MailHog) | Email Testing Server |
| [Google Gemini AI](https://deepmind.google/technologies/gemini/) | AI Chatbot with Function Calling & Model Rotation |

### Payments
| Provider | Method |
|----------|--------|
| [VNPay](https://vnpay.vn/) | QR Code, ATM, Internet Banking |
| [MoMo](https://momo.vn/) | E-wallet Payment |

---

## ✨ Key Features

### 🛍️ Client Experience
- **Premium Shop**: Duyệt sản phẩm theo danh mục (Nam, Nữ, Trẻ em), tìm kiếm thông minh và bộ lọc nâng cao.
- **Flash Sales**: Trang `/flash-sales` chuyên biệt với bộ đếm ngược thời gian thực, giới hạn suất mua trên mỗi người dùng.
- **Cart & Checkout**: Giỏ hàng lưu trữ thông minh, hỗ trợ Voucher, Coupon, Gift Card, Promo Code và phí giao hàng động.
- **Membership & Loyalty**: Hệ thống cấp bậc thành viên (Bronze → Silver → Gold) tự động tính chiết khấu và tích điểm. Thu hồi điểm khi hủy/hoàn trả.
- **AI Assistant**: Chatbot hỗ trợ tìm sản phẩm, xem hàng mới và tra cứu trạng thái đơn hàng trực tiếp qua ngôn ngữ tự nhiên.
- **Reviews & Ratings**: Đánh giá sản phẩm với media (ảnh/video), kiểm tra lịch sử mua hàng.
- **Refund Request**: Yêu cầu hoàn tiền cho đơn hàng đã giao.
- **Multi-language**: Hỗ trợ đa ngôn ngữ (Tiếng Việt, English).

### 📊 Admin Management
- **Analytics Dashboard**: Thống kê doanh thu, đơn hàng, tăng trưởng và biểu đồ trực quan.
- **Product & Inventory**: Quản lý biến thể (Size, Color), theo dõi lịch sử nhập xuất kho (`inventory_logs`), hỗ trợ đa kho (Multi-Warehouse).
- **Order Control**: Quy trình xử lý đơn hàng qua **Order State Machine** (pending → processing → shipped → delivered), hoàn kho tự động khi hủy.
- **Promotion Management**: Flash Sales, Voucher, Coupon, Promo Codes với giới hạn danh mục sản phẩm.
- **Customer Management**: Quản lý người dùng, ban/unban, xem chi tiết tài khoản.
- **Support Center**: Hệ thống chat support real-time giữa Admin và khách hàng.
- **Content Management**: Quản lý Banner, News, FAQ, Contact submissions.

---

## 🔒 Security & Enterprise Architecture

Dự án đã trải qua **Full Security Audit** toàn diện (14 lỗi đã sửa, 0 CRITICAL còn lại):

### Authentication & Authorization
- **JWT Authentication** với cơ chế **Session Isolation** (tách biệt User/Admin tokens)
- **Refresh Token Rotation** với Redis — phát hiện token bị đánh cắp và revoke tự động
- **Middleware JWT Verification** cho Admin routes (xác minh chữ ký, không chỉ check cookie)
- **Rate Limiting** qua Redis cho các endpoint nhạy cảm (Auth, Orders)

### Data Protection
- **AES-256-GCM Encryption** cho dữ liệu nhạy cảm (email, phone)
- **Bcrypt** cho mật khẩu và PIN thẻ quà tặng
- **Input Validation**: Email format, password strength, XSS sanitization
- **SQL Injection Prevention**: Parameterized queries toàn bộ
- **IDOR Protection**: Kiểm tra ownership cho mọi resource

### Business Logic Integrity
- **Order State Machine**: Centralized transition rules với `isValidStatusTransition()`
- **Idempotency**: Payment IPN handlers (VNPay/MoMo) kiểm tra duplicate trước khi xử lý
- **Stock Reservation & Rollback**: Pessimistic locking đảm bảo tồn kho chính xác
- **Gift Card Double-deduction Prevention**: Logic trừ tiền tập trung trong `updateOrderStatus`
- **Loyalty Point Reversal**: Tự động thu hồi điểm khi hủy/hoàn trả đơn hàng đã giao
- **Price Guard**: Kiểm tra giá tại Server, ngăn thao túng từ Client

### Infrastructure
- **Redis Caching Layer** cho Product API (tối ưu tốc độ phản hồi)
- **Background Jobs** via BullMQ (gửi Email, cleanup expired orders)
- **CRON Jobs**: Tự động cleanup hết hạn reservations, pending orders
- **Smart Fallback**: Tự động chuyển sang MySQL/SMTP trực tiếp nếu Redis/Docker không sẵn dùng
- **Security Headers**: CSP, X-Frame-Options, HSTS, XSS-Protection
- **CSRF Protection**: Header-based cho production

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (shop)/              # Client pages (Home, Products, Cart, Checkout...)
│   ├── admin/               # Admin dashboard pages
│   └── api/                 # 105+ RESTful API routes
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
└── middleware.ts             # Security headers, CSRF, Admin guard
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v20+
- **MySQL**: 8.0+
- **Docker Desktop**: Để chạy Redis, MySQL và MailHog

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Tạo file `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=nike_clone

# Security (BẮT BUỘC trong Production)
JWT_SECRET=your_strong_secret_key
ENCRYPTION_KEY=your_32_char_encryption_key

# AI
GEMINI_API_KEY=your_gemini_key

# Redis
REDIS_URL=redis://localhost:6379

# Email (MailHog for testing)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=user
EMAIL_PASS=pass

# Payment
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
MOMO_PARTNER_CODE=your_momo_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key

# CRON
CRON_SECRET=your_cron_secret
```

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
| Service | Command | URL |
|---------|---------|-----|
| Start all | `docker-compose up -d` | — |
| MailHog UI | — | `http://localhost:8025` |
| MySQL | — | `localhost:3307` |
| Redis | — | `localhost:6379` |
| Stop | `docker-compose stop` | — |
| Remove | `docker-compose down` | — |

---

## 🧪 API Testing

Import file `nike-clone-api.postman_collection.json` vào [Postman](https://www.postman.com/) để test toàn bộ **105+ API endpoints**.

### API Groups
| Group | Routes | Description |
|-------|--------|-------------|
| Auth & User | 13 | Login, Register, OAuth, Refresh Token, Logout |
| Account | 5 | Profile update, Password change, Data export |
| Products | 6 | List, Detail, Search, Categories |
| Cart | 5 | Add/Remove/Update items, Gift Card check |
| Orders | 4 | Create, List, Detail, Cancel |
| Payment | 6 | VNPay/MoMo Create & IPN callbacks |
| Reviews | 4 | Create, List, Update, Delete |
| Refunds | 2 | Create request, List refunds |
| Admin | 36+ | Full CRUD for all entities |
| CRON | 3 | Cleanup orders, reservations, tokens |
| Others | 20+ | Addresses, Wishlist, News, FAQ, Contact... |

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

| Document | Description |
|----------|-------------|
| [API Documentation](docs/API-DOCS.md) | Chi tiết 105+ API endpoints, request/response format |
| [Database Schema](docs/DATABASE.md) | 30+ tables, ER diagram, column definitions |
| [Security](docs/SECURITY.md) | JWT architecture, encryption, audit results |
| [Deployment Guide](docs/DEPLOYMENT.md) | Local, Docker, Cloud deployment, CRON setup |
| [Changelog](docs/CHANGELOG.md) | Version history và audit fixes |

---

© 2026 TOAN Development Team. Built for **Performance**, **Scalability**, and **Security**.
