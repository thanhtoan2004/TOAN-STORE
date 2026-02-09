'use client';
import { useEffect } from 'react';

// import React from 'react';
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Menu, ChevronDown } from 'lucide-react'
import { CartIcon } from '@/components/ui/cart'
import SearchBar from '@/components/ui/SearchBar'
import { useWishlist } from "@/contexts/WishlistContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  // useEffect(() => {

  // }, []);

  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlist } = useWishlist();

  const mainNavigationLinks = [
    { name: t.nav.new, href: '/categories?sort=newest' },
    { name: t.nav.men, href: '/men' },
    { name: t.nav.women, href: '/women' },
    { name: t.nav.kids, href: '/categories?gender=kids' },
    { name: t.nav.jordan, href: '/categories?sport=basketball' },
    { name: t.nav.sports, href: '/categories?sport=running' },
  ];

  return (
    <header className="w-full bg-white">
      {/* Top mini-nav */}
      <div className="bg-[#f5f5f5] py-2">
        <div className="nike-container flex justify-between items-center text-xs">
          <div className="flex space-x-1.5">
            <Link href="/categories?sport=basketball" className="flex items-center hover:opacity-70 transition-opacity">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.09 11l-5.7-9.15c-.11-.17-.32-.17-.43 0L5.25 11h11.84zm.82 1H6.09l-.57 9.25c-.01.18.13.32.31.32h12.34c.18 0 .32-.14.31-.32l-.57-9.25z" />
              </svg>
            </Link>
            <Link href="/categories?brand=converse" className="flex items-center hover:opacity-70 transition-opacity">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </Link>
          </div>
          <div className="flex space-x-4 font-helvetica text-[11px]">
            <Link href="/store" className="hover:text-black text-[#757575]">{t.common.find_store}</Link>
            <span className="text-[#757575]">|</span>
            <Link href="/help" className="hover:text-black text-[#757575]">{t.common.help}</Link>
            <span className="text-[#757575]">|</span>

            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className="hover:text-black text-[#757575] flex items-center gap-1">
                    {t.common.hello}, {(user as any)?.firstName && (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` : user?.email}
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="w-full cursor-pointer">{t.common.my_orders}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="w-full cursor-pointer">{t.common.wishlist}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/settings" className="w-full cursor-pointer">{t.common.settings}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                      {t.common.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/sign-up" className="hover:text-black text-[#757575]">{t.common.register}</Link>
                <span className="text-[#757575]">|</span>
                <Link href="/sign-in" className="hover:text-black text-[#757575]">{t.common.login}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="nike-container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
            <Link href="/">
              <svg className="h-16 w-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" fillRule="evenodd" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.2.666.298 1.147.298.386 0 .829-.063 1.316-.19L21 8.719z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex space-x-4 font-helvetica-medium">
            {mainNavigationLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-2 py-1 text-sm font-medium transition-colors hover:text-black text-zinc-800"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Search & Icons */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block w-64">
              <SearchBar />
            </div>
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
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Mobile menu button - only shows on small screens */}
      <div className="md:hidden nike-container pb-2 text-black">
        <button className="flex items-center space-x-1 text-sm">
          <span>{t.common.menu}</span>
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export default Header
