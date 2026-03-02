"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/date-utils';
import { MessageSquare, Send, Loader2, User, Heart, Reply, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AlertModal from '@/components/ui/AlertModal';

interface Comment {
    id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    user_name: string;
    user_id: number;
    avatar_url?: string;
    parent_id: number | null;
    likes_count: number;
    is_liked: number; // 0 or 1
    is_edited: number; // 0 or 1
}

export default function NewsComments({ slug }: { slug: string }) {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State cho tính năng nâng cao
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [editingComment, setEditingComment] = useState<{ id: number; text: string } | null>(null);
    const [replyText, setReplyText] = useState('');

    // State cho modal xóa
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; commentId: number | null }>({
        isOpen: false,
        commentId: null
    });

    useEffect(() => {
        fetchComments();
    }, [slug]);

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/news/${slug}/comments`);
            const data = await response.json();
            if (data.success) {
                setComments(data.data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent, parentId: number | null = null) => {
        e.preventDefault();
        const text = parentId ? replyText : newComment;

        if (!isAuthenticated) {
            toast.error(t.reviews?.login_req || 'Vui lòng đăng nhập để bình luận');
            return;
        }

        if (!text.trim()) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/news/${slug}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: text, parent_id: parentId })
            });

            const data = await response.json();
            if (data.success) {
                toast.success(parentId ? 'Đã gửi phản hồi!' : 'Bình luận thành công!');
                if (parentId) {
                    setReplyText('');
                    setReplyingTo(null);
                } else {
                    setNewComment('');
                }
                fetchComments();
            } else {
                toast.error(data.message || 'Lỗi khi gửi bình luận');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: number) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thích bình luận');
            return;
        }

        try {
            const response = await fetch(`/api/news/${slug}/comments/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId })
            });
            const data = await response.json();
            if (data.success) {
                setComments(prev => prev.map(c =>
                    c.id === commentId
                        ? { ...c, is_liked: data.liked ? 1 : 0, likes_count: data.likesCount }
                        : c
                ));
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComment) return;

        try {
            const response = await fetch(`/api/news/${slug}/comments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: editingComment.id, comment: editingComment.text })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã cập nhật bình luận');
                setEditingComment(null);
                fetchComments();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật');
        }
    };

    const confirmDelete = async () => {
        const commentId = deleteModal.commentId;
        if (!commentId) return;

        try {
            const response = await fetch(`/api/news/${slug}/comments`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã xóa bình luận');
                fetchComments();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Lỗi khi xóa');
        } finally {
            setDeleteModal({ isOpen: false, commentId: null });
        }
    };

    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId);

    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const isOwner = user && Number(user.id) === Number(comment.user_id);
        const isEdited = comment.is_edited === 1;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mt-6'}`}
            >
                <div className={`flex-shrink-0 ${isReply ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gray-100 overflow-hidden border border-gray-100`}>
                    {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt={comment.user_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-bold">{comment.user_name.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="group relative bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-helvetica-bold text-sm text-gray-900">{comment.user_name}</span>
                                {isEdited && <span className="text-[10px] text-gray-400 font-medium italic">(Đã sửa)</span>}
                            </div>
                            <span className="text-[10px] text-gray-400">{formatRelativeTime(comment.created_at)}</span>
                        </div>

                        {editingComment?.id === comment.id ? (
                            <form onSubmit={handleEdit} className="mt-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <textarea
                                    value={editingComment.text}
                                    onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                    className="w-full p-4 text-sm bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-black/5 min-h-[100px] shadow-inner"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingComment(null)}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-white rounded-full transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all shadow-sm"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-gray-700 text-sm leading-relaxed">{comment.comment}</p>
                        )}

                        {/* Actions Menu (Edit/Delete) */}
                        {isOwner && !editingComment && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingComment({ id: comment.id, text: comment.comment })}
                                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Sửa"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, commentId: comment.id })}
                                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 ml-2">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1.5 text-[11px] font-helvetica-bold transition-colors ${comment.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <motion.div
                                whileTap={{ scale: 1.4 }}
                                animate={{ scale: comment.is_liked ? [1, 1.2, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-current' : ''}`} />
                            </motion.div>
                            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                            {comment.is_liked ? 'Đã thích' : 'Thích'}
                        </button>
                        {!isReply && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className={`flex items-center gap-1.5 text-[11px] font-helvetica-bold transition-colors ${replyingTo === comment.id ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                            >
                                <Reply className="w-3.5 h-3.5" />
                                Phản hồi
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <motion.div
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            className="mt-6 ml-4 p-5 bg-gray-50 border border-gray-100 rounded-[2rem] shadow-sm transform origin-top"
                        >
                            <form onSubmit={(e) => handleSubmit(e, comment.id)}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                        <Reply className="w-3 h-3" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">Trả lời {comment.user_name}</span>
                                </div>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Viết phản hồi của bạn..."
                                    className="w-full p-4 text-sm bg-white border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-black/5 min-h-[80px] resize-none shadow-inner"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setReplyingTo(null)}
                                        className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-black rounded-full transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim() || submitting}
                                        className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi phản hồi'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* Nested Replies */}
                    {!isReply && getReplies(comment.id).map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="mt-16 pt-12 border-t border-gray-100">
            {/* Modal Xác nhận xóa */}
            <AlertModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, commentId: null })}
                onConfirm={confirmDelete}
                title="Xóa bình luận?"
                message="Hành động này không thể hoàn tác. Các phản hồi liên quan cũng sẽ bị xóa."
                confirmText="Xóa vĩnh viễn"
                cancelText="Hủy bỏ"
                type="info"
            />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gray-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-2xl font-helvetica-bold text-gray-900">
                    Bình luận {loading ? '' : `(${comments.length})`}
                </h3>
            </div>

            {/* Main Comment Form */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-10">
                {!isAuthenticated ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-600 mb-6 font-helvetica-medium">Tham gia thảo luận cùng cộng đồng Nike</p>
                        <Button asChild className="rounded-full px-8 outline-none">
                            <a href="/sign-in">Đăng nhập ngay</a>
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Chia sẻ ý kiến của bạn về bài viết này..."
                                    className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-gray-200 transition-all min-h-[120px] resize-none text-gray-800"
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center text-xs text-gray-400 font-medium">
                                        <div className={`w-1 h-1 rounded-full mr-2 ${newComment.length > 900 ? 'bg-red-500' : 'bg-gray-300'}`} />
                                        {newComment.length}/1000 ký tự
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={submitting || !newComment.trim()}
                                        className="rounded-full px-8 py-6 h-auto text-base font-helvetica-bold group outline-none"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Gửi ý kiến
                                                <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-100 mb-4" />
                    <p className="text-gray-400 text-sm animate-pulse">Đang tải bình luận...</p>
                </div>
            ) : rootComments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-helvetica-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {rootComments.map(comment => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

