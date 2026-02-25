import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin, ChevronDown, Heart, Star, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import SearchBar from "@/components/home/SearchBar";
import ImageSlider from "@/components/home/ImageSlider";
import CategoryTabs from "@/components/home/CategoryTabs";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import NearbyStores from "@/components/home/NearbyStores";
import PromoBanner from "@/components/home/PromoBanner";
import TabBar from "@/components/layout/TabBar";
import { useWishlist } from "@/contexts/WishlistContext";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

import { API_BASE_URL as API_ROOT } from "@/lib/api";

interface BestOfferProduct {
  id: number;
  name: string;
  price: string;
  featured_image: string;
  average_rating: number;
  discounts: { amount: string }[];
  store?: {
    name: string;
    address: string;
  };
}

const Home = () => {
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState<string>("Getting location...");
  const [locationLoading, setLocationLoading] = useState(true);

  // Get user's current location using Geolocation API
  const fetchLocation = useCallback(() => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setLocationName("Location unavailable");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          if (data.address) {
            const { city, town, village, suburb, neighbourhood, state, country } = data.address;
            const locationStr = city || town || village || suburb || neighbourhood || "Unknown";
            const regionStr = state || country || "";
            setLocationName(regionStr ? `${locationStr}, ${regionStr}` : locationStr);
          } else {
            setLocationName("Current Location");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocationName("Current Location");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationName("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationName("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationName("Location request timed out");
            break;
          default:
            setLocationName("Location unavailable");
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Location Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Location</p>
            <button 
              onClick={fetchLocation}
              className="flex items-center gap-1"
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-semibold text-foreground max-w-[180px] truncate">
                {locationName}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Notification Button */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
          </button>
        </div>
      </motion.header>

      {/* Search */}
      <SearchBar />

      {/* Image Slider */}
      <ImageSlider />

      {/* Category Tabs */}
      <CategoryTabs />

      {/* Featured Products - Horizontal Scroll */}
      <FeaturedProducts />

      {/* Nearby Stores - List Style */}
      <NearbyStores />

      {/* Promo Banner */}
      <PromoBanner />

      {/* Best Offers Section */}
      <BestOffers />

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
};

// Best Offers Section - Fetches from API with wishlist support
const BestOffers = () => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<BestOfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<BestOfferProduct | null>(null);

  const handleWishlistClick = (product: BestOfferProduct) => {
    if (isInWishlist('product', product.id)) {
      setItemToRemove(product);
      setRemoveDrawerOpen(true);
    } else {
      toggleWishlist("product", product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        featured_image: product.featured_image,
        store: product.store ? { id: 0, name: product.store.name } : undefined,
        discounts: product.discounts?.map((d) => ({
          id: 0,
          discount_type: "percentage",
          amount: d.amount,
        })),
      });
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      toggleWishlist('product', itemToRemove.id);
      setRemoveDrawerOpen(false);
      setItemToRemove(null);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_ROOT}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ per_page: 6, page: 1 }),
        });
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error("Error fetching best offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="py-4 pb-8">
        <div className="px-4 flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Best Offers</h2>
        </div>
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
              <div className="w-full h-28 bg-secondary animate-pulse" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-secondary rounded animate-pulse w-3/4" />
                <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 pb-8">
      <div className="px-4 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Best Offers</h2>
        <button 
          onClick={() => navigate("/explore")}
          className="flex items-center gap-1 text-primary font-medium text-sm"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {products.map((product) => {
          const discount = product.discounts?.[0] ? Math.round(parseFloat(product.discounts[0].amount)) : 0;
          const price = parseFloat(product.price);

          return (
            <motion.div
              key={product.id}
              whileTap={{ scale: 0.98 }}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="relative">
                <img
                  src={product.featured_image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-28 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                {discount > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent rounded-md">
                    <span className="text-[10px] font-bold text-accent-foreground">{discount}% OFF</span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistClick(product);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${isInWishlist("product", product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                  />
                </button>
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <MapPin className="w-3 h-3" />
                  <p className="text-[10px] truncate">{product.store?.address || "Location available"}</p>
                </div>
                <h3 className="text-xs font-semibold text-foreground line-clamp-1 mb-1">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="text-[10px] text-muted-foreground">
                      {(product.average_rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary">${price.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <RemoveWishlistDrawer
        isOpen={removeDrawerOpen}
        onClose={() => {
          setRemoveDrawerOpen(false);
          setItemToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        item={itemToRemove ? {
          id: itemToRemove.id,
          name: itemToRemove.name,
          price: itemToRemove.price,
          featured_image: itemToRemove.featured_image,
          store: itemToRemove.store ? { id: 0, name: itemToRemove.store.name } : undefined,
        } : null}
        type="product"
      />
    </div>
  );
};

export default Home;
