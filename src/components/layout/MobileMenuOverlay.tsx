'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  links: any[]; // Changed to any to support children tree
}

export default function MobileMenuOverlay({ isOpen, onClose, links }: MobileMenuOverlayProps) {
  const { t, language } = useLanguage();
  const { isAuthenticated, logout } = useAuth();

  // Add state for expanded menus
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="relative flex w-4/5 max-w-sm flex-col bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 z-10">
        {/* Header of Menu */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-helvetica-bold text-lg tracking-tight">Menu</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Links */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col space-y-1 px-2">
            {links.map((link, idx) => {
              const hasChildren = link.children && link.children.length > 0;
              const isExpanded = expandedMenuId === (link.id || idx);

              if (hasChildren) {
                return (
                  <div key={link.id || idx} className="flex flex-col">
                    <button
                      onClick={() => setExpandedMenuId(isExpanded ? null : link.id || idx)}
                      className="flex items-center justify-between px-4 py-3 text-base font-helvetica-medium text-black rounded-lg hover:bg-gray-50 transition-colors w-full"
                    >
                      <span>
                        {language === 'en' ? link.titleEn || link.title : link.title || link.name}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="pl-6 flex flex-col space-y-1 bg-gray-50/50 py-1">
                        {link.children.map((child: any) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-md"
                          >
                            {language === 'en'
                              ? child.titleEn || child.title
                              : child.title || child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.id || idx}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 text-base font-helvetica-medium text-black rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <span>
                    {language === 'en' ? link.titleEn || link.title : link.title || link.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 px-6">
            <div className="w-full h-px bg-gray-200 mb-6" />
            <h3 className="text-sm font-semibold text-gray-500 mb-4">
              {t.common.help} &amp; {t.common.settings}
            </h3>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/help"
                onClick={onClose}
                className="text-sm font-medium text-black hover:text-gray-600"
              >
                {t.common.help}
              </Link>
              <Link
                href="/store"
                onClick={onClose}
                className="text-sm font-medium text-black hover:text-gray-600"
              >
                {t.common.find_store}
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/orders"
                    onClick={onClose}
                    className="text-sm font-medium text-black hover:text-gray-600 border-t pt-3 mt-1 inline-block"
                  >
                    {t.common.my_orders || 'Đơn hàng của tôi'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 text-left mt-2 block w-full py-1 focus:outline-none"
                  >
                    {t.common.logout || 'Đăng xuất'}
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
