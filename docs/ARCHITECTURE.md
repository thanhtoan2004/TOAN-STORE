# ARCHITECTURE.md — Kiến trúc hệ thống

> Tài liệu này mô tả cấu trúc tổng thể, các lớp xử lý và luồng dữ liệu của dự án TOAN Store.

---

## 🏗️ Sơ đồ tổng quát

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

## 🛠️ Tech Stack

| Layer       | Technology          | Version | Purpose                         |
| ----------- | ------------------- | ------- | ------------------------------- |
| Framework   | Next.js             | 15      | App Router, SSR/SSG, API Routes |
| Language    | TypeScript          | 5+      | Type safety                     |
| Database    | MySQL               | 8.0     | Primary data store              |
| Cache/Queue | Redis               | 7+      | Caching, Rate limiting, BullMQ  |
| Search      | Meilisearch         | Latest  | Full-text product search        |
| ORM         | mysql2              | —       | Raw SQL với parameterization    |
| Auth        | JWT + Cookie        | —       | HTTP-Only cookies, rotation     |
| Encryption  | AES-256-GCM         | —       | PII data at rest                |
| Email       | Nodemailer + BullMQ | —       | Async email queue               |
| AI          | Google Gemini       | 1.5/2.0 | Chatbot với Function Calling    |
| Image       | Cloudinary          | —       | CDN + transformation            |
| Testing     | Vitest + Playwright | —       | Unit + E2E                      |
| Monitoring  | Sentry              | —       | Error tracking                  |
| Container   | Docker Compose      | —       | Dev infrastructure              |

## 🔄 Luồng dữ liệu — Order Lifecycle

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
