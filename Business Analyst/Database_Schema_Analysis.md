# DATA MODEL ANALYSIS & SCHEMA (BUSINESS PERSPECTIVE)

**Project Name:** TOAN STORE (E-commerce Platform)
**Version:** 1.0.0

---

## 1. INTRODUCTION

This document outlines the high-level business logic and functional boundaries of the TOAN STORE database schema. It intentionally omits excessive technical syntax (like specific VARCHAR lengths) and focuses on the _Business Rules_ enforcing data integrity.

---

## 2. CORE DOMAINS

### 2.1. Authentication & Users

- **Entity:** `users`
- **Business Rule:** Every user must register with a unique, valid email or phone number.
- **Data Privacy (GDPR/PDPA Baseline):** Personally identifiable information (PII) including physical addresses, dates of birth, and exact phone numbers must be obfuscated or encrypted using standard algorithms (AES-256). The front-end receives a masked version (e.g., `***` for phone numbers) unless strictly needed.
- **Roles:** The system distinguishes between "Consumer" accounts and "Administrator" accounts utilizing separate authentication sessions or flags.

### 2.2. Product Catalog

- **Entity:** `products`, `categories`, `attributes` (e.g., Sizes, Brands)
- **Business Rule:** Products must belong to at least one Category (e.g., Shoes, Clothing).
- **Localization:** Products and categories should eventually support translation or localized display fields.
- **Pricing:** Listed prices are considered base. Overrides can occur through Vouchers or Flash Sale tables.
- **Entity:** `inventory`
- **Business Rule:** Inventory must accurately reflect real-world stock. When a customer attempts to checkout, logic must lock/reserve stock explicitly to prevent overselling.

### 2.3. Campaigns & Promotions

- **Entity:** `banners`
- **Business Rule:** Promotional banners visible on the Home Page and PLP (Product Listing Page) must be toggleable by Admins without needing code deployment.
- **Entity:** `flash_sales`
- **Business Rule:** Active only within explicit Start/End datetime parameters. Requires robust timezone handling (UTC to VN Time).

### 2.4. Orders & Fulfillment

- **Entity:** `orders`, `order_items`
- **Business Rule:** An Order acts as an immutable snapshot of a transaction. Once an order is paid and confirmed, its pricing, shipping address, and included items cannot gracefully change without administrative override or full cancellation.
- **Order States:**
  - `pending` -> Waiting for customer to finalize payment via VNPay/Momo/Bank Transfer.
  - `confirmed` -> Payment validated or COD selected; warehouse prepares packing.
  - `shipping` -> Handed to 3rd-party logistics (3PL).
  - `delivered` -> Reached the customer.
  - `cancelled` -> User aborted, payment failed, or stock anomaly.

### 2.5. Content Management (CMS)

- **Entity:** `menu_items`
- **Business Rule:** Hierarchical structure allowing Parent/Child nesting. Designed exclusively for the dynamic generation of Site navigation (Header, Footers). Must natively house English translations (`title_en`) alongside Vietnamese.
- **Entity:** `pages`
- **Business Rule:** Full HTML/Markdown storage for rich legal documents or custom editorial content.
- **Entity:** `site_settings`
- **Business Rule:** A robust Key-Value store allowing instant updates to global variables like "Phone Number", "Map Location", "Copyright Year", and "Main Logo URL".

### 2.6. User Journey Add-ons

- **Entity:** `wishlists`
- **Business Rule:** Allows cross-device persistence of a user's favorite items. Requires an authenticated session.
- **Entity:** `reviews`
- **Business Rule:** Reviews are tied to Products. To combat spam, an explicit requirement must ensure the user status matches "Verified Purchase" before they can submit a review with a star rating.

---

_Document prepared by Antigravity AI - Acting Business Analyst._
