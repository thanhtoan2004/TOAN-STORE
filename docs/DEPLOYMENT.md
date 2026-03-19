# Deployment Guide

Hướng dẫn triển khai TOAN Store E-commerce trên các môi trường khác nhau.

---

## 📋 Prerequisites

| Requirement    | Version | Purpose                     |
| -------------- | ------- | --------------------------- |
| Node.js        | 20+     | Runtime                     |
| MySQL          | 8.0+    | Database                    |
| Redis          | 7+      | Cache, Queue, Rate Limiting |
| Docker Desktop | Latest  | Infrastructure management   |

---

## 🖥️ Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd toan-store
npm install
```

### 2. Start Infrastructure

```bash
npm run infra:up
# Hoặc thủ công: docker-compose up -d
```

Khởi động:

- **MySQL** — `localhost:3307` (user: root, pass: root, db: toan_store)
- **Redis** — `localhost:6379`
- **MailHog** — SMTP `localhost:1025`, Web UI `localhost:8025`

### 3. Configure Environment

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=toan_store

# Security (BẮT BUỘC - Sẽ lỗi khi build nếu thiếu hoặc sai định dạng)
JWT_SECRET=your_local_dev_secret_at_least_32_characters_long
ENCRYPTION_KEY=000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f

# AI (optional)
GEMINI_API_KEY=your_gemini_key

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=user
EMAIL_PASS=pass
```

### 4. Start Development Server

```bash
npm run dev
```

Truy cập: `http://localhost:3000`

> Database schema sẽ tự động khởi tạo khi kết nối lần đầu (via `src/lib/db/init.ts`).

---

## 🏭 Production Deployment

### Environment Variables (BẮT BUỘC)

```env
NODE_ENV=production

# Database (sử dụng connection pooling)
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=toan_app
DB_PASSWORD=<strong_password>
DB_NAME=toan_store

# Security (BẮT BUỘC - sẽ crash nếu thiếu)
JWT_SECRET=<random_64_char_string_min_32>
ENCRYPTION_KEY=<random_64_char_hex_string_representing_32_bytes>

# Redis
REDIS_URL=redis://<user>:<password>@<host>:6379

# Email (Production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Payment
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-domain.com/api/payment/vnpay/return
VNPAY_IPN_URL=https://your-domain.com/api/payment/vnpay/ipn

MOMO_PARTNER_CODE=your_momo_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_REDIRECT_URL=https://your-domain.com/api/payment/momo/return
MOMO_IPN_URL=https://your-domain.com/api/payment/momo/ipn

# CRON
CRON_SECRET=<random_secret_for_cron>

# AI
GEMINI_API_KEY=your_gemini_key
```

### Build & Start

```bash
npm run build
npm start
```

### 5. Post-Deployment Steps (REQUIRED)

Sau khi build và khởi động lần đầu, bạn cần chạy các script thiết lập hạ tầng:

```bash
# Seeding RBAC (Roles & Permissions)
npx tsx scripts/seed-rbac.ts
```

### 6. Scheduled Tasks (Metrics)

Thiết lập CRON job hoặc trigger thủ công để tổng hợp dữ liệu hàng ngày:

```bash
# Chạy aggregation metrics
npx tsx scripts/aggregate-metrics.ts
```

---

## 🐳 Docker Deployment (Full Stack)

### docker-compose.yml (Production)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: '${DB_PASSWORD}'
      MYSQL_DATABASE: toan_store
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - '3306:3306'

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

volumes:
  mysql_data:
  redis_data:
```

---

## ☁️ Cloud Deployment

### Vercel (Recommended cho Next.js App)

1. Connect GitHub repo to Vercel
2. Add environment variables trong Vercel Dashboard
3. Deploy

**Database Options (Free Tier Available):**

- **MySQL**: [Aiven](https://aiven.io/mysql) hoặc [Railway](https://railway.app/)
- **Redis**: [Upstash](https://upstash.com/) (Serverless Redis, rất tốt cho Vercel)
- **Postgres (Alternative)**: [Supabase](https://supabase.com/) (Cần đổi driver mysql2 -> pg nếu muốn switch DB)

> **Lưu ý**: Vercel Serverless Functions có timeout 10s (Free) / 60s (Pro). Các long-running tasks (BullMQ workers) cần chạy trên server riêng hoặc dùng Upstash QStash.

### VPS (DigitalOcean, AWS EC2, etc.)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
sudo apt install docker.io docker-compose

# Clone & setup
git clone <repo>
cd toan-store
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "toan-store" -- start
pm2 startup
pm2 save
```

---

## 🔐 Security Checklist (Production)

- [ ] `JWT_SECRET` cài đặt chuỗi ngẫu nhiên 64 ký tự
- [ ] `ENCRYPTION_KEY` cài đặt chuỗi hex 64 ký tự (32 byte hex)
- [ ] MySQL password mạnh (không dùng `root`)
- [ ] Redis có authentication
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] CORS configured cho domain production
- [ ] Environment variables KHÔNG commit vào Git
- [ ] Database backup schedule
- [ ] Rate limiting tuned cho traffic production
- [ ] Monitor logs (Sentry, Datadog, etc.)

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### CRON Jobs (Schedule via external cron)

```bash
# Cleanup expired orders (mỗi 15 phút)
*/15 * * * * curl -X POST http://localhost:3000/api/cron/cleanup-orders -H "Authorization: Bearer <CRON_SECRET>"

# Cleanup expired reservations (mỗi 10 phút)
*/10 * * * * curl -X POST http://localhost:3000/api/cron/cleanup-reservations -H "Authorization: Bearer <CRON_SECRET>"

# Cleanup expired tokens (mỗi giờ)
0 * * * * curl -X POST http://localhost:3000/api/admin/cleanup-tokens -H "Authorization: Bearer <CRON_SECRET>"

# Abandoned Cart (mỗi 12 giờ)
0 */12 * * * curl http://localhost:3000/api/cron/abandoned-cart -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 🔄 Database Migrations

Schema tự động migrate khi ứng dụng khởi động qua `src/lib/db/init.ts`:

- Kiểm tra bảng/cột tồn tại trước khi tạo
- Thêm cột mới bằng `ALTER TABLE ... ADD COLUMN`
- Không xóa cột (backward compatible)

> **Lưu ý**: Không cần chạy migration thủ công. Schema tự động sync khi server start.
