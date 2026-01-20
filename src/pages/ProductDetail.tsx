import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  };
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

  const [activeTab, setActiveTab] = useState("details");

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_ROOT}/products/${productId}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        const data = await response.json();
        setProduct(data.data || data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

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
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId, loadingReviews, hasMoreReviews]);

  // Load reviews when tab changes
  useEffect(() => {
    if (activeTab === "reviews" && reviews.length === 0) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-72" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const discount = calculateDiscount();
  const originalPrice = calculateOriginalPrice();
  const price = parseFloat(product.price);

  return (
    <div className="min-h-screen bg-background pb-32">
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
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => setWishlist(!wishlist)}
        >
          <Heart
            className={`h-5 w-5 ${
              wishlist ? "fill-destructive text-destructive" : ""
            }`}
          />
        </Button>
      </div>

      {/* Image Slider */}
      <div className="relative w-full h-72 bg-secondary">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={getImageUrl(allImages[currentImageIndex])}
            alt={product.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </AnimatePresence>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-16 left-4 bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-lg">
            -{discount}%
          </div>
        )}

        {/* Slider Controls */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex
                      ? "bg-primary"
                      : "bg-background/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Price and Name Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-primary">
            ${price.toFixed(2)}
          </span>
          {discount > 0 && (
            <span className="text-base text-muted-foreground line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <h1 className="text-lg font-semibold text-foreground">{product.name}</h1>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(product.average_rating || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviews_count || 0} reviews)
          </span>
        </div>

        {/* Category */}
        {product.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {product.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 h-12">
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
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="p-4 space-y-4 mt-0">
          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Store */}
          {product.store && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Sold by</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/store/${product.store?.id}`)}
              >
                {product.store.name}
              </Button>
            </div>
          )}

          {/* Discount Info */}
          {product.discounts?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Active Offers</h3>
              <div className="space-y-2">
                {product.discounts.map((disc) => (
                  <div
                    key={disc.id}
                    className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <p className="font-medium text-primary">{disc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {disc.amount}% off
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="p-4 mt-0">
          <div className="space-y-4">
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
                            : "text-muted-foreground"
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
                  <div key={i} className="p-4 bg-card rounded-xl">
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
              <p className="text-center text-muted-foreground py-8">
                No reviews yet
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border">
        <Button className="w-full gap-2" size="lg">
          <ShoppingCart className="h-5 w-5" />
          Add to Cart - ${price.toFixed(2)}
        </Button>
      </div>

      <TabBar />
    </div>
  );
}
