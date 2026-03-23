'use client';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { Heart, Video, Play, Printer, GitCompareArrows } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/date-utils';
import { useWishlist } from '@/contexts/WishlistContext';
import { useComparison } from '@/contexts/ComparisonContext';
import { useModal } from '@/contexts/ModalContext';
import { useRouter } from 'next/navigation';
import ReviewMediaUpload from '@/components/reviews/ReviewMediaUpload';
import ProductRecommendations from '@/components/ui/products/ProductRecommendations';
import RecentlyViewed from '@/components/ui/products/RecentlyViewed';
import SizeGuide from '@/components/ui/products/SizeGuide';
import SocialShare from '@/components/ui/products/SocialShare';
import { useProduct } from '@/hooks/queries/useProduct';
import { useReviews } from '@/hooks/queries/useReviews';
import { useCheckPurchase } from '@/hooks/queries/useCheckPurchase';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';

interface ProductSize {
  size: string;
  stock: number;
  allow_backorder?: number;
  expected_restock_date?: string | null;
  sku?: string;
}

interface Product {
  id: string | number;
  name: string;
  slug: string;
  category: string;
  price?: number;
  sale_price?: number;
  price_cache?: number;
  msrp_price?: number;
  priceCache?: number;
  msrpPrice?: number;
  image_url?: string;
  imageUrl?: string;
  description?: string;
  is_new_arrival?: boolean | number;
  isNewArrival?: boolean | number;
  created_at?: string;
  createdAt?: string;
  images?: Array<{ url: string; alt_text?: string; media_type?: 'image' | 'video' }>;
  sizes?: Array<{ size: string; stock: number; reserved?: number; sku?: string }>;
  attributes?: Array<{
    name: string;
    slug: string;
    type: string;
    value_text?: string;
    option_label?: string;
    option_value?: string;
  }>;
}

interface ReviewMedia {
  id: number;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
}

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  media?: ReviewMedia[];
  admin_reply?: string;
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

