import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from 'react';
import RootLayoutWrapper from "@/components/RootLayoutWrapper";

// Import toàn bộ các Context Providers để cung cấp State Global cho ứng dụng
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import { ModalProvider } from "@/contexts/ModalContext";
import { Toaster } from 'react-hot-toast';

// Import các Widgets và Component dùng chung toàn trang (Global Ui)
import ChatWidget from "@/components/chat/ChatWidget";
import Pixel from "@/components/analytics/Pixel";
import ScrollToTop from '@/components/ui/ScrollToTop';
import BottomNavBar from '@/components/ui/BottomNavBarWrapper';
import CookieConsent from '@/components/ui/CookieConsent';
import AccessibilityWidget from '@/components/ui/AccessibilityWidget';
import ComparisonBar from '@/components/ui/ComparisonBar';
import PushNotificationBanner from '@/components/ui/PushNotificationBanner';
import AppInstallBanner from '@/components/ui/AppInstallBanner';

/**
 * Định nghĩa Global Metadata cho SEO (Search Engine Optimization)
 * Các trang con có thể ghi đè lại giá trị thông qua tính năng template của Next.js
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | TOAN Store', // Ví dụ: Giày Nam | TOAN Store
    default: 'TOAN Store - Just Do It',
  },
  description: "TOAN Store delivers innovative products, experiences and services to inspire athletes.",
  openGraph: {
    title: 'TOAN Store',
    description: 'The best place to buy premium products at TOAN Store.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'TOAN Store',
    images: [
      {
        url: '/og-image.jpg', // Ảnh mặc định khi chia sẻ link lên Facebook, Zalo, Twitter...
        width: 1200,
        height: 630,
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  keywords: ['toan store', 'giày thể thao', 'giày chạy bộ', 'thời trang thể thao', 'TOAN Store vietnam'],
};


/**
 * RootLayout Component
 * Đây là khung sườn bao bọc toàn bộ component trong project Next.js.
 * Tất cả các trang sẽ được render lồng vào bên trong tham số {children}.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning giúp bỏ qua lỗi chênh lệch giao diện SSR và CSR ban đầu
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="crossOrigin" content="anonymous" />
      </head>

      <body className="overflow-x-hidden" suppressHydrationWarning>
        {/* Lớp bọc bảo mật và quản lý thông tin User */}
        <AuthProvider>
          {/* Lớp bọc quản lý Modal toàn cục */}
          <ModalProvider>
            {/* Lớp bọc quản lý Fetching/Caching data của React Query */}
            <QueryProvider>
              {/* Lớp bọc quản lý trạng thái Giỏ Hàng (Cart) */}
              <CartProvider>
                {/* Lớp bọc quản lý Yêu thích (Wishlist) */}
                <WishlistProvider>
                  {/* Lớp bọc Đa Ngôn Ngữ (VI/EN) */}
                  <LanguageProvider>
                    {/* Lớp bọc tính năng So sánh sản phẩm (Tối đa 4 sản phẩm) */}
                    <ComparisonProvider>

                      {/* Shell Component chứa Header và Footer chung */}
                      <RootLayoutWrapper>
                        {/* Vị trí render của các pages con (VD: Trang chủ, Sản phẩm...) */}
                        {children}
                      </RootLayoutWrapper>

                      {/* Các công cụ / UI gắn fixed (Toàn cục) */}
                      <ChatWidget />

                      {/* Lazy-load logic đo lường Analytics (Meta Pixel / Google) */}
                      <Suspense fallback={null}>
                        <Pixel />
                      </Suspense>

                      <ScrollToTop />
                      <BottomNavBar />
                      <CookieConsent />
                      <AccessibilityWidget />
                      <PushNotificationBanner />
                      <AppInstallBanner />

                      {/* Thanh nổi chức năng So sánh hiển thị ở cuối màn hình */}
                      <ComparisonBar />

                      {/* Toaster cho các thông báo popup */}
                      <Toaster position="top-right" reverseOrder={false} />

                    </ComparisonProvider>
                  </LanguageProvider>
                </WishlistProvider>
              </CartProvider>
            </QueryProvider>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
