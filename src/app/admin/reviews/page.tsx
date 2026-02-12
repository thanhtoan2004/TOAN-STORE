'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/date-utils';

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  admin_reply?: string;
  status: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data || data.reviews || []);
        const totalCount = data.pagination?.total || data.total || 0;
        setTotalPages(Math.ceil(totalCount / 20));
        setTotal(totalCount);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, status: newStatus }),
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_reply: replyText }),
      });

      if (response.ok) {
        setReplyingTo(null);
        setReplyText('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="mt-1 text-sm text-gray-500">Moderate product reviews</p>
          </div>
          <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
            Total Reviews: <span className="font-bold">{total}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <div className="flex space-x-2">
              {['pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === status
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading reviews...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No {statusFilter} reviews found
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <img
                          src={review.product_image || '/placeholder.png'}
                          alt={review.product_name}
                          className="w-20 h-20 object-cover rounded"
                        />

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{review.product_name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                By {review.user_name} • {formatDate(review.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${review.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : review.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                  }`}
                              >
                                {review.status}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2">
                            {renderStars(review.rating)}
                          </div>

                          {review.title && (
                            <h4 className="mt-2 font-medium text-gray-900">{review.title}</h4>
                          )}

                          <p className="mt-2 text-gray-700">{review.comment}</p>

                          {review.admin_reply && (
                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm font-medium text-blue-900">Admin Reply:</p>
                              <p className="text-sm text-blue-800 mt-1">{review.admin_reply}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-4 flex items-center space-x-3">
                            {review.status !== 'approved' && (
                              <button
                                onClick={() => updateReviewStatus(review.id, 'approved')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {review.status !== 'rejected' && (
                              <button
                                onClick={() => updateReviewStatus(review.id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(review.id);
                                setReplyText(review.admin_reply || '');
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              {review.admin_reply ? 'Edit Reply' : 'Reply'}
                            </button>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === review.id && (
                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm font-medium text-blue-900 mb-2">Write your reply:</p>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Your admin reply..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                rows={3}
                              />
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => submitReply(review.id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Submit Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
