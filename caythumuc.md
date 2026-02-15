# Cấu trúc thư mục chi tiết dự án TOAN (Nike Clone)

Dưới đây là sơ đồ chi tiết từng file và thư mục trong dự án, kèm theo chức năng cụ thể của chúng.

## 1. Thư mục gốc (Root)
Các file cấu hình và môi trường của dự án.

```text
nike-clone/
├── .env                    # Biến môi trường (DB Credentials, JWT Secret, Redis URL, Cloudinary API Key, Google Auth...)
├── .env.example            # Mẫu biến môi trường để dev mới setup (đã xóa giá trị nhạy cảm)
├── .gitignore              # Danh sách file/folder bị loại trừ khỏi Git (node_modules, .env, .next...)
├── database.sql            # File dump cấu trúc database MySQL mới nhất để khởi tạo lại DB
├── docker-compose.yml      # Cấu hình Docker Compose để chạy các service phụ trợ (MySQL 8.0, Redis Stack)
├── package.json            # File quản lý dự án Node.js: dependencies, devDependencies và các scripts chạy lệnh
├── package-lock.json       # File khóa phiên bản chính xác của các thư viện đã cài đặt
├── next.config.mjs         # Cấu hình Next.js (Image Optimization domains, SASS, Webpack Customization)
├── tailwind.config.ts      # Cấu hình Tailwind CSS (Theme colors, Fonts, Custom Utilities, Plugins)
├── tsconfig.json           # Cấu hình TypeScript Compiler (Path Aliases @/*, Strict Mode, Target ESNext)
├── postcss.config.mjs      # Cấu hình PostCSS (Plugin TailwindCSS và Autoprefixer)
├── next-env.d.ts           # File định nghĩa Type tự động sinh bởi Next.js
├── README.md               # Tài liệu tổng quan dự án, hướng dẫn cài đặt và chạy server
└── caythumuc.md            # File tài liệu hiện tại mô tả cấu trúc thư mục
```

## 2. Scripts (`/scripts`)
Các công cụ chạy dòng lệnh để quản trị hệ thống và vận hành DevOps.

```text
scripts/
├── backup-db.js            # Node.js Script: Thực hiện lệnh mysqldump để sao lưu toàn bộ dữ liệu ra file .sql
├── migrate.js              # Node.js Script: Quét thư mục migration và thực thi các file SQL mới nhất vào DB
├── init-phase19.ts         # TypeScript Script: Khởi tạo dữ liệu mẫu cho Phase 19 (Sản phẩm test, User test, Cấu hình)
├── check-fk.js             # Node.js Script: Kiểm tra và báo cáo các lỗi vi phạm Khóa ngoại (Foreign Key) trong DB
├── check-columns.js        # Node.js Script: Kiểm tra sự tồn tại của các cột quan trọng trong các bảng DB
├── check-column.js         # Node.js Script: Kiểm tra chi tiết một cột cụ thể
├── deploy.js               # Node.js Script: Tự động hóa quy trình deploy (Pull code -> Install -> Build -> Restart PM2)
├── apply-migrations.js     # Node.js Script: Áp dụng các thay đổi schema cụ thể mà không chạy full migration
└── migrate-partial-shipment.js # Script chuyên biệt để nâng cấp DB hỗ trợ giao hàng từng phần
```

## 3. Mã nguồn chính (`/src`)
Đây là nơi chứa toàn bộ logic backend và frontend của ứng dụng.

### 3.1. Thư viện lõi (`/src/lib`) - **Core Logic**
Nơi chứa các hàm xử lý logic nghiệp vụ, tách biệt hoàn toàn với giao diện.

