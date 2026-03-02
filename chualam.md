# 📋 DANH SÁCH CÁC TÍNH NĂNG CHƯA TRIỂN KHAI (TOAN STORE)

Dưới đây là danh sách các yêu cầu từ `yeucau.md` chưa được hoàn thiện, kèm theo giải thích chi tiết bằng tiếng Việt.

---

## 🔐 1. Authentication & Authorization
*   **Đăng nhập bằng Apple ID**: Cho phép người dùng iPhone/Mac đăng nhập nhanh bằng tài khoản Apple. (Cần tài khoản Developer trả phí).
*   **Đăng nhập bằng SĐT (OTP)**: Xác thực người dùng qua mã gửi đến điện thoại. (Cần tích hợp các bên như Twilio/Nexmo).
*   **2FA qua SMS**: Tăng cường bảo mật bằng cách gửi mã OTP qua tin nhắn thay vì chỉ qua Email.
*   **Biometric Authentication**: Đăng nhập bằng vân tay hoặc khuôn mặt (FaceID/TouchID). (Chỉ áp dụng khi có app Mobile native).

## 👤 2. User Profile & Account
*   **Google Places API Integration**: Tự động gợi ý và điền địa chỉ khi người dùng nhập thông tin giao hàng, giúp giảm sai sót và tăng tốc độ checkout.

## 📦 3. Product Details
*   **360-degree Product View**: Cho phép khách hàng xoay xem sản phẩm từ mọi góc độ. (Cần ảnh chụp 360 hoặc model 3D).
*   **Đo size theo chiều dài bàn chân**: Tính năng AR hoặc hướng dẫn camera để gợi ý size giày chuẩn nhất cho khách.
*   **Notify when back in stock**: Hệ thống đăng ký nhận thông báo tự động khi một mẫu giày/size đang hết hàng được nhập thêm vào kho.

## 🛒 4. Checkout & Payment
*   **Multi-step Checkout**: Chia quá trình thanh toán thành 3 bước (Giao hàng -> Thanh toán -> Xác nhận) để giảm tải tâm lý cho khách hàng.
*   **Tích hợp thêm Cổng thanh toán**: ZaloPay, Stripe (Quốc tế), PayPal, Apple Pay, Google Pay.
*   **Reconciliation Report**: Báo cáo đối soát tự động giữa các giao dịch trên web và sao kê thực tế từ ngân hàng/cổng thanh toán.
*   **Chargeback Handling**: Quy trình xử lý khi khách hàng khiếu nại giao dịch với ngân hàng để đòi lại tiền.

## 🎁 5. Loyalty & Rewards
*   **Point Redemption Catalog**: Trang danh mục cho phép đổi điểm tích lũy lấy Voucher, quà tặng hoặc thẻ cào (hiện tại mới chỉ có tích điểm, chưa có nơi để tiêu điểm).
*   **Tier Maintenance/Downgrade**: Logic tự động hạ hạng thành viên nếu trong một khoảng thời gian khách không phát sinh giao dịch đủ yêu cầu.

## 👥 6. Referral Program (Chương trình giới thiệu)
*   **Full Referral System**: Toàn bộ hệ thống tạo mã giới thiệu, theo dõi người đăng ký mới qua link giới thiệu và tặng quà cho người giới thiệu.

## 🔍 7. Search & Discovery
*   **Image Search**: Cho phép người dùng tải ảnh lên để tìm sản phẩm tương tự.
*   **Frequently Bought Together**: Gợi ý các sản phẩm thường được mua cùng nhau (như giày + tất + bộ vệ sinh).
*   **Personalized Homepage**: Trang chủ thay đổi nội dung dựa trên sở thích và hành vi lướt web của từng cá nhân.

## 💬 8. Customer Support (ĐÃ HOÀN THÀNH ✅)
*   [x] **File/Image Attachment in Chat**: Cho phép khách gửi ảnh chụp lỗi sản phẩm hoặc hóa đơn trực tiếp trong khung chat. (Hỗ trợ cả PDF/Word/Excel, giới hạn 20MB).
*   [x] **Typing Indicators & Read Receipts**: Hiển thị trạng thái "đang nhập tin nhắn" và "đã xem" giống như Messenger/Zalo.
*   [x] **SLA Tracking**: Hệ thống theo dõi thời gian phản hồi của nhân viên hỗ trợ để đảm bảo chất lượng phục vụ.

## 📧 9. Notifications
*   **Newsletter & Promo Campaign System**: Hệ thống quản lý gửi email hàng loạt để quảng bá các chiến dịch khuyến mãi hoặc sản phẩm mới.

## 📊 10. Analytics & Admin Tools
*   **User Retention & Cohort Analysis**: Phân tích tỷ lệ khách quay lại mua hàng theo thời gian.
*   **Bulk Import/Export (CSV/Excel)**: Tính năng nhập/xuất hàng loạt hàng ngàn sản phẩm hoặc đơn hàng để quản lý nhanh hơn.
*   **Drag & Drop Reorder**: Cho phép Admin kéo thả để sắp xếp vị trí danh mục sản phẩm trên web.

## 📦 11. Inventory & Warehouse
*   **Barcode/QR Scanning**: Sử dụng máy quét để nhập/xuất kho nhanh chóng thay vì nhập tay.
*   **Batch/Lot Tracking**: Theo dõi sản phẩm theo lô sản xuất để dễ dàng xử lý khi có lỗi hàng loạt.

## 🚚 12. Shipping Integration (Vận chuyển)
*   **API Vận chuyển thực tế**: Kết nối trực tiếp với GHTK, GHN, ViettelPost để lấy mã vận đơn và tính phí ship theo thời gian thực dựa trên cân nặng/khoảng cách.
*   **Auto-generate Shipping Label**: Tự động tạo và in nhãn dán đơn hàng cho shipper.

---
**Ghi chú**: Dự án hiện đã đạt 82% yêu cầu. Các mục trên là những mảnh ghép cuối cùng để đạt chuẩn Enterprise quốc tế.
