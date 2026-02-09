"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle2, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SupportChat {
    id: number;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    guest_email?: string;
    guest_name?: string;
    status: 'waiting' | 'active' | 'resolved' | 'closed';
    last_message?: string;
    last_message_at: string;
    unread_count: number;
    assigned_admin_id?: number;
    admin_first_name?: string;
    admin_last_name?: string;
}

export default function AdminSupportPage() {
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadChats();
        const interval = setInterval(loadChats, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [filter]);

    const loadChats = async () => {
        try {
            const url = filter === 'all'
                ? '/api/admin/support/chats'
                : `/api/admin/support/chats?status=${filter}`;

            const response = await fetch(url);
            const data = await response.json();
            if (data.success && Array.isArray(data.chats)) {
                setChats(data.chats);
            } else {
                setChats([]);
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
            setChats([]); // Ensure chats is always an array
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            waiting: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Chờ' },
            active: { color: 'bg-green-100 text-green-800', icon: MessageSquare, label: 'Đang chat' },
            resolved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, label: 'Đã giải quyết' },
            closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle2, label: 'Đã đóng' }
        };

        const badge = badges[status as keyof typeof badges] || badges.waiting;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Support Chats</h1>
                <p className="text-gray-600">Quản lý các cuộc trò chuyện hỗ trợ khách hàng</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'waiting', 'active', 'resolved'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'all' ? 'Tất cả' : status === 'waiting' ? 'Chờ' : status === 'active' ? 'Đang chat' : 'Đã giải quyết'}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : chats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Không có cuộc trò chuyện nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tin nhắn cuối
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {chats.map((chat) => (
                                <tr key={chat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User size={20} className="text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {chat.user_first_name
                                                        ? `${chat.user_first_name} ${chat.user_last_name}`
                                                        : chat.guest_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {chat.user_email || chat.guest_email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 truncate max-w-xs">
                                            {chat.last_message || 'Chưa có tin nhắn'}
                                        </div>
                                        {chat.unread_count > 0 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                                {chat.unread_count} tin nhắn mới
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(chat.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTime(chat.last_message_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {chat.admin_first_name
                                            ? `${chat.admin_first_name} ${chat.admin_last_name}`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/support/${chat.id}`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <ArrowRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