```text
src/lib/
├── db/                         # Layer kết nối Database
│   ├── mysql.ts                # Singleton Connection Pool kết nối MySQL bằng mysql2/promise
│   └── repositories/           # Pattern Repository: Chỉ thực hiện query SQL tại đây
│       ├── order.ts            # Logic Phức tạp: Tạo đơn hàng Transaction, Giữ kho (Inventory Reservation), Tính toán giá
│       ├── product.ts          # Truy vấn Sản phẩm: Lọc nâng cao, Tìm kiếm Full-text, Lấy chi tiết kèm biến thể
│       ├── user.ts             # Quản lý User: Lấy Profile, Cập nhật thông tin, Lịch sử mua hàng
│       ├── cart.ts             # Quản lý Giỏ hàng: Thêm/Sửa/Xóa item, Kiểm tra tồn kho thời gian thực
│       ├── flash_sale.ts       # Xử lý Flash Sale: Kiểm tra khung giờ, Tính giá giảm, Giới hạn số lượng mua
│       ├── gift_card.ts        # Xử lý Thẻ quà tặng: Kiểm tra số dư, Trừ tiền transaction an toàn
│       ├── coupon.ts           # Kiểm tra Mã giảm giá: Hiệu lực, Điều kiện áp dụng, Số lượng còn lại
│       ├── attribute.ts        # Quản lý Thuộc tính động (EAV) cho sản phẩm (Màu sắc, Chất liệu...)
│       ├── audit.ts            # Ghi nhật ký Audit Log cho các hành động quan trọng của Admin
│       ├── refund.ts           # Xử lý Yêu cầu Hoàn tiền: Cập nhật trạng thái, Hoàn kho, Trừ điểm thưởng
│       ├── review.ts           # Quản lý Đánh giá sản phẩm: Thêm review, Duyệt review, Tính điểm trung bình
│       ├── seo.ts              # Quản lý Metadata SEO động cho từng trang
│       ├── shipment.ts         # Quản lý Vận chuyển: Phí ship, Đơn vị vận chuyển
│       ├── store.ts            # Quản lý Cửa hàng/Chi nhánh (Store Locator)
│       └── wishlist.ts         # Quản lý Danh sách yêu thích của User
├── redis.ts                    # Cấu hình Singleton Client kết nối Redis (Dùng cho Caching, Rate limiting, Locks)
├── auth.ts                     # Logic Authentication: Ký/Giải mã JWT, Hash password (bcrypt), Kiểm tra quyền Admin
├── mail.ts                     # Hệ thống Email: Cấu hình Nodemailer SMTP, Gửi mail HTML từ template
├── encryption.ts               # Tiện ích Mã hóa 2 chiều (AES-256) cho dữ liệu nhạy cảm (SĐT, Địa chỉ)
├── api-utils.ts                # Helpers API: Hàm tạo Response chuẩn (Success/Error), Wrapper xử lý Try-Catch tập trung
├── cache.ts                    # Hàm wrapper để Cache dữ liệu DB vào Redis tự động (getOrSetCache)
├── cloudinary.ts               # Cấu hình và tiện ích upload ảnh lên Cloudinary
├── date-utils.ts               # Các hàm định dạng ngày tháng (Format date, Timezone conversion, Relative time)
├── dictionary.ts               # Từ điển đa ngôn ngữ (i18n) cho ứng dụng
├── email-templates.ts          # Chứa các mẫu HTML Email (Chào mừng, Xác nhận đơn, Reset password...)
├── image-service.ts            # Service xử lý hình ảnh (Resize, Optimize, Upload)
├── order-logic.ts              # Logic nghiệp vụ bổ trợ cho đơn hàng (Tính tổng tiền, Validate trạng thái)
├── queue.ts                    # Cấu hình hàng đợi (Queue) xử lý tác vụ nền
├── rate-limit.ts               # Logic giới hạn tần suất request (Rate Limiting) dùng Redis
├── sanitize.ts                 # Hàm làm sạch dữ liệu đầu vào để chống XSS và SQL Injection
├── utils.ts                    # Các hàm tiện ích nhỏ chung (Generate ID, Sleep, Random string...)
├── worker.ts                   # Worker xử lý background job (Gửi mail, dọn dẹp data cũ)
└── with-rate-limit.ts          # Higher-Order Function áp dụng Rate Limit cho API Route
```

### 3.2. Hệ thống API (`/src/app/api`) - **Backend Endpoints**
Các route API tuân thủ chuẩn RESTful, nhận request từ Client và trả về JSON.