export default function ProductDetailClient({
  slug,
  initialProductId,
}: {
  slug: string;
  initialProductId: number;
}) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useModal();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  // Handle Real-time Stock Updates
  useEffect(() => {
    if (socket) {
      const handleStockUpdate = (data: any) => {
        // data looks like: { productVariantId: number, productId: number, newStock: number, size: string }
        if (Number(data.productId) === Number(initialProductId)) {
          console.log('📦 Real-time Stock Update:', data);
          setSizes((prev) =>
            prev.map((s) => (s.size === data.size ? { ...s, stock: data.newStock } : s))
          );
        }
      };

      socket.on('stock-update', handleStockUpdate);
      return () => {
        socket.off('stock-update', handleStockUpdate);
      };
    }
  }, [socket, initialProductId]);

  // ... (keep existing state)

  // ... (keep existing useEffects)

  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useComparison();
  const inCompare = isInCompare(initialProductId);
  const inWishlist = isInWishlist(initialProductId);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reviewMediaFiles, setReviewMediaFiles] = useState<File[]>([]);

  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<{ url: string; type: 'image' | 'video' }[]>(
    []
  );

  const { data: productData, isLoading: productLoading, error: productError } = useProduct(slug);
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(String(initialProductId));
  const { data: purchaseData, isLoading: purchaseLoading } = useCheckPurchase(
    user?.id,
    String(initialProductId)
  );

  // Dynamic states that might need local management (for optimistic updates or form sync)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Helpful toggle state
  const [likedReviews, setLikedReviews] = useState<number[]>([]);

  useEffect(() => {
    // Load liked reviews from localStorage on mount
    const savedLikes = localStorage.getItem('liked_reviews');
    if (savedLikes) {
      try {
        setLikedReviews(JSON.parse(savedLikes));
      } catch (e) {
        console.error('Error parsing liked reviews:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (productData) {
      setProduct(productData as any);
      // Set product images (main image + additional images if available)
      let images: { url: string; type: 'image' | 'video' }[] = [];
      if (productData.images && productData.images.length > 0) {
        images = productData.images
          .filter((img: any) => img.url && img.url.trim() !== '')
          .map((img: any) => ({
            url: img.url,
            type: img.media_type || 'image',
          }));
      }

      // If no valid images found, use the main imageUrl
      if (images.length === 0 && productData.imageUrl) {
        images = [{ url: productData.imageUrl, type: 'image' }];
      } else if (images.length === 0 && (productData as any).image_url) {
        images = [{ url: (productData as any).image_url, type: 'image' }];
      }

      // Final fallback if still no images
      if (images.length === 0) {
        images = [{ url: '/placeholder.png', type: 'image' }];
      }

      setProductImages(images);

      // Set sizes directly from product data (no need for separate fetch)
      if (productData.sizes && Array.isArray(productData.sizes)) {
        // Merge duplicates if any (defensive)
        const uniqueSizesMap = (productData.sizes as any[]).reduce((acc: any, curr: any) => {
          const sizeKey = String(curr.size).trim();
          if (!acc[sizeKey]) {
            acc[sizeKey] = {
              size: sizeKey,
              stock: Number(curr.stock || 0) - Number(curr.reserved || 0),
              allow_backorder: curr.allow_backorder,
              expected_restock_date: curr.expected_restock_date,
              sku: curr.sku,
            };
          } else {
            acc[sizeKey].stock += Number(curr.stock || 0) - Number(curr.reserved || 0);
          }
          return acc;
        }, {});

        const productSizes = Object.values(uniqueSizesMap).sort(
          (a: any, b: any) => parseFloat(a.size) - parseFloat(b.size)
        );
        setSizes(productSizes as any);
      }
    }
  }, [productData]);

  useEffect(() => {
    if (reviewsData) {
      setReviews(reviewsData.reviews);
      setReviewStats(reviewsData.statistics);
    }
  }, [reviewsData]);

  useEffect(() => {
    if (purchaseData !== undefined) {
      setHasPurchased(purchaseData);
    }
  }, [purchaseData]);

  useEffect(() => {
    if (productError) {
      setError('Không thể tải thông tin sản phẩm');
    }
  }, [productError]);

  // Save to Recently Viewed
  useEffect(() => {
    if (product) {
      try {
        const viewedItem = {
          id: product.id,
          slug: product.slug || String(product.id),
          name: product.name,
          category: product.category,
          price:
            product.msrpPrice || product.msrp_price || product.priceCache || product.price || 0,
          sale_price:
            (product.priceCache || product.price_cache) &&
            (product.msrpPrice || product.msrp_price) &&
            (product.priceCache || product.price_cache)! <
              (product.msrpPrice || product.msrp_price)!
              ? product.priceCache || product.price_cache
              : undefined,
          image_url: product.imageUrl || product.image_url || '/placeholder.png',
          is_new_arrival: product.isNewArrival || product.is_new_arrival,
        };

        const stored = localStorage.getItem('recently_viewed');
        let current: any[] = stored ? JSON.parse(stored) : [];

        // Remove duplicate if exists
        current = current.filter((p: any) => String(p.id) !== String(product.id));

        // Add to front
        current.unshift(viewedItem);

        // Limit to 6
        if (current.length > 6) current = current.slice(0, 6);

        localStorage.setItem('recently_viewed', JSON.stringify(current));
      } catch (e) {
        console.error('Error saving recently viewed:', e);
      }
    }
  }, [product]);

  if (productLoading) {
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

  if (productError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-red-600">{error || 'Không thể tải thông tin sản phẩm'}</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return notFound();
  }

  // Assign productData to product for the rest of the component
  // (Or use productData directly, but keeping product variable for minimal changes)
  const activeProduct = product || productData;

  // Xác định giá hiển thị
  const displayPrice =
    (activeProduct as any).msrpPrice ||
    (activeProduct as any).msrp_price ||
    (activeProduct as any).priceCache ||
    (activeProduct as any).price ||
    0;
  const salePrice =
    ((activeProduct as any).priceCache || (activeProduct as any).price_cache) &&
    ((activeProduct as any).msrpPrice || (activeProduct as any).msrp_price) &&
    ((activeProduct as any).priceCache || (activeProduct as any).price_cache)! <
      ((activeProduct as any).msrpPrice || (activeProduct as any).msrp_price)!
      ? (activeProduct as any).priceCache || (activeProduct as any).price_cache
      : activeProduct.sale_price;

  const discountPercent =
    salePrice && displayPrice > salePrice
      ? Math.round(((displayPrice - salePrice) / displayPrice) * 100)
      : 0;

  // formatPrice removed, use formatCurrency from @/lib/date-utils

  const handleWishlist = async () => {
    if (!user) {
      showAlert({
        title: 'Xác nhận thông tin',
        message: t.common?.login || 'Vui lòng đăng nhập để xem hoặc thêm vào danh sách yêu thích',
        type: 'auth',
        onConfirm: () => router.push('/sign-in'),
      });
      return;
    }

    if (!activeProduct) return;

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(initialProductId);
      } else {
        await addToWishlist({
          id: String(activeProduct.id),
          slug: activeProduct.slug,
          name: activeProduct.name,
          category: activeProduct.category,
          price: Number(
            (activeProduct as any).msrp_price ||
              (activeProduct as any).msrpPrice ||
              (activeProduct as any).price ||
              0
          ),
          sale_price: salePrice,
          image_url:
            (activeProduct as any).imageUrl ||
            (activeProduct as any).image_url ||
            '/placeholder.png',
          is_new_arrival: !!(
            (activeProduct as any).isNewArrival || (activeProduct as any).is_new_arrival
          ),
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeProduct) return;

    if (inCompare) {
      removeFromCompare(activeProduct.id);
    } else {
      addToCompare({
        id: String(activeProduct.id),
        slug: activeProduct.slug,
        name: activeProduct.name,
        category: activeProduct.category,
        price: Number(
          (activeProduct as any).msrp_price ||
            (activeProduct as any).msrpPrice ||
            (activeProduct as any).price ||
            0
        ),
        msrp_price: (activeProduct as any).msrpPrice || (activeProduct as any).msrp_price,
        sale_price: salePrice,
        image_url:
          (activeProduct as any).imageUrl || (activeProduct as any).image_url || '/placeholder.png',
        is_new_arrival: !!(
          (activeProduct as any).isNewArrival || (activeProduct as any).is_new_arrival
        ),
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showAlert({
        title: 'Xác nhận thông tin',
        message: t.reviews.login_req,
        type: 'auth',
        onConfirm: () => router.push('/sign-in'),
      });
      return;
    }

    if (!reviewForm.comment.trim()) {
      showAlert({
        title: 'Thông báo',
        message: t.reviews.content_placeholder,
        type: 'info',
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: initialProductId,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Upload media if any
        if (reviewMediaFiles.length > 0 && result.data?.reviewId) {
          const formData = new FormData();
          formData.append('reviewId', result.data.reviewId.toString());
          reviewMediaFiles.forEach((file) => {
            formData.append('media', file);
          });

          await fetch('/api/reviews/media', {
            method: 'POST',
            body: formData,
          });
        }

        showAlert({
          title: 'Thành công',
          message: t.reviews.success,
          type: 'success',
        });
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', comment: '' });
        setReviewMediaFiles([]);
        // Invalidate reviews to refetch
        queryClient.invalidateQueries({ queryKey: ['reviews', initialProductId] });
      } else {
        alert(result.message || t.common?.error || 'Error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(t.common?.error || 'Error');
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
          comment: editForm.comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showAlert({
          title: 'Thành công',
          message: result.message || t.common?.success || 'Cập nhật thành công',
          type: 'success',
        });
        setEditingReviewId(null);
        // Invalidate reviews to refetch
        queryClient.invalidateQueries({ queryKey: ['reviews', initialProductId] });
      } else {
        showAlert({
          title: 'Lỗi',
          message: result.message || t.common?.error || 'Đã xảy ra lỗi',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating review:', error);
      showAlert({
        title: 'Lỗi',
        message: t.common?.error || 'Đã xảy ra lỗi',
        type: 'error',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!user) return;

    showAlert({
      title: 'Xác nhận xóa',
      message: t.reviews.delete_confirm || 'Bạn có chắc chắn muốn xóa đánh giá này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/reviews?reviewId=${reviewId}&userId=${user.id}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (result.success) {
            showAlert({
              title: 'Thành công',
              message: result.message || t.common?.success || 'Xóa thành công',
              type: 'success',
            });
            // Invalidate reviews to refetch
            queryClient.invalidateQueries({ queryKey: ['reviews', initialProductId] });
          } else {
            showAlert({
              title: 'Lỗi',
              message: result.message || t.common?.error || 'Đã xảy ra lỗi',
              type: 'error',
            });
          }
        } catch (error) {
          console.error('Error deleting review:', error);
          showAlert({
            title: 'Lỗi',
            message: t.common?.error || 'Đã xảy ra lỗi',
            type: 'error',
          });
        }
      },
    });
  };

  const handleHelpful = async (reviewId: number) => {
    if (!user) {
      showAlert({
        title: 'Xác nhận thông tin',
        message: t.reviews?.login_req || 'Vui lòng đăng nhập để thực hiện chức năng này',
        type: 'auth',
        onConfirm: () => router.push('/sign-in'),
      });
      return;
    }

    const isLiked = likedReviews.includes(reviewId);
    const action = isLiked ? 'unlike' : 'like';

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpful_count: isLiked ? Math.max(0, r.helpful_count - 1) : r.helpful_count + 1,
            }
          : r
      )
    );

    // Update local state and localStorage
    const newLikedReviews = isLiked
      ? likedReviews.filter((id) => id !== reviewId)
      : [...likedReviews, reviewId];

    setLikedReviews(newLikedReviews);
    localStorage.setItem('liked_reviews', JSON.stringify(newLikedReviews));

    try {
      await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });
    } catch (error) {
      console.error('Failed to update helpful status:', error);
      // Revert on error (optional, skipping for simplicity)
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
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
      <div className="no-print">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            {/* Image Gallery - Sticky on desktop */}
            <div className="flex gap-4 lg:sticky lg:top-4">
              {/* Thumbnail List */}
              <div className="flex flex-col gap-2 w-20">
                {productImages.map((media, index) => (
                  <button
                    key={`${index}-${media.url}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 transition-all ${
                      currentImageIndex === index
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video className="text-white w-6 h-6" />
                      </div>
                    ) : (
                      media.url && (
                        <Image
                          src={media.url || '/placeholder.png'}
                          alt={`${activeProduct.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      )
                    )}
                  </button>
                ))}
              </div>

              {/* Main Image with Navigation */}
              <div className="flex-1 relative aspect-square overflow-hidden rounded-lg bg-gray-100 group">
                {productImages[currentImageIndex]?.type === 'video' ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={productImages[currentImageIndex].url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                ) : (
                  <Image
                    src={
                      productImages[currentImageIndex]?.url ||
                      (activeProduct as any).imageUrl ||
                      (activeProduct as any).image_url ||
                      '/placeholder.png'
                    }
                    alt={activeProduct.name}
                    fill
                    className="object-cover"
                    priority
                  />
                )}

                {/* Badges */}
                {!!(
                  (activeProduct as any).isNewArrival || (activeProduct as any).is_new_arrival
                ) && (
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-sm font-medium rounded z-10">
                    {t.product.new || 'Mới'}
                  </div>
                )}
                {discountPercent > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-sm font-medium rounded z-10">
                    -{discountPercent}%
                  </div>
                )}

                {/* Navigation Buttons */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="Previous image"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="Next image"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeProduct.name}</h1>
                  <p className="text-lg text-gray-500 uppercase tracking-wide">
                    {activeProduct.category}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {salePrice ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#e01f3d] font-bold">{formatCurrency(salePrice)}</span>
                    <span className="text-gray-500 line-through text-lg">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded">
                      Tiết kiệm {formatCurrency(displayPrice - salePrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-900">{formatCurrency(displayPrice)}</span>
                )}
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t.product.select_size}</h3>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-sm font-medium underline hover:text-gray-600 transition-colors"
                  >
                    Bảng size
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((sizeObj, idx) => (
                    <button
                      key={`size-${sizeObj.size}-${idx}`}
                      className={`border-2 px-4 py-3 rounded-lg text-center font-medium transition-all ${
                        sizeObj.stock <= 0 && !sizeObj.allow_backorder
                          ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400'
                          : selectedSize === sizeObj.size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={sizeObj.stock <= 0 && !sizeObj.allow_backorder}
                      onClick={() => setSelectedSize(sizeObj.size)}
                    >
                      <div className="text-base">{sizeObj.size}</div>
                      {sizeObj.stock <= 0 ? (
                        sizeObj.allow_backorder ? (
                          <div className="text-xs mt-1 text-blue-500 font-bold">Đặt trước</div>
                        ) : (
                          <div className="text-xs mt-1">{t.product.out_of_stock}</div>
                        )
                      ) : (
                        <div
                          className={`text-xs mt-1 ${selectedSize === sizeObj.size ? 'text-white' : 'text-gray-500'}`}
                        >
                          {t.product.left_in_stock} {sizeObj.stock}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedSize &&
                  (() => {
                    const sizeObj = sizes.find((s) => s.size === selectedSize);
                    return (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <p>
                          Selected: <span className="font-medium text-black">{selectedSize}</span>
                        </p>
                        {sizeObj?.sku && (
                          <p>
                            SKU: <span className="font-mono text-gray-500">{sizeObj.sku}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
              </div>

              {activeProduct.description && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">{t.product.description}</h3>
                  <p className="text-gray-600 leading-relaxed">{activeProduct.description}</p>
                </div>
              )}

              {/* NEW: Dynamic Specifications (EAV) */}
              {activeProduct.attributes && activeProduct.attributes.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Thông số sản phẩm</h3>
                  <div className="grid grid-cols-1 gap-y-2">
                    {activeProduct.attributes.map(
                      (
                        attr: { name: string; option_label?: string; value_text?: string },
                        idx: number
                      ) => (
                        <div
                          key={idx}
                          className="flex justify-between py-2 border-b border-gray-50 text-sm"
                        >
                          <span className="text-gray-500 font-medium">{attr.name}</span>
                          <span className="text-black font-semibold">
                            {attr.option_label || attr.value_text || '—'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-6 space-y-4">
                <AddToCartButton
                  productId={
                    typeof activeProduct.id === 'number'
                      ? activeProduct.id
                      : parseInt(activeProduct.id as string)
                  }
                  size={selectedSize || ''}
                  disabled={!selectedSize}
                  className="w-full"
                >
                  {t.product.add_to_cart}
                </AddToCartButton>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <button
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    className={`flex-1 py-4 px-6 rounded-full border-2 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      inWishlist
                        ? 'border-black bg-black text-white hover:bg-gray-800'
                        : 'border-gray-200 hover:border-black text-black'
                    } hover:scale-[1.02]`}
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                    {inWishlist ? t.product.in_wishlist : t.product.add_to_wishlist}
                  </button>

                  <button
                    onClick={handleCompare}
                    className={`flex-1 py-4 px-6 rounded-full border-2 font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      inCompare
                        ? 'border-black bg-black text-white hover:bg-gray-800'
                        : 'border-gray-200 hover:border-black text-black'
                    } hover:scale-[1.02]`}
                  >
                    <GitCompareArrows className="w-5 h-5" />
                    {inCompare ? 'Bỏ so sánh' : 'So sánh'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-b border-gray-100">
                  <SocialShare productName={activeProduct.name} />
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In chi tiết</span>
                  </button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7 7-7 7"
                    />
                  </svg>
                  {t.product.free_shipping}
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t.product.free_return}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t pt-12 no-print">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold uppercase">{t.product.reviews}</h2>
            {user && hasPurchased && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors"
              >
                {t.product.write_review}
              </button>
            )}
          </div>

          {/* Purchase requirement message */}
          {user && !hasPurchased && !purchaseLoading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>{t.common?.note || 'Note'}:</strong> {t.reviews.purchase_req}
              </p>
            </div>
          )}

          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">{t.reviews.login_req}</p>
            </div>
          )}

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
                  <p className="text-gray-600">
                    {reviewStats.total_reviews} {t.product.reviews}
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { stars: 5, count: reviewStats.five_star },
                    { stars: 4, count: reviewStats.four_star },
                    { stars: 3, count: reviewStats.three_star },
                    { stars: 2, count: reviewStats.two_star },
                    { stars: 1, count: reviewStats.one_star },
                  ].map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{item.stars} ⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${reviewStats.total_reviews > 0 ? (item.count / reviewStats.total_reviews) * 100 : 0}%`,
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
              <h3 className="font-bold text-lg mb-4">{t.reviews.write}</h3>

              <div className="mb-4">
                <label className="block font-medium mb-2">{t.reviews.rating}</label>
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
                <label className="block font-medium mb-2">{t.reviews.review_title}</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  placeholder={t.reviews.review_title_placeholder}
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2">{t.reviews.content}</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32"
                  placeholder={t.reviews.content_placeholder}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2">{t.reviews.media}</label>
                <ReviewMediaUpload
                  onMediaChange={(files) => setReviewMediaFiles(files)}
                  maxImages={5}
                  maxVideos={1}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {submittingReview ? t.reviews.submitting : t.reviews.submit}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-full hover:border-black transition-colors"
                >
                  {t.common?.cancel || 'Hủy'}
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
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm flex-shrink-0">
                              {review.user_avatar ? (
                                <Image
                                  src={review.user_avatar}
                                  alt={review.user_name || 'Avatar'}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs font-bold">
                                  {(review.user_name && review.user_name.trim() !== ''
                                    ? review.user_name
                                    : 'U'
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-gray-900 leading-none">
                              {review.user_name && review.user_name !== '0'
                                ? review.user_name
                                : 'Người dùng ẩn danh'}
                            </span>
                            {review.is_verified_purchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ {t.reviews.verified_purchase}
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

                      {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}

                      <p className="text-gray-700 mb-3">{review.comment}</p>

                      {/* Review Media */}
                      {review.media && review.media.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {review.media.map((media) => (
                            <div
                              key={media.id}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                            >
                              {media.media_type === 'image' ? (
                                <Image
                                  src={media.media_url}
                                  alt="Review image"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <video
                                  src={media.media_url}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {review.admin_reply && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-900">Trả lời từ cửa hàng:</p>
                          <p className="text-sm text-blue-800 mt-1">{review.admin_reply}</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleHelpful(review.id)}
                        className={`text-sm transition-colors flex items-center gap-1 ${
                          likedReviews.includes(review.id)
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-600 hover:text-black'
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={likedReviews.includes(review.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 10v12" />
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                        Hữu ích ({review.helpful_count})
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Chưa có đánh giá nào.</p>
            )}
          </div>
        </div>

        {/* Related & Recently Viewed */}
        {activeProduct && (
          <div className="mt-16 space-y-8 no-print">
            <ProductRecommendations currentProductId={Number(activeProduct.id)} />
            <RecentlyViewed />
          </div>
        )}

        <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
      </div>

      {/* Product Print Catalog (Visible only on print) */}
      <div className="hidden print:block bg-white p-0">
        <ProductPrintSection product={activeProduct} selectedSize={selectedSize} />
      </div>

      <style jsx global>{`
        @media print {
          /* Global layout cleanups */
          header,
          footer,
          nav,
          aside,
          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background-color: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }

          .print-catalog-root {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Dedicated component for professional product catalog printing
function ProductPrintSection({
  product,
  selectedSize,
}: {
  product: any;
  selectedSize: string | null;
}) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-8 text-black print-catalog-root border">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold toan-heading tracking-tighter">TOAN Store</h1>
          <p className="text-sm text-gray-500 italic mt-1 uppercase tracking-widest">
            Product Catalog / Spec Sheet
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400">
            Printed: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {/* Left Column: Image */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 mb-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.is_new_arrival && (
            <div className="inline-block border-2 border-black px-4 py-1 text-sm font-bold uppercase mb-4">
              Mới / New Arrival
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase text-gray-400 font-bold mb-1 tracking-widest">
              {product.category}
            </p>
            <h2 className="text-3xl font-bold leading-tight">{product.name}</h2>
          </div>

          <div className="text-2xl font-bold text-black border-y border-gray-100 py-4">
            {product.msrp_price || product.price
              ? formatCurrency(product.msrp_price || product.price)
              : 'Liên hệ'}
          </div>

          {selectedSize && (
            <div className="p-3 bg-gray-100 rounded text-sm font-bold flex justify-between">
              <span>Kích thước đã chọn:</span>
              <span>{selectedSize}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <h3 className="font-bold border-b pb-2 text-sm uppercase text-gray-500 tracking-wider">
              Mô tả sản phẩm
            </h3>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {product.description || 'Không có mô tả sản phẩm.'}
            </p>
          </div>
        </div>
      </div>

      {/* Specs / Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold border-b-2 border-black pb-3 mb-4 text-lg uppercase tracking-wider">
            Thông số kỹ thuật / Specifications
          </h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {product.attributes.map((attr: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 border-b border-gray-100 italic text-sm"
              >
                <span className="text-gray-500 font-medium">{attr.name}</span>
                <span className="font-bold text-gray-800">
                  {attr.option_label || attr.value_text || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-20 pt-8 border-t border-gray-100 text-center space-y-2">
        <p className="text-xs text-gray-400">© 2026 TOAN Store. Tất cả quyền được bảo lưu.</p>
        <p className="text-[10px] text-gray-400 italic">
          Lưu ý: Giá cả và thông số sản phẩm có thể thay đổi tùy theo thời điểm thực tế.
        </p>
      </div>
    </div>
  );
}
