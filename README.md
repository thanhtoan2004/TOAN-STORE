# Nike Clone E-commerce 👟

Một dự án E-commerce mô phỏng website Nike, được xây dựng bằng công nghệ web hiện đại, tập trung vào trải nghiệm người dùng, giao diện đẹp mắt và hiệu suất cao.

![Nike Clone Banner](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [Shadcn UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks & Context

### Backend & Database
- **API**: Next.js API Routes (Serverless functions)
- **Database**: MySQL
- **Driver**: `mysql2`

## ✨ Tính Năng Nổi Bật

### 🛒 Khách Hàng (Storefront)
- **Duyệt sản phẩm**: Xem danh sách, chi tiết sản phẩm, lọc theo danh mục, giá, kích cỡ.
- **Giỏ hàng & Thanh toán**: Thêm vào giỏ, cập nhật số lượng, Checkout với mã giảm giá.
- **Tài khoản**: Đăng ký, Đăng nhập, Quản lý hồ sơ, Địa chỉ giao hàng.
- **Hệ thống Hội viên (Membership Tiers)**:
  - Tích điểm tự động (10,000đ = 1 điểm).
  - Hạng thành viên: **Bronze** (Mặc định), **Silver** (>1000 điểm), **Gold** (>5000 điểm).
  - **Quyền lợi**:
    - 🥈 **Silver**: Giảm **5%** + Tự động Freeship.
    - 🥇 **Gold**: Giảm **10%** + Tự động Freeship.
- **Wishlist**: Lưu sản phẩm yêu thích.

### 🛠️ Admin Dashboard
- **Tổng quan (Dashboard)**: Thống kê doanh thu, đơn hàng, khách hàng mới, sản phẩm bán chạy.
- **Quản lý sản phẩm**: Thêm, sửa, đóng/mở bán sản phẩm.
- **Quản lý đơn hàng**: Xem chi tiết, cập nhật trạng thái giao hàng.
- **Khách hàng**: Xem danh sách khách hàng và **Hạng thành viên**.

## ⚙️ Cài Đặt & Chạy Dự Án

### 1. Yêu cầu tiên quyết
- Node.js (v18 trở lên)
- MySQL Server

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Môi trường
Tạo file `.env` tại thư mục gốc và điền thông tin kết nối Database:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nike_clone
DB_PORT=3306
```

### 4. Khởi tạo Database
Khi lầ đầu chạy dự án, hệ thống sẽ tự động kiểm tra và tạo các bảng cần thiết (Migration tự động) thông qua hàm `initDb()` trong `src/lib/db/mysql.ts`.

### 5. Chạy Server
```bash
# Môi trường phát triển
npm run dev
```
Truy cập: `http://localhost:3000`

## 📂 Cấu trúc Dự án
```bash
d:\nike-clone
├── 📁 src
│   ├── 📁 app          # Next.js App Router (Pages & API)
│   │   ├── 📁 (shop)   # Giao diện khách hàng
│   │   ├── 📁 admin    # Giao diện Admin
│   │   └── 📁 api      # Backend API Endpoints
│   ├── 📁 components   # Các React Component tái sử dụng
│   ├── 📁 lib          # Các hàm tiện ích (Database, Utils)
│   └── 📁 types        # TypeScript definitions
├── 📄 .env             # Biến môi trường
└── 📄 package.json     # Dependencies & Scripts
```

## 📝 Ghi chú Phát triển
- **Migration**: Logic thay đổi Database Schema nằm trong `initDb`.
- **Membership logic**: Xử lý tại `updateOrderStatus` (tích điểm) và `orders/route.ts` (tính giảm giá).

---
© 2024 Nike Clone Project.
