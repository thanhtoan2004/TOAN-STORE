# Danh sách Toàn bộ 148 API Dự án TOAN STORE

Dưới đây là danh sách toàn bộ 148 API endpoints hiện có trong dự án, được phân chia theo module kèm theo giải thích chức năng của từng API.

## 1. Account (`/api/account`)
- `POST /api/account/change-password`: Đổi mật khẩu người dùng (yêu cầu mật khẩu cũ).
- `DELETE /api/account/delete`: Xóa tài khoản người dùng hiện tại (soft delete).
- `GET /api/account/export`: Xuất toàn bộ dữ liệu cá nhân của user (chuẩn GDPR).
- `GET /api/account/sessions`: Lấy danh sách các phiên đăng nhập (thiết bị) của user.
- `GET /api/account/transactions/export`: Xuất lịch sử giao dịch điểm/ví của user ra file Excel/CSV.
- `PUT /api/account/update`: Cập nhật thông tin hồ sơ người dùng (tên, số điện thoại, avatar).
- `POST /api/account/verify-password`: Xác thực mật khẩu trước khi thực hiện hành động nhạy cảm.

## 2. Addresses (`/api/addresses`)
- `GET / POST / PUT / DELETE /api/addresses`: Quản lý danh bạ địa chỉ giao hàng của người dùng.

## 3. Admin (`/api/admin`)
**Analytics & Dashboard**
- `GET /api/admin/analytics`: Lấy dữ liệu biểu đồ doanh thu, số lượng đơn hàng tổng quan.
- `GET /api/admin/analytics/profit`: Thống kê biên lợi nhuận, chi phí và doanh thu cốt lõi của Admin.
- `GET /api/admin/dashboard`: Lấy các con số thống kê tổng quan hiển thị trên trang chủ Dashboard.
- `GET /api/admin/search-analytics`: Khảo sát từ khóa tìm kiếm phổ biến của khách hàng.
- `GET /api/admin/metrics/trigger`: Kích hoạt job cron để tính toán và lưu trữ data metrics ngay lập tức.
- `GET /api/admin/audit-logs`: Lấy dòng thời gian lịch sử thao tác của các Admin trên hệ thống (Audit Trail).
- `GET/PUT /api/admin/settings`: Tùy chỉnh các cấu hình chung của hệ thống (phí ship, ngưỡng free ship, URL MXH).
- `GET /api/admin/seo`: Quản lý các thẻ meta SEO (tiêu đề, mô tả, từ khóa) tổng quan cho trang web.

**Catalogs (Categories, Products, Attributes, Brands)**
- `GET / POST / PUT / DELETE /api/admin/categories`: Quản lý danh mục sản phẩm (Nested categories).
- `PUT /api/admin/categories/reorder`: Kéo thả sắp xếp lại thứ tự hiển thị của danh mục.
- `GET / POST /api/admin/products`: Lấy danh sách hoặc tạo sản phẩm mới.
- `GET / PUT / DELETE /api/admin/products/:id`: Xem chi tiết, cập nhật hoặc xóa sản phẩm cụ thể.
- `PUT /api/admin/products/:id/attributes`: Cập nhật thuộc tính động (specs) của riêng một sản phẩm.
- `GET / POST /api/admin/products/bulk`: Xuất tất cả sản phẩm ra file Excel hoặc Nhập sản phẩm hàng loạt (Import Excel).
- `GET / PUT / POST / DELETE /api/admin/attributes`: Quản lý thư viện thuộc tính dùng chung.

**Orders & Shipments & Refunds**
- `GET / POST /api/admin/orders`: Quản lý lịch sử đơn hàng của toàn hệ thống.
- `GET / PATCH /api/admin/orders/:id`: Lấy chi tiết đơn hàng hoặc cập nhật trạng thái (State Machine).
- `GET /api/admin/orders/export`: Xuất danh sách đơn hàng ra file Excel.
- `GET /api/admin/shipments`: Theo dõi toàn bộ các lô hàng đang vận chuyển.
- `GET /api/admin/refunds`: Quản lý các yêu cầu trả hàng/hoàn tiền.
- `GET / PATCH /api/admin/refunds/:id`: Xem chi tiết và Duyệt/Từ chối yêu cầu hoàn tiền.