```text
src/app/api/
├── auth/                       # API Nhóm Xác thực
│   ├── login/route.ts          # POST: Đăng nhập User, trả về Access Token + Refresh Token
│   ├── register/route.ts       # POST: Đăng ký tài khoản User mới
│   ├── refresh/route.ts        # POST: Cấp lại Access Token mới từ Refresh Token
│   ├── logout/route.ts         # POST: Đăng xuất, xóa cookie Auth
│   ├── admin/route.ts          # POST: Đăng nhập dành riêng cho Admin
│   ├── forgot-password/route.ts# POST: Gửi email reset mật khẩu
│   ├── reset-password/route.ts # POST: Đặt lại mật khẩu mới từ token reset
│   ├── google/route.ts         # GET: Bắt đầu quy trình đăng nhập Google OAuth
│   ├── google/callback/route.ts# GET: Xử lý callback từ Google sau khi user login
│   ├── facebook/route.ts       # GET: Bắt đầu quy trình đăng nhập Facebook OAuth
│   ├── facebook/callback/route.ts # GET: Xử lý callback từ Facebook
│   └── user/route.ts           # GET: Lấy thông tin User hiện tại từ Token
├── admin/                      # API Nhóm Admin (Bảo vệ bằng quyền Admin)
│   ├── dashboard/route.ts      # GET: Thống kê tổng quan (Doanh thu, Đơn hàng, Lợi nhuận)
│   ├── products/               # CRUD Sản phẩm
│   │   ├── route.ts            # GET: Danh sách sản phẩm, POST: Tạo sản phẩm mới
│   │   └── [id]/route.ts       # GET: Chi tiết, PUT: Cập nhật, DELETE: Xóa sản phẩm
│   ├── orders/                 # Quản lý Đơn hàng
│   │   ├── route.ts            # GET: Danh sách đơn hàng (Phân trang, Lọc)
│   │   └── [id]/route.ts       # GET: Chi tiết đơn, PATCH: Cập nhật trạng thái đơn
│   ├── vouchers/               # Quản lý Mã giảm giá
│   │   ├── route.ts            # GET: Danh sách Voucher, POST: Tạo Voucher
│   │   └── [id]/route.ts       # PUT: Sửa Voucher, DELETE: Xóa Voucher
│   ├── users/                  # Quản lý Người dùng
│   │   ├── route.ts            # GET: Danh sách User
│   │   └── [id]/route.ts       # GET: Chi tiết User, PATCH: Khóa/Mở khóa User
│   └── ... (nhiều API admin khác: banners, categories, flash-sales, gift-cards, reviews, settings)
├── products/                   # API Nhóm Sản phẩm Public
│   ├── route.ts                # GET: Lấy danh sách sản phẩm (Home page)
│   ├── search/route.ts         # GET: Tìm kiếm sản phẩm (Query param `q`)
│   └── [id]/route.ts           # GET: Lấy chi tiết một sản phẩm theo ID/Slug
├── orders/                     # API Nhóm Đặt hàng User
│   ├── route.ts                # POST: Tạo đơn hàng mới (Checkout process)
│   ├── [orderNumber]/route.ts  # GET: Lấy thông tin đơn hàng của User theo mã đơn
│   └── lookup/route.ts         # POST: Tra cứu đơn hàng cho khách vãng lai (qua Email/SĐT)
├── cart/                       # API Nhóm Giỏ hàng
│   ├── route.ts                # GET: Lấy giỏ hàng, POST: Thêm sản phẩm vào giỏ
│   ├── [id]/route.ts           # DELETE: Xóa sản phẩm khỏi giỏ, PATCH: Cập nhật số lượng
│   ├── check-balance/route.ts  # GET: Kiểm tra số dư thẻ quà tặng trong giỏ
│   └── release/route.ts        # POST: Giải phóng tồn kho khi giỏ hàng hết hạn session
└── socket/                     # (Lưu ý: Route này dùng Pages Router để init Socket.io)
    └── socket.ts               # API Route khởi tạo WebSocket Server instance
```

### 3.3. Giao diện người dùng (`/src/app`) - **Frontend Pages**
Sử dụng Next.js App Router (Server Components mặc định).

```text
src/app/
├── (shop)/                     # Route Group mua sắm (Public Interface)
│   ├── page.tsx                # Trang chủ (Homepage) - Hiển thị Banner, Featured Products
│   ├── cart/page.tsx           # Trang giỏ hàng - Xem item, nhập mã giảm giá
│   ├── checkout/page.tsx       # Trang thanh toán - Nhập địa chỉ, chọn phương thức thanh toán
│   ├── products/
│   │   └── [slug]/page.tsx     # Trang chi tiết sản phẩm - Thông tin, chọn size, Add to cart
│   ├── category/
│   │   └── [slug]/page.tsx     # Trang danh mục sản phẩm - Lọc theo category
│   ├── account/                # Trang quản lý tài khoản User
│   │   ├── settings/page.tsx   # Cài đặt profile, đổi mật khẩu
│   │   └── vouchers/page.tsx   # Danh sách mã giảm giá của tôi
│   ├── order-success/page.tsx  # Trang cảm ơn sau khi đặt hàng thành công
│   └── order-lookup/page.tsx   # Trang tra cứu đơn hàng vãng lai
├── admin/                      # Route Group quản trị (Protected Interface)
│   ├── page.tsx                # Redirect về dashboard hoặc login
│   ├── login/page.tsx          # Trang đăng nhập dành riêng cho Admin
│   ├── dashboard/page.tsx      # Bảng điều khiển chính (Biểu đồ, Số liệu KPI)
│   ├── products/               # Quản lý Sản phẩm
│   │   ├── page.tsx            # Danh sách sản phẩm (Table view)
│   │   ├── new/page.tsx        # Form tạo sản phẩm mới
│   │   └── [id]/edit/page.tsx  # Form chỉnh sửa sản phẩm
│   ├── orders/                 # Quản lý Đơn hàng
│   │   ├── page.tsx            # Danh sách đơn hàng
│   │   └── [id]/page.tsx       # Chi tiết đơn hàng & Xử lý trạng thái
│   ├── vouchers/               # Quản lý khuyến mãi
│   │   └── promo-codes/page.tsx # Danh sách mã giảm giá chung
│   └── layout.tsx              # Layout riêng cho Admin (Sidebar, Header, Auth Guard)
├── layout.tsx                  # Root Layout (Chứa Navbar, Footer, Global Providers)
├── loading.tsx                 # Loading UI mặc định khi chuyển trang
├── error.tsx                   # Error UI mặc định khi có lỗi runtime
├── not-found.tsx               # Trang lỗi 404 tùy chỉnh
└── globals.css                 # File CSS toàn cục (Tailwind directives, Custom fonts)
```

