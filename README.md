# Nike Clone E-commerce 👟

Một dự án E-commerce mô phỏng website Nike, được xây dựng bằng công nghệ web hiện đại nhất, tập trung vào trải nghiệm người dùng, giao diện cao cấp và bảo mật toàn diện.

---

## 🚀 Technology Stack

### Frontend & Core
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Bundler**: [Turbopack](https://nextjs.org/docs/app/api-reference/next-config-js/turbo)
- **UI Architecture**: [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend & Security
- **Database**: [MySQL](https://www.mysql.com/) with `mysql2` driver
- **Authentication**: JWT (JSON Web Tokens) with cross-session isolation
- **Security Testing**: Custom Automated Security Regression Suite

---

## ✨ Key Features

### 🛒 Storefront (Khách hàng)
- **Premium Browsing**: Giao diện sản phẩm hiện đại, lọc thông minh và hiệu ứng mượt mà.
- **Advanced Cart**: Giỏ hàng lưu trữ phiên làm việc, hỗ trợ mã giảm giá và thẻ quà tặng.
- **Membership Level**: Hệ thống tích điểm và phân hạng (Bronze, Silver, Gold) tự động áp dụng ưu đãi.
- **Verified Reviews**: Đánh giá sản phẩm kèm media, xác nhận "Đã mua hàng".

### 🛠️ Admin Dashboard (Quản trị)
- **Real-time Analytics**: Thống kê doanh thu, đơn hàng và biểu đồ hóa dữ liệu.
- **Inventory Control**: Quản lý sản phẩm, danh mục và tồn kho chuyên sâu.
- **Customer Support**: Hệ thống Chat trực tuyến hỗ trợ khách hàng.
- **Security Audit**: Nhật ký hoạt động và bảo vệ API nhiều lớp.

---

## 🔒 Security Highlights

Dự án đã được thực hiện Remediation toàn diện:
- **Session Isolation**: Tách biệt hoàn toàn Session của Admin và User (`nike_admin_session` vs `nike_auth_session`).
- **Authorization Guard**: Mọi API quản trị đều được bảo vệ bởi lớp kiểm tra quyền hạn nghiêm ngặt.
- **Hardened Cookies**: Sử dụng `HttpOnly`, `Secure` và `SameSite: Strict` để chống XSS/CSRF.
- **Automated Regression**: Tích hợp sẵn bộ test bảo mật để đảm bảo độ an toàn lâu dài.

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v20+)
- MySQL Server

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Tạo file `.env` dựa trên `.env.example`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nike_clone
JWT_SECRET=your_complex_secret
```

### 4. Running the Project
```bash
# Development mode
npm run dev

# Run Security Suite
npm run security-test
```

---

## 📂 Project Anatomy
- `src/app/api`: Hệ thống Backend API đa tầng.
- `src/lib/auth.ts`: Trung tâm xử lý xác thực và phân quyền.
- `scripts/verify-sessions.js`: Công cụ kiểm thử bảo mật nâng cao.

---
© 2026 Nike Clone Project. High Performance & High Security.
