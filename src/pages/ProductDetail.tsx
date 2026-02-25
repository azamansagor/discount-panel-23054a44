import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  RefreshCw,
  Store,
  Tag,
  ExternalLink,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TabBar from "@/components/layout/TabBar";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";
import AddReviewForm from "@/components/reviews/AddReviewForm";
import { toast } from "sonner";

import { API_BASE_URL as API_ROOT, STORAGE_URL } from "@/lib/api";

interface ProductImage {
  id: number;
  image: string;
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface Discount {
  id: number;
  title: string;
  discount_type: string;
  amount: string;
}

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  featured_image: string;
  images: ProductImage[];
  categories: ProductCategory[];
  average_rating: number;
  reviews_count: number;
  discounts: Discount[];
  store?: {
    id: number;
    name: string;
    logo?: string;
  };
  affiliate_link?: string;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist, removeFromWishlist } = useWishlist();
  const { canAddReview } = useAuth();

  // Remove wishlist drawer state
  const [showRemoveDrawer, setShowRemoveDrawer] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Image swipe state
  const imageSwipeStartRef = useRef(0);
  const [imageSwipeOffset, setImageSwipeOffset] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const reviewsObserverRef = useRef<HTMLDivElement>(null);
  const reviewsFetchedRef = useRef(false);
  const reviewsLoadingRef = useRef(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch product details
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ROOT}/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      setProduct(data.data || data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      reviewsFetchedRef.current = false;
      setReviews([]);
      setReviewsPage(1);
      setHasMoreReviews(true);
    }
  }, [productId, fetchProduct]);

  // Fetch reviews - fetch 10 at a time
  const fetchReviews = useCallback(async (page: number, reset = false) => {
    // Use ref to prevent concurrent calls
    if (reviewsLoadingRef.current) return;
    if (!reset && !hasMoreReviews) return;

    reviewsLoadingRef.current = true;
    setLoadingReviews(true);
    
    try {
      const response = await fetch(`${API_ROOT}/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 10, page }),
      });

      if (!response.ok) {
        // Stop trying on error
        setHasMoreReviews(false);
        throw new Error("Failed to fetch reviews");
      }
      
      const data = await response.json();
      const newReviews = data.data || data.items || [];
      
      if (reset) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }

      setHasMoreReviews(newReviews.length === 10);
      setReviewsPage(page);
      reviewsFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setHasMoreReviews(false); // Stop further attempts on error
    } finally {
      setLoadingReviews(false);
      reviewsLoadingRef.current = false;
    }
  }, [productId, hasMoreReviews]);

  // Load reviews on mount
  useEffect(() => {
    if (product && !reviewsFetchedRef.current) {
      fetchReviews(1, true);
    }
  }, [product]);

  // Infinite scroll for reviews - use refs to avoid stale closures
  const reviewsPageRef = useRef(reviewsPage);
  const hasMoreReviewsRef = useRef(hasMoreReviews);
  
  useEffect(() => {
    reviewsPageRef.current = reviewsPage;
  }, [reviewsPage]);
  
  useEffect(() => {
    hasMoreReviewsRef.current = hasMoreReviews;
  }, [hasMoreReviews]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting && 
          hasMoreReviewsRef.current && 
          !reviewsLoadingRef.current
        ) {
          fetchReviews(reviewsPageRef.current + 1);
        }
      },
      { threshold: 0.1 }
    );

    const target = reviewsObserverRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [fetchReviews]);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === 0) return;
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      touchStartRef.current = 0;
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - touchStartRef.current) * 0.5);
    setPullDistance(Math.min(distance, 100));
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      reviewsFetchedRef.current = false;
      setReviews([]);
      setReviewsPage(1);
      setHasMoreReviews(true);
      await fetchProduct();
      await fetchReviews(1, true);
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartRef.current = 0;
  };

  // Lightbox functions
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    } else {
      setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Image slider functions
  const allImages = product
    ? [
        product.featured_image,
        ...(product.images?.map((img) => img.image) || []),
      ].filter(Boolean)
    : [];

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    }
  };

  // Image swipe handlers
  const handleImageSwipeStart = (e: React.TouchEvent) => {
    imageSwipeStartRef.current = e.touches[0].clientX;
  };

  const handleImageSwipeMove = (e: React.TouchEvent) => {
    if (imageSwipeStartRef.current === 0 || allImages.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - imageSwipeStartRef.current;
    setImageSwipeOffset(diff * 0.3);
  };

  const handleImageSwipeEnd = () => {
    if (Math.abs(imageSwipeOffset) > 30) {
      if (imageSwipeOffset > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    setImageSwipeOffset(0);
    imageSwipeStartRef.current = 0;
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "/placeholder.svg";
    if (image.startsWith("http")) return image;
    return `${STORAGE_URL}/${image}`;
  };

  const calculateDiscount = () => {
    if (!product?.discounts?.length) return 0;
    return Math.round(parseFloat(product.discounts[0].amount));
  };

  const calculateOriginalPrice = () => {
    if (!product) return 0;
    const discount = calculateDiscount();
    const price = parseFloat(product.price);
    if (discount > 0) {
      return Math.round((price / (1 - discount / 100)) * 100) / 100;
    }
    return price;
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || "Product",
      text: `Check out ${product?.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.log("Share failed:", error);
      }
    }
  };

  // Wishlist toggle with confirmation for removal
  const handleWishlistToggle = () => {
    if (!product) return;
    
    if (isInWishlist("product", product.id)) {
      setShowRemoveDrawer(true);
    } else {
      toggleWishlist("product", product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        featured_image: product.featured_image,
        store: product.store,
        discounts: product.discounts,
      });
    }
  };

  // Confirm removal from wishlist
  const handleConfirmRemove = async () => {
    if (!product) return;
    setIsRemoving(true);
    await removeFromWishlist("product", product.id);
    setIsRemoving(false);
    setShowRemoveDrawer(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-80" />
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="h-16 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const discount = calculateDiscount();
  const originalPrice = calculateOriginalPrice();
  const price = parseFloat(product.price);

  return (
    <div 
      ref={scrollContainerRef}
      className="min-h-screen bg-background pb-20 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || refreshing) && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: refreshing ? 60 : pullDistance }}
            exit={{ height: 0 }}
            className="flex items-center justify-center bg-secondary/50 overflow-hidden"
          >
            <RefreshCw
              className={`h-6 w-6 text-primary ${refreshing ? "animate-spin" : ""}`}
              style={{
                transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/home')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full"
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isInWishlist('product', product.id) ? "fill-destructive text-destructive" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Main Image */}
      <div 
        className="relative w-full h-80 bg-secondary overflow-hidden"
        onTouchStart={handleImageSwipeStart}
        onTouchMove={handleImageSwipeMove}
        onTouchEnd={handleImageSwipeEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={getImageUrl(allImages[currentImageIndex])}
            alt={product.name}
            className="w-full h-full object-cover"
            style={{ transform: `translateX(${imageSwipeOffset}px)` }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </AnimatePresence>

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-16 left-4 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1">
            -{discount}% OFF
          </Badge>
        )}

        {/* Slider Controls */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-sm font-medium">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentImageIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border opacity-70"
              }`}
            >
              <img
                src={getImageUrl(img)}
                alt={`${product.name} ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Product Info Section */}
      <div className="p-4 space-y-4">
        {/* Categories */}
        {product.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.categories.map((cat) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={() => navigate(`/category/${cat.id}/${cat.slug}`)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Name */}
        <h1 className="text-xl font-bold text-foreground leading-tight">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(product.average_rating || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">
            {(product.average_rating || 0).toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({product.reviews_count || 0} reviews)
          </span>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary">
            ${price.toFixed(2)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <Badge variant="destructive" className="text-xs">
                Save ${(originalPrice - price).toFixed(2)}
              </Badge>
            </>
          )}
        </div>

        {/* Store Card */}
        {product.store && (
          <div
            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={() => navigate(`/store/${product.store?.id}`)}
          >
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center overflow-hidden border border-border">
              {product.store.logo ? (
                <img
                  src={getImageUrl(product.store.logo)}
                  alt={product.store.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Store className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{product.store.name}</p>
              <p className="text-xs text-muted-foreground">Visit Store</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="px-4 space-y-5">
        {/* Description Section */}
        {product.description && (
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-foreground">Description</h2>
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(product.description),
              }}
            />
          </div>
        )}

        {/* Active Offers */}
        {product.discounts?.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-foreground">Active Offers</h2>
            <div className="space-y-2">
              {product.discounts.map((disc) => (
                <div
                  key={disc.id}
                  className="p-4 bg-primary/5 rounded-xl border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-primary">{disc.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {disc.discount_type === "percentage" ? `${disc.amount}% off` : `$${disc.amount} off`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo & Videos Section */}
        {allImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Photo & Videos</h2>
              <button className="text-sm text-primary font-medium" onClick={() => openLightbox(0)}>
                See all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allImages.slice(0, 6).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {idx === 2 && allImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Reviews</h2>
            <span className="text-sm text-muted-foreground">({product.reviews_count || 0})</span>
          </div>

          {/* Add Review Form - Only for non-admin logged-in users */}
          {canAddReview && (
            <AddReviewForm
              type="product"
              itemId={product.id}
              onReviewAdded={() => {
                reviewsFetchedRef.current = false;
                setReviews([]);
                setReviewsPage(1);
                setHasMoreReviews(true);
                fetchReviews(1, true);
              }}
            />
          )}

          {/* Rating Summary */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  {(product.average_rating || 0).toFixed(1)}
                </p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(product.average_rating || 0)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">({product.reviews_count || 0} Reviews)</p>
              </div>
            </div>
          </div>

          {/* Review Cards */}
          {loadingReviews && reviews.length === 0 ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center bg-primary/10">
                        <span className="text-primary font-semibold text-sm">
                          {(review.user_name || "A").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.user_name || "Anonymous"}</p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(review.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
                </motion.div>
              ))}

              {/* Load more trigger */}
              <div ref={reviewsObserverRef} className="h-4">
                {loadingReviews && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 shadow-sm text-center">
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </div>

        {/* Affiliate Link */}
        {product.affiliate_link && (
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => window.open(product.affiliate_link, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            View on Retailer Site
          </Button>
        )}
      </div>

      <TabBar />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox("prev");
                  }}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox("next");
                  }}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              src={getImageUrl(allImages[lightboxIndex])}
              alt={`Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/20 text-white text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Wishlist Drawer */}
      <RemoveWishlistDrawer
        isOpen={showRemoveDrawer}
        onClose={() => setShowRemoveDrawer(false)}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
        item={product ? {
          id: product.id,
          name: product.name,
          price: product.price,
          featured_image: product.featured_image,
        } : null}
        type="product"
      />
    </div>
  );
}
