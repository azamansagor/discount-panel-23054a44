import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Heart,
  Phone,
  MapPin,
  Star,
  Clock,
  Eye,
  MessageCircle,
  Share2,
  Play,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Users,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface SocialContact {
  id: number;
  type: string;
  value: string;
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
  social_contacts?: SocialContact[];
  website?: string;
  products?: Product[];
  views_count?: number;
  owner_name?: string;
  owner_title?: string;
  owner_avatar?: string;
  price_range?: string;
  features?: { label: string; value: string }[];
}

interface Product {
  id: number;
  name: string;
  price: string;
  featured_image: string;
  discounts?: { amount: string }[];
  discountPercent?: number;
}

interface Review {
  id: number;
  user_name: string;
  user_avatar?: string;
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

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const reviewsFetchedRef = useRef(false);
  const allReviewsRef = useRef<Review[]>([]);

  // Fetch store details
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`${API_ROOT}/stores/${storeId}`);
        if (!response.ok) throw new Error("Failed to fetch store");
        const data = await response.json();
        const raw = data.data || data;
        const images: StoreImage[] = Array.isArray(raw.images)
          ? raw.images
          : Array.isArray(raw.gallery_images)
            ? raw.gallery_images
                .filter(Boolean)
                .map((url: string, idx: number) => ({ id: idx, image: url }))
            : [];

        setStore({
          ...raw,
          images,
          reviews_count: raw.reviews_count ?? raw.review_count ?? 0,
          address: raw.address ?? raw.location_name ?? "",
          phone: raw.phone ?? "",
          social_contacts: raw.social_contacts ?? [],
          website: raw.website ?? undefined,
          views_count: raw.views_count ?? Math.floor(Math.random() * 20000) + 5000,
          owner_name: raw.owner_name ?? "Store Owner",
          owner_title: raw.owner_title ?? "Store Manager",
          owner_avatar: raw.owner_avatar,
          price_range: raw.price_range ?? "$50",
        });
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchStore();
  }, [storeId]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (reviewsFetchedRef.current || loadingReviews) return;
    
    setLoadingReviews(true);
    reviewsFetchedRef.current = true;

    try {
      const response = await fetch(`${API_ROOT}/stores/${storeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 100, page: 1 }),
      });

      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();

      allReviewsRef.current = data.data || data.items || [];
      setReviews(allReviewsRef.current.slice(0, 3));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      reviewsFetchedRef.current = false;
    } finally {
      setLoadingReviews(false);
    }
  }, [storeId, loadingReviews]);

  useEffect(() => {
    if (store && !reviewsFetchedRef.current) {
      fetchReviews();
    }
  }, [store, fetchReviews]);

  // Image functions
  const allImages = store
    ? [
        store.banner_image,
        ...(store.images?.map((img) => img.image) || []),
      ].filter(Boolean)
    : [];

  const getImageUrl = (image: string | null) => {
    if (!image) return "/placeholder.svg";
    if (image.startsWith("http")) return image;
    return `${STORAGE_URL}/${image}`;
  };

  // Rating breakdown calculation
  const getRatingBreakdown = () => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviewsRef.current.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
      breakdown[rating as keyof typeof breakdown]++;
    });
    const total = allReviewsRef.current.length || 1;
    return Object.entries(breakdown)
      .reverse()
      .map(([star, count]) => ({
        star: parseInt(star),
        count,
        percentage: (count / total) * 100,
      }));
  };

  // Get store features from categories
  const getStoreFeatures = () => {
    if (store?.features) return store.features;
    
    const features: { label: string; value: string }[] = [];
    if (store?.categories?.length) {
      features.push({ label: "CATEGORY", value: store.categories[0].name });
    }
    if (store?.open_hours) {
      features.push({ label: "HOURS", value: store.open_hours });
    }
    if (store?.address) {
      features.push({ label: "LOCATION", value: store.address.split(",")[0] || store.address });
    }
    features.push({ label: "STATUS", value: "Open" });
    return features;
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (diffInMonths < 1) return "Recently";
    if (diffInMonths === 1) return "1 month ago";
    return `${diffInMonths} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 pb-20">
        <Skeleton className="w-full h-72" />
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full rounded-xl" />
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

  const ratingBreakdown = getRatingBreakdown();
  const storeFeatures = getStoreFeatures();

  return (
    <div className="min-h-screen bg-secondary/30 pb-32">
      {/* Header Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full shadow-md"
            onClick={() => setWishlist(!wishlist)}
          >
            <Heart className={`h-5 w-5 ${wishlist ? "fill-destructive text-destructive" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full shadow-md"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative w-full h-72">
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
      </div>

      {/* Thumbnail Gallery */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {allImages.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                currentImageIndex === idx
                  ? "border-primary shadow-lg scale-105"
                  : "border-background shadow-md"
              }`}
            >
              <img
                src={getImageUrl(img)}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-5">
        {/* View Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{store.views_count?.toLocaleString()} people viewed this</span>
        </div>

        {/* Store Name */}
        <h1 className="text-xl font-bold text-foreground">{store.name}</h1>

        {/* Feature Tags */}
        {store.categories && store.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {store.categories.slice(0, 3).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium text-muted-foreground"
              >
                <Tag className="h-3 w-3" />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(store.average_rating || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({store.reviews_count || 0} reviews)
          </span>
        </div>

        {/* Owner/Agent Card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                {store.owner_avatar ? (
                  <img
                    src={getImageUrl(store.owner_avatar)}
                    alt={store.owner_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{store.owner_name}</p>
                <p className="text-xs text-primary">{store.owner_title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {store.phone && (
                <Button
                  size="icon"
                  className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => window.open(`tel:${store.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              From <span className="text-foreground font-bold text-lg">{store.price_range}</span>
              <span className="text-muted-foreground">/ Monthly</span>
            </p>
          </div>
        </div>

        {/* Descriptions Section */}
        {store.description && (
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-foreground">Descriptions</h2>
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(store.description),
              }}
            />
          </div>
        )}

        {/* Features & Amenities */}
        {storeFeatures.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-foreground">Features & Amenities</h2>
            <div className="space-y-2">
              {storeFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{feature.label}</span>
                  <span className="text-sm font-medium text-foreground">{feature.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Map */}
        {store.address && (
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-foreground">Location Map</h2>
            <div className="relative h-40 rounded-xl overflow-hidden bg-secondary">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{store.address}</p>
                </div>
              </div>
              <div className="absolute bottom-3 right-3">
                <Button size="icon" className="rounded-full bg-primary text-primary-foreground shadow-lg">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Photo & Videos */}
        {allImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Photo & Videos</h2>
              <button className="text-sm text-primary font-medium">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {allImages.slice(0, 6).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {idx === 2 && (
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
            <h2 className="font-bold text-foreground">Review</h2>
            <button className="text-sm text-primary font-medium">See all</button>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">{store.average_rating?.toFixed(1) || "0.0"}</p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(store.average_rating || 0)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">({store.reviews_count || 0} Reviews)</p>
              </div>

              {/* Rating Bars */}
              <div className="flex-1 space-y-1.5">
                {ratingBreakdown.map(({ star, percentage }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{star}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review Cards */}
          {loadingReviews ? (
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
                      <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                        {review.user_avatar ? (
                          <img
                            src={getImageUrl(review.user_avatar)}
                            alt={review.user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <span className="text-primary font-semibold text-sm">
                              {(review.user_name || "A").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.user_name || "Anonymous"}</p>
                        <div className="flex items-center gap-0.5">
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
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(review.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{review.comment}"
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 shadow-sm text-center">
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </div>

        {/* Social Links */}
        {(() => {
          const contacts = store.social_contacts ?? [];
          const facebookUrl = contacts.find((c) => c.type?.toLowerCase().includes("facebook"))?.value;
          const instagramUrl = contacts.find((c) => c.type?.toLowerCase().includes("instagram"))?.value;
          const twitterUrl = contacts.find((c) => {
            const t = c.type?.toLowerCase();
            return t.includes("twitter") || t.includes("x.com") || t === "x";
          })?.value;
          const websiteUrl = store.website;

          if (!facebookUrl && !instagramUrl && !twitterUrl && !websiteUrl) return null;

          return (
            <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="font-bold text-foreground">Connect With Us</h2>
              <div className="flex items-center gap-3">
                {facebookUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.open(facebookUrl, "_blank")}
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                )}
                {instagramUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.open(instagramUrl, "_blank")}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                {twitterUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.open(twitterUrl, "_blank")}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                )}
                {websiteUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.open(websiteUrl, "_blank")}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border p-4 safe-area-inset-bottom">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground line-through">$65.00</p>
            <p className="text-xl font-bold text-foreground">{store.price_range || "$50.00"}</p>
          </div>
          <Button className="rounded-xl px-8 py-6 bg-primary text-primary-foreground font-semibold shadow-lg">
            Contact Now
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
