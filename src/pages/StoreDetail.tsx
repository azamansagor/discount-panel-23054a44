import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Phone,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import TabBar from "@/components/layout/TabBar";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

interface StoreImage {
  id: number;
  image: string;
}

interface StoreCategory {
  id: number;
  name: string;
  slug: string;
}

interface StoreDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  banner_image: string;
  images: StoreImage[];
  categories: StoreCategory[];
  average_rating: number;
  reviews_count: number;
  open_hours?: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  featured_image: string;
  discounts: { amount: string }[];
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [wishlist, setWishlist] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const productsObserverRef = useRef<HTMLDivElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const reviewsObserverRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("details");

  // Fetch store details
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`${API_ROOT}/stores/${storeId}`);
        if (!response.ok) throw new Error("Failed to fetch store");
        const data = await response.json();
        setStore(data.data || data);
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchStore();
  }, [storeId]);

  // Fetch products
  const fetchProducts = useCallback(async (page: number, reset = false) => {
    if (loadingProducts || (!hasMoreProducts && !reset)) return;

    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_ROOT}/stores/${storeId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 10, page }),
      });

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      const newProducts = data.data || data.items || [];
      
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setHasMoreProducts(newProducts.length === 10);
      setProductsPage(page);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, [storeId, loadingProducts, hasMoreProducts]);

  // Fetch reviews
  const fetchReviews = useCallback(async (page: number, reset = false) => {
    if (loadingReviews || (!hasMoreReviews && !reset)) return;

    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_ROOT}/stores/${storeId}/reviews`, {
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
  }, [storeId, loadingReviews, hasMoreReviews]);

  // Load initial data when tab changes
  useEffect(() => {
    if (activeTab === "products" && products.length === 0) {
      fetchProducts(1, true);
    } else if (activeTab === "reviews" && reviews.length === 0) {
      fetchReviews(1, true);
    }
  }, [activeTab]);

  // Infinite scroll for products
  useEffect(() => {
    if (activeTab !== "products") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !loadingProducts) {
          fetchProducts(productsPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    const target = productsObserverRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [activeTab, hasMoreProducts, loadingProducts, productsPage, fetchProducts]);

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
  const allImages = store
    ? [
        store.banner_image,
        ...(store.images?.map((img) => img.image) || []),
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

  const calculateDiscount = (product: Product) => {
    if (!product.discounts?.length) return 0;
    return Math.round(parseFloat(product.discounts[0].amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="w-full h-64" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
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
      </div>

      {/* Image Slider */}
      <div className="relative w-full h-64 bg-secondary">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={getImageUrl(allImages[currentImageIndex])}
            alt={store.name}
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
            value="products"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Products
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
          {/* Store Name Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">{store.name}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWishlist(!wishlist)}
                className="rounded-full"
              >
                <Heart
                  className={`h-5 w-5 ${
                    wishlist ? "fill-destructive text-destructive" : ""
                  }`}
                />
              </Button>
              {store.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => window.open(`tel:${store.phone}`)}
                >
                  <Phone className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Rating Row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(store.average_rating || 0)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({store.reviews_count || 0} reviews)
            </span>
          </div>

          {/* Location Row */}
          {store.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{store.address}</span>
            </div>
          )}

          {/* Description */}
          {store.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {store.description}
              </p>
            </div>
          )}

          {/* Open Hours */}
          {store.open_hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{store.open_hours}</span>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="p-4 mt-0">
          <div className="space-y-3">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-3 bg-card rounded-xl shadow-sm border border-border/50"
              >
                {/* Product Image with Discount Ribbon */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={getImageUrl(product.featured_image)}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {calculateDiscount(product) > 0 && (
                    <div className="absolute top-0 left-0 bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-tl-lg rounded-br-lg">
                      -{calculateDiscount(product)}%
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold mt-1">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {loadingProducts && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-card rounded-xl">
                    <Skeleton className="w-20 h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more trigger */}
            <div ref={productsObserverRef} className="h-4" />

            {products.length === 0 && !loadingProducts && (
              <p className="text-center text-muted-foreground py-8">
                No products available
              </p>
            )}
          </div>
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

      <TabBar />
    </div>
  );
}
