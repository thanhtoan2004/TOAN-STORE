import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from 'react';
import RootLayoutWrapper from "@/components/RootLayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import QueryProvider from "@/components/providers/QueryProvider";
import ChatWidget from "@/components/chat/ChatWidget";
import Pixel from "@/components/analytics/Pixel";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | TOAN Store',
    default: 'TOAN Store - Just Do It',
  },
  description: "Nike delivers innovative products, experiences and services to inspire athletes.",
  openGraph: {
    title: 'TOAN Store',
    description: 'The best place to buy Nike products.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'TOAN Store',
    images: [
      {
        url: '/og-image.jpg', // Make sure this exists or use a default
        width: 1200,
        height: 630,
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  keywords: ['nike', 'giày nike', 'giày chạy bộ', 'thời trang thể thao', 'toan store', 'nike vietnam'],
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="crossOrigin" content="anonymous" />
      </head>

      <body className="overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <QueryProvider>
            <CartProvider>
              <WishlistProvider>
                <LanguageProvider>
                  <RootLayoutWrapper>
                    {children}
                  </RootLayoutWrapper>
                  <ChatWidget />
                  <Suspense fallback={null}>
                    <Pixel />
                  </Suspense>
                </LanguageProvider>
              </WishlistProvider>
            </CartProvider>
          </QueryProvider>
        </AuthProvider>

        {/* Script để xử lý lỗi hydration do thuộc tính crossOrigin */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.addEventListener('DOMContentLoaded', function() {
                  document.querySelectorAll('img').forEach(img => {
                    if (img.hasAttribute('crossorigin')) {
                      img.removeAttribute('crossorigin');
                    }
                  });
                });
              })();
            `,
          }}
        />

        {/* Script xử lý hydration errors (reload trang nếu có lỗi) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var timeout = setTimeout(function() {
                  if (document.querySelectorAll('[data-jsx-error]').length) {
                    console.info('Fixing hydration mismatch');
                    window.location.reload();
                  }
                }, 500);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
