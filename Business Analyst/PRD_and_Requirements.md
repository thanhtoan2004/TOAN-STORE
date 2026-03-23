# PRODUCT REQUIREMENTS DOCUMENT (PRD) & BUSINESS ANALYSIS

**Project Name:** TOAN STORE (E-commerce Platform)
**Version:** 1.0.0
**Date:** March 2026

---

## 1. PROJECT OVERVIEW

### 1.1. Executive Summary

TOAN STORE is a modern, high-performance, and fully responsive e-commerce web application. Designed heavily drawing inspiration from tier-1 global retail brands (e.g., Nike), the platform offers a premium shopping experience. It features full bilingual support (Vietnamese/English), dynamic content management, advanced product filtering, and multiple localized payment gateways for the Vietnamese market.

### 1.2. Business Objectives

- Establish a premium online presence for selling sports apparel, footwear, and accessories.
- Provide a localized, seamless checkout experience tailored for Vietnamese consumers (VNPAY, MoMo, VietQR, COD).
- Maintain high security and privacy standards (PII encryption).
- Enable business administrators to easily manage inventory, campaigns, pages, and menus without developer intervention.

### 1.3. Target Audience

- **Consumers (B2C):** Sports enthusiasts, athletes, and fashion-conscious individuals in Vietnam seeking high-quality gear.
- **Administrators/Staff:** Store managers, marketing teams, and customer support representatives managing day-to-day operations.

---

## 2. USER PERSONAS & ROLES

### 2.1. System Roles

1.  **Guest (Unregistered User):** Can browse products, use search/filters, view CMS pages, and add items to the cart. Prompted to login/register upon checkout or attempting to use Wishlist/Reviews.
2.  **Customer (Registered User):** Can make purchases, track order history, manage personal profiles, save shipping addresses, maintain a Wishlist, and post product reviews.
3.  **Admin (Super Admin):** Has full access to the CMS, Dashboard, User Management, Order Processing, and System Settings.
4.  **Staff (Store Manager/Support):** Has restricted access to the Admin Panel (e.g., can process orders and update inventory, but cannot change site-wide architectural settings or manage other admins).

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1. Customer Facing (Storefront)

**A. Authentication & User Profile**

- Register/Login using Email & Password.
- Password hashing (Argon2/Bcrypt) and session validation (JWT or HTTP-only cookies).
- Profile Management: Update personal info (Name, DOB, Gender). **Security Note:** Phone numbers and DOB must be encrypted in the database (AES-256).
- Address Book: Manage multiple shipping addresses; set default address.
- Notification Preferences (Email, SMS, App push toggles).

**B. Product Discovery & Navigation**

- **Dynamic Menus:** Header & Footer menus are driven by the database with bilingual support (VI/EN).
- **Home Page:** Dynamic Banners, Featured Products, "New Arrivals", and Category highlights.
- **Product Listing Page (PLP):** Advanced filtering (Category, Price, Size, Color, Gender, Sport type) and sorting.
- **Search (Quick Search):** Overlay search bar with debounce, showing instant suggestions and recent searches.
- **Product Detail Page (PDP):** Image galleries, Size Guide, Stock availability count, Related products, and Customer reviews.

**C. Shopping Cart & Checkout**

- Persistent Cart: Cart items save across sessions for logged-in users.
- Promo Codes / Vouchers: System validates codes for discounts (percentage or fixed amount).
- Checkout Flow: Step-by-step (Shipping Address -> Delivery Method -> Payment Method).
- Payment Integrations:
  - Cash on Delivery (COD)
  - Bank Transfer (VietQR rendering)
  - VNPAY Integration
  - MoMo Integration
- Order Notes & Optional Gift Wrapping.

**D. Post-Purchase & Engagement**

- Orders status tracking (Pending -> Confirmed -> Shipping -> Delivered / Cancelled).
- Wishlist: Add/remove products to a wishlist.
- Reviews & Ratings: Only verified purchasers can leave reviews on items.

### 3.2. Administrative Panel (CMS & ERP)

**A. Dashboard & Analytics**

- High-level metrics: Total Sales, Total Orders, Active Users, conversion rates.
- Charts displaying revenue over time.

**B. Product & Inventory Management**

- CRUD operations for Products, Categories, Attributes (Size, Color).
- Inventory Tracking: Manage stock levels, reserve stock during checkout, mark Out-of-Stock.
- Flash Sales: Ability to set start/end times and discount rates for specific products.

**C. Order & Transaction Management**

- Order processing pipeline (Update statuses, print invoices, manage refunds/returns).
- Transaction history linked to third-party payment gateways.

**D. Content Management System (CMS)**

- **Pages Builder:** Create static/dynamic pages (Terms of Use, Privacy Policy) with a Rich Text Editor.
- **Menu Builder:** Drag-and-drop or hierarchical assignment of menu items for Header/Footer locations.
- **Banners:** Manage Home page carousels and promotional graphics.
- **Site Settings:** Global variables (Store Name, Address, Contact Email, Contact Phone, Copyright Text).

**E. Customer Relations (CRM)**

- View user lists, order histories, and manage Support Chat/Inquiries.
- Manage Vouchers (creation, limits, expiration dates).

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1. Performance & Scalability

- **Framework:** Next.js utilizing App Router for Server-Side Rendering (SSR) and Server Components to maximize SEO and first-load speed.
- **Database:** Relational database (MySQL) via Drizzle ORM. Designed with appropriate indexing for rapid read operations (PLP/Search).

### 4.2. Security & Compliance

- **PII Protection:** Strict AES-256-GCM encryption at the application layer for sensitive user data (Phone, DOB) before saving to the database.
- **API Security:** All administrative endpoints protected by Role-Based Access Control (RBAC) middleware (`verifyAuth` & admin checks).
- **Protection against Attacks:** Implementation of CSRF tokens, strict CORS policies, and rate limiting on sensitive routes (Login, Checkout).

### 4.3. Localization & Internationalization (i18n)

- Custom bilingual dictionary architecture (`vi.ts`, `en.ts`).
- Database schema built to support `title` and `title_en` for dynamic rendering based on the user's selected context.

---

## 5. HIGH-LEVEL SYSTEM ARCHITECTURE

- **Frontend / Backend-BFF:** Next.js 14+ (React 18, Tailwind CSS, Shadcn UI / Radix primitives).
- **Database Layer:** MySQL Database mapped via Drizzle ORM.
- **Deployment & Hosting:** (Assumed) Vercel / Dockerized Node.js environment.
- **Third-Party Integrations:**
  - VNPAY & MoMo SDKs for payment processing.
  - Image hosting/service configuration.

---

_Document prepared by Antigravity AI - Acting Business Analyst._
