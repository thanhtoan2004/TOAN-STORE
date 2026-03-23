'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  Trash2,
  ExternalLink,
  Package,
  MessageSquare,
  Tag,
  BellOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';

interface Notification {
  id: number;
  type: 'order' | 'social' | 'promo' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Handle Real-time notifications via Socket
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewNotification = (data: any) => {
        // Add to list and bump count
        setNotifications((prev) => [data.data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket, isAuthenticated]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id?: number, all: boolean = false) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, all }),
      });
      const data = await response.json();
      if (data.success) {
        if (all) {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } else {
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id?: number, all: boolean = false) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, all }),
      });
      const data = await response.json();
      if (data.success) {
        if (all) {
          setNotifications([]);
          setUnreadCount(0);
        } else {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          const wasUnread = !notifications.find((n) => n.id === id)?.is_read;
          if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="text-blue-500" size={18} />;
      case 'social':
        return <MessageSquare className="text-green-500" size={18} />;
      case 'promo':
        return <Tag className="text-red-500" size={18} />;
      default:
        return <Bell className="text-gray-500" size={18} />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group text-black"
        aria-label="Thông báo"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white z-20 min-w-[18px] px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-gray-900">Thông báo</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Bạn có {unreadCount} thông báo mới
                </p>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={() => markAsRead(undefined, true)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-tight"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    Đọc tất cả
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2 bg-gray-50/30">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative flex gap-3 p-4 transition-all hover:bg-white border-l-4 ${notification.is_read ? 'border-transparent' : 'border-black bg-white shadow-sm'}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h4
                        className={`text-sm font-bold truncate ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}
                      >
                        {notification.title}
                      </h4>
                      <p
                        className={`text-xs mt-1 line-clamp-2 leading-relaxed ${notification.is_read ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-medium text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="text-[10px] font-bold text-black flex items-center gap-1 hover:underline"
                          >
                            Xem chi tiết <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-4 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BellOff size={24} className="text-gray-300" />
                  </div>
                  <h4 className="font-bold text-gray-900">Không có thông báo nào</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Chúng tôi sẽ báo cho bạn khi có tin mới!
                  </p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-white border-t border-gray-50 text-center">
                <button
                  onClick={() => deleteNotification(undefined, true)}
                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Xóa tất cả thông báo
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
