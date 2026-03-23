'use client';
import { useEffect } from 'react';

// import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Menu, ChevronDown, User, Star, Zap, Crown, ShieldCheck } from 'lucide-react';
import CartIcon from '@/components/ui/CartIcon';
import SearchBar from '@/components/ui/SearchBar';
import SearchOverlay from '@/components/search/SearchOverlay';
import MobileMenuOverlay from '@/components/layout/MobileMenuOverlay';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Header Component
 * Đóng vai trò là thanh điều hướng chính (Navbar) của toàn bộ ứng dụng.
 * Chứa các menu, thanh tìm kiếm, giỏ hàng, danh sách yêu thích và menu người dùng.
 */
const Header = () => {
  // Lấy hàm t (translate) từ LanguageContext để hỗ trợ đa ngôn ngữ (i18n)
  const { t, language } = useLanguage();

  // Lấy thông tin xác thực của người dùng (user profile, trạng thái login) từ AuthContext
  const { user, isAuthenticated, logout } = useAuth();

  // Lấy danh sách sản phẩm yêu thích (wishlist) để hiển thị số lượng badge trên icon Heart
  const { wishlist } = useWishlist();

  // Quản lý trạng thái đóng/mở của màn hình tìm kiếm nổi (Search Overlay)
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Quản lý trạng thái đóng/mở của Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [dynamicMenus, setDynamicMenus] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    fetchSiteData();
  }, []);

  const fetchSiteData = async () => {
    try {
      const resp = await fetch('/api/site-data');
      const data = await resp.json();
      if (data.success) {
        setDynamicMenus(data.data.menus);
        setSiteSettings(data.data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mảng chứa các đường link điều hướng chính trên thanh Menu
  const mainNavigationLinks = [
    { name: t.nav.new, href: '/categories?sort=newest' },
    { name: t.nav.men, href: '/men' },
    { name: t.nav.women, href: '/women' },
    { name: t.nav.kids, href: '/kids' },
    { name: t.nav.jordan, href: '/categories?sport=basketball' },
    { name: t.nav.sports, href: '/categories?sport=running' },
    { name: t.nav.blog, href: '/news' },
  ];

  return (
    <header className="w-full bg-white">
      {/* Top mini-nav: Thanh điều hướng phụ phía trên cùng (Ẩn trên mobile vì đã có BottomNavBar) */}
      <div className="bg-[#f5f5f5] py-2 hidden md:block">
        <div className="toan-container flex justify-between items-center text-xs">
          {/* Logo các thương hiệu con (Jordan, Converse) */}
          <div className="flex space-x-1.5">
            <Link
              href="/categories?sport=basketball"
              className="flex items-center hover:opacity-70 transition-opacity"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.09 11l-5.7-9.15c-.11-.17-.32-.17-.43 0L5.25 11h11.84zm.82 1H6.09l-.57 9.25c-.01.18.13.32.31.32h12.34c.18 0 .32-.14.31-.32l-.57-9.25z" />
              </svg>
            </Link>
            <Link
              href="/categories?brand=converse"
              className="flex items-center hover:opacity-70 transition-opacity"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </Link>
          </div>

          {/* Menu công cụ bổ sung (Tìm cửa hàng, Trợ giúp, Tài khoản) */}
          <div className="flex space-x-4 font-helvetica text-[11px]">
            <Link href="/store" className="hover:text-black text-[#757575]">
              {t.common.find_store}
            </Link>
            <span className="text-[#757575]">|</span>
            <Link href="/help" className="hover:text-black text-[#757575]">
              {t.common.help}
            </Link>
            <span className="text-[#757575]">|</span>

            {/* Hiển thị Menu thả xuống (Dropdown) nếu người dùng ĐÃ đăng nhập */}
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className="hover:text-black text-[#757575] flex items-center gap-2 group">
                    {/* Avatar Image or Fallback */}
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300 group-hover:border-black transition-colors">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                    <span className="max-w-[120px] truncate">
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : user?.email}
                    </span>
                    {user?.membershipTier && (
                      <div
                        className={`p-0.5 rounded-sm ${
                          user.membershipTier === 'platinum'
                            ? 'text-indigo-600'
                            : user.membershipTier === 'gold'
                              ? 'text-yellow-600'
                              : user.membershipTier === 'silver'
                                ? 'text-gray-500'
                                : 'text-amber-700'
                        }`}
                      >
                        {user.membershipTier === 'platinum' && <ShieldCheck className="w-3 h-3" />}
                        {user.membershipTier === 'gold' && <Crown className="w-3 h-3" />}
                        {user.membershipTier === 'silver' && <Zap className="w-3 h-3" />}
                        {user.membershipTier === 'bronze' && <Star className="w-3 h-3" />}
                      </div>
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="w-full cursor-pointer">
                        {t.common.my_orders}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/transactions" className="w-full cursor-pointer">
                        {t.common.transactions}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/settings" className="w-full cursor-pointer">
                        {t.common.settings}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                      {t.common.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Hiển thị link Đăng ký / Đăng nhập nếu CHƯA đăng nhập
              <>
                <Link href="/sign-up" className="hover:text-black text-[#757575]">
                  {t.common.register}
                </Link>
                <span className="text-[#757575]">|</span>
                <Link href="/sign-in" className="hover:text-black text-[#757575]">
                  {t.common.login}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation: Khu vực menu chính (Logo, Links, Icons) */}
      <div className="toan-container py-4">
        <div className="flex items-center justify-between">
          {/* Logo chính của ứng dụng */}
          <div>
            <Link href="/">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt={siteSettings?.store_name || 'Logo'}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <Image
                  src="/icons/icon-512x512.png"
                  alt="TOAN Store"
                  width={128}
                  height={64}
                  className="h-12 w-auto object-contain"
                />
              )}
            </Link>
          </div>

          {/* Nav Links: Danh sách các trang chính (Ẩn trên màn hình nhỏ) */}
          <nav className="hidden md:flex space-x-4 font-helvetica-medium">
            {(dynamicMenus?.header || mainNavigationLinks).map((link: any, idx: number) => {
              const hasChildren = link.children && link.children.length > 0;

              if (hasChildren) {
                return (
                  <DropdownMenu key={link.id || idx}>
                    <DropdownMenuTrigger className="px-2 py-1 text-sm font-medium transition-colors hover:text-black text-zinc-800 flex items-center gap-1">
                      {language === 'en' ? link.titleEn || link.title : link.title || link.name}
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-2 min-w-[160px]">
                      {link.children.map((child: any) => (
                        <DropdownMenuItem key={child.id} asChild>
                          <Link href={child.href} className="w-full cursor-pointer">
                            {language === 'en'
                              ? child.titleEn || child.title
                              : child.title || child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={link.id || idx}
                  href={link.href}
                  className="px-2 py-1 text-sm font-medium transition-colors hover:text-black text-zinc-800"
                >
                  {language === 'en' ? link.titleEn || link.title : link.title || link.name}
                </Link>
              );
            })}
          </nav>

          {/* Khu vực Tìm kiếm & Các Icon (Yêu thích, Giỏ hàng) */}
          <div className="flex items-center space-x-4">
            {/* Thanh tìm kiếm (Mở SearchOverlay khi click) */}
            <div className="hidden md:block w-64" onClick={() => setIsSearchOpen(true)}>
              <div className="pointer-events-none">
                <SearchBar />
              </div>
            </div>
            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Các icon bên phải (Giấu trên mobile vì đã có Bottom Nav) */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Nút Yêu thích (Wishlist) kèm số lượng (Badge) */}
              <Link
                href="/wishlist"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group text-black"
                aria-label={t.common.wishlist}
              >
                <Heart className="w-6 h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white z-20 min-w-[18px] px-1">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Nút Giỏ hàng (Tách thành Component riêng để quản lý state) */}
              <CartIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Nút mở Menu trên nền tảng Mobile (Chỉ hiện trên màn hình nhỏ) */}
      <div className="md:hidden toan-container pb-2 flex items-center justify-between text-black">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center space-x-1 text-sm hover:opacity-70 transition-opacity"
        >
          <span>{t.common.menu}</span>
          <Menu className="w-4 h-4" />
        </button>

        {/* Mobile Notification Bell */}
        <div className="flex items-center">
          <NotificationBell />
        </div>
      </div>

      {/* Overlay Menu dành riêng cho Mobile */}
      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={
          dynamicMenus?.header || mainNavigationLinks.map((l) => ({ title: l.name, href: l.href }))
        }
      />
    </header>
  );
};

export default Header;