**Inventory & Warehouses**
- `GET / POST / PUT / DELETE /api/admin/warehouses`: Quản lý danh sách các kho hàng vật lý.
- `GET /api/admin/inventory`: Bảng theo dõi tồn kho trên tất cả kho hàng.
- `PUT /api/admin/inventory/:id`: Cập nhật số lượng tồn kho theo sản phẩm/phiên bản.
- `GET /api/admin/inventory/alerts`: Cảnh báo các mặt hàng sắp hết hoặc tồn kho lâu ngày.
- `GET / POST /api/admin/inventory/transfers`: Quản lý lệnh điều chuyển hàng hóa giữa các kho.
- `GET / PATCH /api/admin/inventory/transfers/:id`: Phê duyệt/từ báo cáo phiếu điều chuyển kho.

**Customers (Users & Segments)**
- `GET /api/admin/users`: Danh sách toàn bộ User và Admin.
- `GET / PATCH /api/admin/users/:id`: Xem chi tiết hoặc Ban/Unban, phân quyền user.
- `GET /api/admin/users/export`: Xuất tệp thông tin khách hàng ra CSV/Excel.
- `GET /api/admin/customer-segments`: Quản lý các tập khách hàng phân khúc theo hành vi (VIP, New, Churning).

**Sales & Promotions (Flash Sales, Vouchers, Gift Cards, Promo Codes)**
- `GET / POST /api/admin/flash-sales`: Quản lý các chiến dịch Flash Sale.
- `GET / PUT / DELETE /api/admin/flash-sales/:id`: Xem, sửa, xóa cấu hình Flash Sale.
- `POST /api/admin/flash-sales/:id/items`: Thêm các sản phẩm vào Flash Sale cụ thể.
- `GET /api/admin/vouchers`: Quản lý Voucher cá nhân cho người dùng.
- `GET /api/admin/promo-codes`: Quản lý Promo Codes chung.
- `GET / PUT / DELETE /api/admin/promo-codes/:id`: Xem, sửa, xóa Promo Code.
- `GET / POST /api/admin/gift-cards`: Quản lý thẻ quà tặng Gift Card.
- `GET / DELETE /api/admin/gift-cards/:id`: Xem khóa thẻ quà tặng.
- `PATCH /api/admin/gift-cards/:id/unlock`: Mở khóa thẻ Gift Card nếu bị tấn công Brute-force.

**Content & Marketing (Banners, News, FAQs, Contact)**
- `GET / POST / PUT / DELETE /api/admin/banners`: Quản lý Banners quảng cáo.
- `GET / POST /api/admin/news`: Trình quản lý bài viết Tin tức / Blog.
- `GET / PUT / DELETE /api/admin/news/:id`: Sửa, xóa bài blog.
- `GET / POST / PUT / DELETE /api/admin/faqs`: Quản lý Câu hỏi thường gặp.
- `GET /api/admin/contact`: Danh sách thư liên hệ gửi tới hệ thống.
- `GET / PUT / DELETE /api/admin/contact/:id`: Đọc thư và Trả lời khách hàng.
- `GET /api/admin/recommendations/sync`: Đồng bộ lại model gợi ý sản phẩm dựa trên lịch sử mua mới nhất.

**Support, Reviews & Utilities**
- `GET /api/admin/reviews`: Bảng quản lý toàn bộ đánh giá sản phẩm.
- `GET / PUT / DELETE /api/admin/reviews/:id`: Chi tiết, Duyệt/Ẩn bình luận đánh giá.
- `GET /api/admin/support/chats`: Xem danh sách tất cả các luồng Live Chat hỗ trợ.
- `GET / PUT /api/admin/support/chats/:chatId`: Quản lý phiên chat cụ thể.
- `POST /api/admin/cleanup-tokens`: Thao tác dọn dẹp (xóa) dứt điểm token/refresh token hết hạn.
- `GET /api/admin/wishlist`: Thống kê các sản phẩm được đưa vào Wishlist nhiều nhất.

