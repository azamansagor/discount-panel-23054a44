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
  ShoppingCart,
  Share2,
  RefreshCw,
  Store,
  Tag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TabBar from "@/components/layout/TabBar";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

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

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [wishlist, setWishlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const reviewsObserverRef = useRef<HTMLDivElement>(null);
  const reviewsFetchedRef = useRef(false);

  const [activeTab, setActiveTab] = useState("details");

  // Pull to refresh state
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

  // Fetch reviews
  const fetchReviews = useCallback(async (page: number, reset = false) => {
    if (loadingReviews || (!hasMoreReviews && !reset)) return;

    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_ROOT}/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 5, page }),
      });

      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();

      const newReviews = data.data || data.items || [];
      
      if (reset) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }

      setHasMoreReviews(newReviews.length === 5);
      setReviewsPage(page);
      reviewsFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId, loadingReviews, hasMoreReviews]);

  // Load reviews when tab changes
  useEffect(() => {
    if (activeTab === "reviews" && !reviewsFetchedRef.current) {
      fetchReviews(1, true);
    }
  }, [activeTab]);

  // Infinite scroll for reviews
  useEffect(() => {
    if (activeTab !== "reviews") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreReviews && !loadingReviews) {
          fetchReviews(reviewsPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    const target = reviewsObserverRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [activeTab, hasMoreReviews, loadingReviews, reviewsPage, fetchReviews]);

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
      if (activeTab === "reviews") {
        await fetchReviews(1, true);
      }
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartRef.current = 0;
  };

  // Image slider functions
  const allImages = product
    ? [
        product.featured_image,
        ...(product.images?.map((img) => img.image) || []),
      ].filter(Boolean)
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
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
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
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
      className="min-h-screen bg-background pb-32 overflow-y-auto"
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
          onClick={() => navigate(-1)}
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
            onClick={() => setWishlist(!wishlist)}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                wishlist ? "fill-destructive text-destructive" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative w-full h-80 bg-secondary">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={getImageUrl(allImages[currentImageIndex])}
            alt={product.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-t bg-background px-4 h-12">
          <TabsTrigger
            value="details"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Reviews ({product.reviews_count || 0})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="p-4 space-y-6 mt-0">
          {/* Description */}
          {product.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-lg">Description</h3>
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
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-lg">Active Offers</h3>
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

          {/* Affiliate Link */}
          {product.affiliate_link && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(product.affiliate_link, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              View on Retailer Site
            </Button>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="p-4 mt-0">
          <div className="space-y-4">
            {/* Rating Summary */}
            {product.reviews_count > 0 && (
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">
                    {(product.average_rating || 0).toFixed(1)}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
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
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Based on {product.reviews_count} reviews
                  </p>
                </div>
              </div>
            )}

            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-card rounded-xl shadow-sm border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    {review.user_name || "Anonymous"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
                {review.created_at && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            ))}

            {/* Loading indicator */}
            {loadingReviews && (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 bg-card rounded-xl border border-border/50">
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Load more trigger */}
            <div ref={reviewsObserverRef} className="h-4" />

            {reviews.length === 0 && !loadingReviews && (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Be the first to review this product
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-shrink-0"
            onClick={() => setWishlist(!wishlist)}
          >
            <Heart
              className={`h-5 w-5 ${
                wishlist ? "fill-destructive text-destructive" : ""
              }`}
            />
          </Button>
          <Button className="flex-1 gap-2" size="lg">
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
