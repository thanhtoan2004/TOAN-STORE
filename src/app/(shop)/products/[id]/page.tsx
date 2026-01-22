"use client";
import { notFound } from "next/navigation";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { AddToCartButton } from "@/components/ui";
import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

interface ProductSize {
  size: string;
  stock: number;
}

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  sale_price?: number;
  base_price?: number;
  retail_price?: number;
  image_url: string;
  description?: string;
  is_new_arrival: boolean;
  created_at: string;
  images?: Array<{ url: string; alt_text?: string }>;
}

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  helpful_count: number;
  is_verified_purchase: boolean;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) as { id: string };
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch product");
        }
        const result = await response.json();
        const data = result.data || result;
        setProduct(data);
        
        // Set product images (main image + additional images if available)
        const images = data.images && data.images.length > 0 
          ? data.images.map((img: any) => img.url)
          : [data.image_url];
        setProductImages(images);
        
        // Fetch variants/sizes from database
        const variantsResponse = await fetch(`/api/products/${id}/variants`);
        if (variantsResponse.ok) {
          const variantsData = await variantsResponse.json();
          if (variantsData.success && variantsData.data) {
            const productSizes = variantsData.data.map((v: any) => ({
              size: v.size,
              stock: v.stock.available
            }));
            setSizes(productSizes);
          }
        }
        
        // Fetch reviews
        const reviewsResponse = await fetch(`/api/reviews?productId=${id}&page=1&limit=10`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success) {
            setReviews(reviewsData.data.reviews);
            setReviewStats(reviewsData.data.statistics);
          }
        }
      } catch (error) {
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  // Xác định giá hiển thị
  const displayPrice = product.retail_price || product.price || 0;
  const salePrice = product.base_price && product.retail_price && product.base_price < product.retail_price 
    ? product.base_price 
    : product.sale_price;
  
  const discountPercent = salePrice && displayPrice > salePrice
    ? Math.round(((displayPrice - salePrice) / displayPrice) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " ₫";
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vui lòng đăng nhập để đánh giá');
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Đánh giá của bạn đang chờ duyệt. Cảm ơn bạn!');
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', comment: '' });
      } else {
        alert(result.message || 'Không thể gửi đánh giá');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async (reviewId: number) => {
    if (!user) return;

    setSubmittingReview(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          userId: user.id,
          rating: editForm.rating,
          title: editForm.title,
          comment: editForm.comment
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setEditingReviewId(null);
        // Reload reviews
        const reviewsResponse = await fetch(`/api/reviews?productId=${id}&page=1&limit=10`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success) {
            setReviews(reviewsData.data.reviews);
            setReviewStats(reviewsData.data.statistics);
          }
        }
      } else {
        alert(result.message || 'Không thể cập nhật đánh giá');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Lỗi khi cập nhật đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!user) return;
    
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews?reviewId=${reviewId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // Reload reviews
        const reviewsResponse = await fetch(`/api/reviews?productId=${id}&page=1&limit=10`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success) {
            setReviews(reviewsData.data.reviews);
            setReviewStats(reviewsData.data.statistics);
          }
        }
      } else {
        alert(result.message || 'Không thể xóa đánh giá');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment
    });
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/2">
          {/* Image Gallery - Sticky on desktop */}
          <div className="flex gap-4 lg:sticky lg:top-4">
            {/* Thumbnail List */}
            <div className="flex flex-col gap-2 w-20">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 transition-all ${
                    currentImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image with Navigation */}
            <div className="flex-1 relative aspect-square overflow-hidden rounded-lg bg-gray-100 group">
              <Image 
                src={productImages[currentImageIndex] || product.image_url} 
                alt={product.name} 
                fill 
                className="object-cover" 
                priority 
              />
              
              {/* Badges */}
              {product.is_new_arrival && (
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-sm font-medium rounded z-10">MỚI</div>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-sm font-medium rounded z-10">-{discountPercent}%</div>
              )}

              {/* Navigation Buttons */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 text-sm rounded z-10">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-lg text-gray-500 uppercase tracking-wide">{product.category}</p>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {salePrice ? (
                <div className="flex items-center space-x-3">
                  <span className="text-red-600">{formatPrice(salePrice)}</span>
                  <span className="text-gray-500 line-through text-lg">{formatPrice(displayPrice)}</span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded">Tiết kiệm {formatPrice(displayPrice - salePrice)}</span>
                </div>
              ) : (
                <span className="text-gray-900">{formatPrice(displayPrice)}</span>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Chọn Kích Thước</h3>
              <div className="grid grid-cols-5 gap-2">
                {sizes.map((sizeObj) => (
                  <button
                    key={sizeObj.size}
                    className={`border-2 px-4 py-3 rounded-lg text-center font-medium transition-all ${
                      sizeObj.stock === 0
                        ? "opacity-30 cursor-not-allowed border-gray-200 text-gray-400"
                        : selectedSize === sizeObj.size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    disabled={sizeObj.stock === 0}
                    onClick={() => setSelectedSize(sizeObj.size)}
                  >
                    <div className="text-base">{sizeObj.size}</div>
                    {sizeObj.stock === 0 ? (
                      <div className="text-xs mt-1">Hết hàng</div>
                    ) : (
                      <div className={`text-xs mt-1 ${selectedSize === sizeObj.size ? 'text-white' : 'text-gray-500'}`}>
                        Còn {sizeObj.stock}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedSize && (
                <p className="mt-3 text-sm text-gray-600">Đã chọn: <span className="font-medium">{selectedSize}</span></p>
              )}
            </div>

            {product.description && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Mô Tả Sản Phẩm</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="border-t pt-6 space-y-3">
              <AddToCartButton productId={typeof product.id === 'number' ? product.id : parseInt(product.id)} size={selectedSize || ""} disabled={!selectedSize} className="w-full">
                Thêm vào Giỏ Hàng
              </AddToCartButton>
            </div>

            <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7 7-7 7" />
                </svg>
                Miễn phí giao hàng cho đơn hàng trên 1,500,000₫
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Đổi trả miễn phí trong 30 ngày
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t pt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-bold text-2xl">Đánh giá sản phẩm</h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors"
          >
            Viết đánh giá
          </button>
        </div>

        {/* Review Stats */}
        {reviewStats && reviewStats.total_reviews > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {(reviewStats.average_rating || 0).toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(reviewStats.average_rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">{reviewStats.total_reviews} đánh giá</p>
              </div>

              <div className="space-y-2">
                {[
                  { stars: 5, count: reviewStats.five_star },
                  { stars: 4, count: reviewStats.four_star },
                  { stars: 3, count: reviewStats.three_star },
                  { stars: 2, count: reviewStats.two_star },
                  { stars: 1, count: reviewStats.one_star }
                ].map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{item.stars} ⭐</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${reviewStats.total_reviews > 0 ? (item.count / reviewStats.total_reviews) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg mb-4">Viết đánh giá của bạn</h3>
            
            <div className="mb-4">
              <label className="block font-medium mb-2">Đánh giá</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="text-3xl"
                  >
                    {star <= reviewForm.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">Tiêu đề (tùy chọn)</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="Tóm tắt đánh giá của bạn"
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">Nội dung đánh giá *</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-full hover:border-black transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                {editingReviewId === review.id ? (
                  /* Edit Form */
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <label className="block font-medium mb-2">Đánh giá *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, rating: star })}
                            className="text-3xl focus:outline-none"
                          >
                            {star <= editForm.rating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block font-medium mb-2">Tiêu đề (tùy chọn)</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        placeholder="Tóm tắt đánh giá của bạn"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block font-medium mb-2">Nội dung đánh giá *</label>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32"
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditReview(review.id)}
                        disabled={submittingReview || !editForm.comment.trim()}
                        className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                      >
                        {submittingReview ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                      <button
                        onClick={() => setEditingReviewId(null)}
                        className="px-6 py-2 border border-gray-300 rounded-full hover:border-black transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Review */
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.user_name}</span>
                          {review.is_verified_purchase && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✓ Đã mua hàng
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-yellow-400">
                                {star <= review.rating ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      
                      {user && user.id === review.user_id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditReview(review)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    
                    <button className="text-sm text-gray-600 hover:text-black">
                      Hữu ích ({review.helpful_count})
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Chưa có đánh giá nào cho sản phẩm này</p>
              <p className="text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