## 4. Auth (`/api/auth`)
- `POST /api/auth/login`: Xác thực đăng nhập bằng Email/Password cho User.
- `POST /api/auth/login-admin`: Chuyên đăng nhập cho Admin (kiểm tra Role đặc quyền).
- `POST /api/auth/register`: Người dùng đăng ký tài khoản mới.
- `POST /api/auth/logout`: Đăng xuất (xóa token cookie).
- `POST /api/auth/logout-all`: Đăng xuất tất cả thiết bị (kích hoạt Token Revision).
- `POST /api/auth/refresh`: Sinh mã Access Token mới dựa trên Refresh Token đang dùng hợp lệ.
- `GET /api/auth/user`: Lấy thông tin phiên bản người dùng hiện tại (JWT Decoding).
- `GET /api/auth/admin`: Lấy thông tin Admin đăng nhập hiện tại.
- `POST /api/auth/forgot-password`: Quên mật khẩu.
- `POST /api/auth/reset-password`: Thay mật khẩu qua mã khôi phục.
- `GET /api/auth/google`, `GET /api/auth/google/callback`: Đăng nhập SSO bằng Google (OAuth2).
- `GET /api/auth/facebook`, `GET /api/auth/facebook/callback`: Đăng nhập SSO bằng Facebook (OAuth2).
**Xác thực đa lớp (2FA)**
- `POST /api/auth/2fa/send`: Gửi mã OTP xác thực 2 bước (2FA) qua Email.
- `POST /api/auth/2fa/verify`: Xác minh OTP để hoàn thiện bước Login.
- `POST /api/auth/2fa/toggle`: Kích hoạt ON/OFF 2FA.

## 5. Banners (`/api/banners`)
- `GET /api/banners`: Lấy danh sách banner active hiển thị tại trang chủ.
- `POST /api/banners/click`: API Telemetry ghi nhận các lượt click vào banner từ Client.

## 6. Cart (`/api/cart`)
- `GET / POST / DELETE /api/cart`: API tương tác cơ bản Cập nhật hàng hóa nằm trong Giỏ hàng.
- `PUT / DELETE /api/cart/:id`: Điều chỉnh số lượng hàng hóa và Xóa nhanh vật dụng khỏi giỏ.
- `POST /api/cart/reserve`: Kích hoạt chốt phiên hàng Checkout - Giữ Stock (Reservation).
- `POST /api/cart/release`: Xóa chốt khóa tạm giữ hàng ra khỏi Slot chờ mua.
- `POST /api/cart/check-balance`: Tra cứu thử số dư hiện còn của Thẻ quà tặng lúc thanh toán.

## 7. Categories (`/api/categories`)
- `GET /api/categories`: Fetch cấu trúc cây Categories hiển thị ra Menu.

## 10. Cron Jobs (`/api/cron`)
- `GET /api/cron/abandoned-cart`: Quét và Gửi Email "Xin nhắc quên Thanh toán giỏ hàng" tới khách bỏ sót.
- `GET /api/cron/cleanup-orders`: Cron Job dọn tự động Đơn đặt Pending > 24H kô kết toán.
- `GET /api/cron/cleanup-reservations`: Quét dọn các mục Booking Reservation Quá giờ chưa trả phòng/giữ hàng.
- `GET /api/cron/marketing-automation`: Cron gọi chạy chiến dịch tự động hóa marketing.
- `GET /api/cron/wishlist-alerts`: Cron quét Giá giảm để Bắn Email cho người có item đó trong Wishlist.

## 11. Debug (`/api/debug`)
- `GET /api/debug/rbac`: API dev test quyền hành Access Matrix.
- `POST /api/debug/sentry`: Bắn test alert crash ảo sang Sentry Error Logs.

