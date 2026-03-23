# USER EXPERIENCE (UX) & FLOW ANALYSIS

**Project Name:** TOAN STORE (E-commerce Platform)
**Version:** 1.0.0

---

## 1. USER JOURNEYS (Happy Paths)

### 1.1. Guest Shopping (First Arrival)

- **Entry:** User lands on the Homepage (`/`).
- **Discovery:** Views the "Hero Banner" and "Featured Categories" -> Clicks a category (`/men`, `/shoes`).
- **Listing (PLP):** Uses filters (Price: >2m, Sport: Running) -> Clicks a product card.
- **Detail (PDP):** Reads the description, checks available sizes -> Clicks "Add to Cart" -> Sees Cart Badge update or Overlay.
- **Checkout Decision:** Proceeds to Checkout. Prompted to "Login or Continue as Guest" (If Guest Checkout allowed).
- **Payment:** Selects VietQR and pays -> Redirects to Success Page (`/payment-confirmation`).

### 1.2. Returning Customer (Authentication & Loyalty)

- **Entry:** Lands on the Homepage (`/`).
- **Auth:** Clicks "Account" in the header -> Logs in via Email & Password (`/login`).
- **Profile:** Accesses Dashboard (`/profile`) -> Checks Order Status -> Reviews a recent `/orders`.
- **Engagement:** Navigates to a specific product -> Leaves a 5-star Review (Verified Purchase flag goes true) -> Saves item to Wishlist for later.

### 1.3. Administrative Workflow (CMS Management)

- **Entry:** Direct access to `/admin` -> Logs in with Admin/Staff credentials.
- **Dashboard:** Checks daily sales and traffic.
- **Task 1 (Inventory):** Navigates to `/admin/products/new` -> Uploads a new product image to cloud storage -> Adds sizes, categories, and price -> Saves draft/publishes.
- **Task 2 (Marketing):** Navigates to `/admin/menus` -> Uses the GUI to add a new "Flash Sale" link under the "Header" -> Fills in both Vietnamese (`Khuyến mãi chớp nhoáng`) and English (`Flash Sale`) variants.

---

## 2. UI/UX REQUIREMENTS

### 2.1. Responsive Layout Standards

- **Mobile-First Approach:** Default breakpoints must cleanly adapt to standard Vietnamese smartphone dimensions (Viewport widths under 768px).
- **Mobile Menu:** Accordion-style slide-in overlay hiding the search bar and nesting children intuitively for easy tap targets.
- **Tablet/Desktop (Above 768px/1024px):** Grid expands. Mega-menus or sophisticated dropdowns are enabled on hover/click. Sticky Header for immediate navigation access.

### 2.2. Interactive Elements & Feedback

- **Forms (Auth, Comments, Profile):** Real-time inline validation (e.g., `zod` validation) showing red warning boxes if formatting is incorrect (e.g., weak password, malformed email).
- **Loading States:** Skeletons or robust Spinners during client-to-server data fetch (e.g., fetching large inventories).
- **Micro-interactions:** Buttons highlight on hover. Cart triggers a subtle bounce or slide-in notification upon successful "Add".
- **Notifications (Toasts):** System-wide messages (Success, Warning, Error) utilize an overlay disappearing after 3-5 seconds.

### 2.3. System Fallbacks & Empty States

- **Zero Results:** If a search query or a complex compound filter returns no products, display a friendly "No Products Found" message, proposing removal of rigid filters or showcasing "Recommended" default items.
- **Empty Cart/Wishlist:** Encourages the user to start browsing with direct fast links to "Shop Men", "Shop Women", "Shop Kids".

### 2.4. Accessibility (A11y) & Localization (L10n)

- Immediate availability of a Language Switcher (VI/EN) across all core interface surfaces (Footer -> Top header).
- Translations pull from an internal `dictionary` configuration (`vi.ts/en.ts`) augmented by Server-Side database variables `title_en` ensuring 100% UI consistency.
- Proper DOM structure (`<nav>`, `<header>`, `<main>`, `<article>`) maximizing Screen Reader compatibility.

---

_Document prepared by Antigravity AI - Acting Business Analyst._
