import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

export const metadata: Metadata = {
  title: "TOAN. Just Do It. TOAN.com",
  description: "Nike delivers innovative products, experiences and services to inspire athletes.",
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
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
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