## 12. Content (FAQs & News & Newsletter)
- `GET /api/faqs`: List dạng text câu hỏi thường gặp public.
- `GET /api/news`: Truy xuất News CMS List Blogs.
- `GET /api/news/:slug`: API xem body 1 bài tin tức hoàn chỉnh SEO URL slug.
- `GET /api/news/author/:id`: Xem thông tin Author Admin (người biên soạn) và các bài viết của họ.
- `GET / POST /api/news/:slug/comments`: Hệ thống Comment đa phân nhánh trên bài đăng News.
- `POST /api/news/:slug/comments/likes`: Chức năng nút Like/Khích lệ trên từng cục nhận xét chữ.
- `POST /api/newsletter`: Subscribe Đăng ký vào list nhận tin tức giảm giá sớm nhất.

## 13. Flash Sales (`/api/flash-sales`)
- `GET /api/flash-sales/active`: Trigger gọi chiến dịch "Săn Sale Giá Sốc" gần nhất có kèm hiệu lực H:m:S báo dóng trên web.

## 14. Gift Cards (`/api/gift-cards`)
- `POST /api/gift-cards/verify`: Tra mã bí mật (PIN) Token hợp chuẩn lúc áp thẻ gift tặng.
- `GET /api/gift-cards/history`: Bản sao kê log từng giao dịch xài trừ tiền số lần dùng Thẻ.

## 15. System Health (`/api/health*`)
- `GET /api/health`: Monitor DB / Redis connect states cho K8s Readness Probe.
- `GET /api/init-db`: Hàm Seed API ẩn (Tạo Data giả lúc làm xong deploy lên Host trống).
- `GET /api/maintenance-check`: Cơ chế chặn request Client tự động báo trang "Bảo trì nâng cấp".

## 16. Notifications (`/api/notifications`)
- `GET / POST / DELETE /api/notifications`: Inbox hòm thư Notification nội bộ Web App cho account (Ting ting chuông).
- `POST /api/notifications/order-confirmation`: Kịch hoạt kịch bản Build + Send Email xác nhận chốt bill mua về hộp thư gmail cá nhân.

## 17. Orders (`/api/orders`)
- `GET / POST /api/orders`: Danh sách và API Place Order Chốt đặt bill cho khách User/Guest.
- `GET /api/orders/:orderNumber`: Thông tin hóa đơn tracking chi tiết theo số đơn hàng Code ID.
- `GET /api/orders/lookup`: Feature tự nhập mã ID đơn hàng ra tiến độ ship cho kẻ không account.
- `GET /api/orders/:orderNumber/shipping`: Phí giá trị ship vận tải kết nối hãng nội địa bưu cục bên GiaoHàngNhanh/ViettelPost.
- `GET /api/orders/:orderNumber/tracking`: Quá trình vận tải kiện hàng (Packing > Gửi bưu cục > Đang Ship).

## 18. Payments (`/api/payment`)
- `POST /api/payment/confirm`: Điểm bắt sự kiện Hoàn tất Pay Checkout tay giả lập nội mạng.
**VNPay Gateway**
- `POST /api/payment/vnpay/create_url`: Link Gen gửi đến Bank VN để thu tiền Việt.
- `GET /api/payment/vnpay/ipn`: Kênh Endpoint Callback tự động của Bot VNPAY gọi về đổi trạng thái đã thu tiền = Done.
- `GET /api/payment/vnpay/return`: View HTML Success Redirect Landing Page dành riêng VNPAY UI.
**MoMo Gateway**
- `POST /api/payment/momo/create`: Tạo Session QR Scan chuyển tiền 11 số ví MOMO.
- `POST /api/payment/momo/ipn`: Hook IPN Trả biến `resultCode = 0` (thành công) tự đóng băng báo Đơn qua bước Ship.