### 3.4. Components (`/src/components`) - **UI Building Blocks**
Các thành phần giao diện tái sử dụng.

```text
src/components/
├── ui/                         # Base Components (Shadcn UI - Atomic design)
│   ├── button.tsx              # Button chuẩn (Variants: default, destructive, outline...)
│   ├── input.tsx               # Input field chuẩn
│   ├── dialog.tsx              # Modal/Popup dialog
│   ├── toast.tsx               # Toast notification component
│   ├── card.tsx                # Card container component
│   ├── table.tsx               # Data table component
│   └── ... (nhiều component cơ bản khác: dropdown, select, tabs, checkbox...)
├── admin/                      # Components đặc thù cho trang Admin
│   ├── AdminSidebar.tsx        # Menu điều hướng bên trái Admin
│   ├── AdminHeader.tsx         # Header Dashboard (Search, User menu)
│   ├── RecentOrders.tsx        # Widget hiển thị đơn hàng mới nhất trên Dashboard
│   └── Overview.tsx            # Widget biểu đồ doanh thu (Recharts)
├── chat/                       # Hệ thống Chat
│   ├── ChatWidget.tsx          # Widget chat nổi cho khách hàng (AI Support + Live Chat switch)
│   └── LiveSupportChat.tsx     # Giao diện chat trực tiếp với nhân viên hỗ trợ
├── layout/                     # Components bố cục trang Web
│   ├── Header.tsx              # Navbar chính (Logo, Menu, Cart icon, User dropdown)
│   ├── Footer.tsx              # Footer toàn trang (Links, Social icons, Copyright)
│   └── MobileMenu.tsx          # Menu dạng Drawer cho mobile
├── product/                    # Components hiển thị sản phẩm
│   ├── ProductCard.tsx         # Card hiển thị tóm tắt sản phẩm (Ảnh, Tên, Giá)
│   ├── ProductGallery.tsx      # Gallery ảnh chi tiết sản phẩm (Thumbnail + Zoom)
│   └── ProductFilters.tsx      # Bộ lọc sản phẩm bên trái trang danh mục
└── checkout/                   # Components trang thanh toán
    ├── CheckoutForm.tsx        # Form nhập thông tin giao hàng
    └── OrderSummary.tsx        # Tóm tắt đơn hàng và tính tổng tiền bên phải
```

### 3.5. Các thư mục hỗ trợ khác
```text
src/
├── contexts/                   # React Context (Quản lý State toàn cục Client-side)
│   ├── AuthContext.tsx         # Quản lý phiên đăng nhập User, hàm login/logout
│   ├── CartContext.tsx         # Quản lý giỏ hàng (State items, hàm add/remove, sync local storage)
│   ├── WishlistContext.tsx     # Quản lý danh sách yêu thích
│   └── LanguageContext.tsx     # Quản lý ngôn ngữ (nếu đa ngôn ngữ)
├── hooks/                      # Custom React Hooks (Reusable Logic)
│   ├── useDebounce.ts          # Hook trì hoãn execution (thường dùng cho Search input)
│   ├── useToast.ts             # Hook gọi thông báo Toast
│   ├── useAuth.ts              # Hook truy cập AuthContext nhanh
│   ├── useCart.ts              # Hook truy cập CartContext nhanh
│   └── useMediaQuery.ts        # Hook kiểm tra kích thước màn hình (Responsive logic trong JS)
├── types/                      # TypeScript Definitions (Interfaces & Types)
│   ├── index.ts                # File index export các type chung
│   └── ... (có thể có các file type riêng nếu dự án lớn, hiện tại đang gom ở index hoặc inline)
└── workers/                    # Background Workers (Xử lý tác vụ không đồng bộ)
    └── eventWorker.ts          # Worker lắng nghe Event Bus để xử lý tác vụ nền (Gửi mail welcome, Tính điểm thưởng...)
```
