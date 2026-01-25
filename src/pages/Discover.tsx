import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, ChevronLeft, Navigation, Store, Package, Heart } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import TabBar from "@/components/layout/TabBar";
import { Input } from "@/components/ui/input";
import { useWishlist } from "@/contexts/WishlistContext";
import "leaflet/dist/leaflet.css";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_ROOT = "https://discountpanel.shop/storage/";

interface SearchResult {
  id: number;
  name: string;
  type: 'store' | 'product';
  price?: number;
  discounted_price?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  featured_image?: string;
  store?: {
    name: string;
    address: string;
  };
}

// Custom marker icon - show name instead of price
const createPriceMarker = (name: string, type: 'store' | 'product') => {
  const truncatedName = name.length > 15 ? name.substring(0, 15) + '...' : name;
  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="bg-card shadow-lg rounded-full px-3 py-1.5 border border-border text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-1">
        ${type === 'store' ? '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' : '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>'}
        ${truncatedName}
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [60, 15],
  });
};

// Component to handle map center updates
const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const Discover = () => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'store' | 'product'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([23.8103, 90.4125]); // Default: Dhaka
  const [locationName, setLocationName] = useState("Getting location...");
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          // Reverse geocode to get location name
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            .then(res => res.json())
            .then(data => {
              const address = data.address;
              const locationStr = address.suburb || address.neighbourhood || address.city || address.town || "Current Location";
              setLocationName(locationStr);
            })
            .catch(() => setLocationName("Current Location"));
        },
        () => {
          setLocationName("Location unavailable");
        }
      );
    }
  }, []);

  // Fetch nearby stores/products on mount
  useEffect(() => {
    fetchNearbyItems();
  }, [userLocation]);

  const fetchNearbyItems = async () => {
    setLoading(true);
    try {
      // Fetch stores
      const storesRes = await fetch(`${API_ROOT}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 10, page: 1 }),
      });
      const storesData = await storesRes.json();

      // Fetch products
      const productsRes = await fetch(`${API_ROOT}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 10, page: 1 }),
      });
      const productsData = await productsRes.json();

      const stores: SearchResult[] = (storesData.data || []).map((store: any) => ({
        id: store.id,
        name: store.name,
        type: 'store' as const,
        address: store.address,
        featured_image: store.banner_image,
        // Generate random nearby coordinates for demo (in production, use real coordinates)
        latitude: userLocation[0] + (Math.random() - 0.5) * 0.02,
        longitude: userLocation[1] + (Math.random() - 0.5) * 0.02,
      }));

      const products: SearchResult[] = (productsData.data || []).map((product: any) => {
        const discount = product.discounts?.[0];
        return {
          id: product.id,
          name: product.name,
          type: 'product' as const,
          price: product.price,
          discounted_price: discount ? product.price - (product.price * (discount.discount_percentage / 100)) : product.price,
          featured_image: product.featured_image,
          store: product.store,
          // Generate random nearby coordinates for demo
          latitude: userLocation[0] + (Math.random() - 0.5) * 0.02,
          longitude: userLocation[1] + (Math.random() - 0.5) * 0.02,
        };
      });

      setResults([...stores, ...products]);
    } catch (error) {
      console.error("Error fetching nearby items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      fetchNearbyItems();
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Search stores
        const storesRes = await fetch(`${API_ROOT}/stores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ per_page: 10, page: 1, search: query }),
        });
        const storesData = await storesRes.json();

        // Search products
        const productsRes = await fetch(`${API_ROOT}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ per_page: 10, page: 1, search: query }),
        });
        const productsData = await productsRes.json();

        const stores: SearchResult[] = (storesData.data || []).map((store: any) => ({
          id: store.id,
          name: store.name,
          type: 'store' as const,
          address: store.address,
          featured_image: store.banner_image,
          latitude: userLocation[0] + (Math.random() - 0.5) * 0.02,
          longitude: userLocation[1] + (Math.random() - 0.5) * 0.02,
        }));

        const products: SearchResult[] = (productsData.data || []).map((product: any) => {
          const discount = product.discounts?.[0];
          return {
            id: product.id,
            name: product.name,
            type: 'product' as const,
            price: product.price,
            discounted_price: discount ? product.price - (product.price * (discount.discount_percentage / 100)) : product.price,
            featured_image: product.featured_image,
            store: product.store,
            latitude: userLocation[0] + (Math.random() - 0.5) * 0.02,
            longitude: userLocation[1] + (Math.random() - 0.5) * 0.02,
          };
        });

        setResults([...stores, ...products]);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const filteredResults = results.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const formatPrice = (price: number | undefined | null) => {
    const numPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    return `$${numPrice.toFixed(2)}`;
  };

  const handleItemClick = (item: SearchResult) => {
    if (item.type === 'store') {
      navigate(`/store/${item.id}`);
    } else {
      navigate(`/product/${item.id}`);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with Search */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-[1000] bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-secondary rounded-xl"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stores & products..."
              className="pl-10 bg-secondary border-0 rounded-xl"
            />
          </div>
        </div>
      </motion.header>

      {/* Map Container - fills available space */}
      <div className="flex-1 relative">
        {/* Filter Tabs & Location Info - floating over map */}
        <div className="absolute top-0 left-0 right-0 z-[999] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            {[
              { key: 'all', label: 'All', icon: null },
              { key: 'store', label: 'Stores', icon: Store },
              { key: 'product', label: 'Products', icon: Package },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                {filter.icon && <filter.icon className="w-4 h-4" />}
                {filter.label}
              </button>
            ))}
          </div>
          <p className="text-sm">
            <span className="font-bold text-foreground">{filteredResults.length} listings</span>
            <span className="text-primary"> available in {locationName}</span>
          </p>
        </div>

        {/* Map */}
        <MapContainer
          center={userLocation}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={userLocation} />
          
          {/* User location marker */}
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>

          {/* Result markers */}
          {filteredResults.map((item) => (
            item.latitude && item.longitude && (
              <Marker
                key={`${item.type}-${item.id}`}
                position={[item.latitude, item.longitude]}
                icon={createPriceMarker(item.name, item.type)}
                eventHandlers={{
                  click: () => handleItemClick(item),
                }}
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    {item.address && <p className="text-xs text-gray-500">{item.address}</p>}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>

        {/* Current location button */}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
              });
            }
          }}
          className="absolute bottom-44 right-4 z-[1000] p-3 bg-card rounded-full shadow-lg border border-border"
        >
          <Navigation className="w-5 h-5 text-primary" />
        </button>

        {/* Bottom Results Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-[999] bg-background rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-20">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-2" />
          <div className="px-4 pb-4">
            <h2 className="text-lg font-bold text-foreground mb-3">
              {searchQuery ? 'Search Results' : 'Nearby'}
            </h2>
            
            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-64 h-24 bg-secondary rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredResults.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleItemClick(item)}
                    className="flex-shrink-0 w-64 bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer"
                  >
                    <div className="flex gap-3 p-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={item.featured_image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(item.type, item.id, {
                              id: item.id,
                              name: item.name,
                              price: item.price ? String(item.price) : undefined,
                              featured_image: item.featured_image,
                              banner_image: item.featured_image,
                            });
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                        >
                          <Heart className={`w-2.5 h-2.5 transition-colors ${isInWishlist(item.type, item.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-1">{item.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <p className="text-xs line-clamp-1">
                            {item.type === 'store' 
                              ? item.address || 'Address not available'
                              : item.store?.address || 'Location not available'
                            }
                          </p>
                        </div>
                        {item.type === 'product' && item.discounted_price && (
                          <p className="text-primary font-bold text-sm mt-1">
                            {formatPrice(item.discounted_price)}
                            {item.price !== item.discounted_price && (
                              <span className="text-muted-foreground text-xs line-through ml-1">
                                {formatPrice(item.price || 0)}
                              </span>
                            )}
                          </p>
                        )}
                        {item.type === 'store' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            Store
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
};

export default Discover;