## 19. Products (`/api/products`)
- `GET /api/products`: View Grid Danh sách sản phẩm Filter & Paginate chính.
- `GET /api/products/:slug`: Data Page Landing riêng mặt hàng theo tên thân thiện SEO.
- `GET /api/products/:slug/related`: API Cross-sell (Khách hay mua chung với sản phẩm C D).
- `GET /api/products/:slug/similar`: Sản phẩm Up-sell tương thích chung phân loài thay thế.
- `GET /api/products/:slug/variants`: Array kích cỡ/màu sắc chi nhánh tồn SKU.
- `GET /api/products/search`: Nút thanh Search Auto-Suggestion trên Header (Typeahead).

## 20. Promo Codes (`/api/promo-codes`)
- `GET /api/promo-codes/available`: Khay Coupon Công khai có sẵn (e.g., TET2024, XMAS50).
- `GET /api/promo-codes/history`: Logic kiểm chặn xài đè Promo code lần T2.
- `POST /api/promo-codes/validate`: Tính nhẩm % quy đổi Voucher mã khi Nhập bằng tay.

## 21. Refunds (`/api/refunds`)
- `GET / POST /api/refunds`: Kênh API khiếu nại User (1 Đơn hàng hỏng/sai mẫu) bấm Report Đổi/Trả.

## 22. Reviews (`/api/reviews`)
- `GET / POST /api/reviews`: Form Submit Comment Trải nghiệm sao cho giày/áo mua xong ở trang Chi tiết.
- `GET /api/reviews/check-purchase`: Guard báo cáo "Người dùng này chưa có mua, cấm thao tác bình luận chửi!".
- `POST /api/reviews/helpful`: Nút bấm Thank/Agree với bình luận người khác viết hay.
- `POST /api/reviews/media`: API Uploader file video review riêng để đính lên Storage tách luồng Upload Chính.
- `POST /api/reviews/upload`: Router phân phối phụ của process media review.

## 23. Stores (`/api/stores`)
- `GET /api/stores`: Load dữ liệu địa chỉ Map Location 40 Cửa hàng Store thực tế dưới phố để tra.

## 24. Live Chat Support (`/api/support`)
- `POST /api/support/chat/start`: Enduser kích vào bong bóng Chat góc dưới Website hỏi "Tôi cần tư vấn".
- `GET / POST /api/support/chat/:chatId/messages`: Socket Logic Push/Pull văn bản Chatting realtime.
- `POST /api/support/chat/:chatId/read`: "Đã xem lúc..." trạng thái check tin nhắn Support chat.
- `POST /api/support/chat/:chatId/close`: Nút "Ket Thuc Ho Tro" đẩy luồng ticket vào Kho Lịch sử Admin.

## 25. Transactions (`/api/transactions`)
- `GET /api/transactions`: Danh mục dòng tiền ảo VÍ (Point Vault) trừ cộng qua thời gian.
- `GET /api/transactions/export`: In Excel/PDF bảng sao kê dòng Point Balance theo Quý.

## 26. Uploads (`/api/upload`)
- `POST /api/upload`: Endpoint tiếp nhận Multipart FormData Files (Upload Avatar, Photo Product, Chứng từ).

## 27. User Loyalty & Vouchers (`/api/user`)
- `GET / POST /api/user/redeem`: Bảng Điểm Tích Lũy Bấm nút quy đổi 1000$ Point lấy Mã Giảm Món 50K (Nguyên tử hóa Atomicity xử lý đè song song).
- `GET /api/user/vouchers`: My Vouchers (Các thẻ quà tặng ưu đãi hiện còn hiệu lực của user đang mở trong ví Account).

## 28. Wishlist (`/api/wishlist`)
- `GET / POST / DELETE /api/wishlist`: Trái tim Favorite Add to Kho Hàng Thích Chờ Theo Dõi.

---
**Tổng cộng: 148 Endpoints API**  
*Toàn bộ API được bảo mật với JWT phân tầng RBAC Roles, kiểm duyệt input thông qua Schema Zod nghiêm ngặt và hạn ngạch rải đều.*
