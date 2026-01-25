import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";

interface ApiStore {
  id: number;
  name: string;
  slug: string;
  banner_image: string;
  address?: string;
  categories?: { id: number; name: string; slug: string }[];
}

interface ApiResponse {
  success: boolean;
  data: ApiStore[];
}

interface Store {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  distance: string;
  deliveryTime: string;
}

const API_ROOT = "https://discountpanel.shop/api";

const fetchStores = async (): Promise<Store[]> => {
  const response = await fetch(`${API_ROOT}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      per_page: 4,
      page: 1,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stores");
  }

  const result: ApiResponse = await response.json();

  return result.data.map((store) => ({
    id: String(store.id),
    name: store.name,
    image: store.banner_image,
    category: store.categories?.[0]?.name || "General",
    location: store.address || "Location not available",
    distance: "4.4 km",
    deliveryTime: "25-30 mins",
  }));
};

export const NearbyStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchStores().then((data) => {
      setStores(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Near By Locations</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
              <div className="aspect-[16/10] bg-secondary animate-pulse" />
              <div className="p-3.5 space-y-2">
                <div className="w-3/4 h-4 bg-secondary rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="w-1/2 h-3 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Near By Locations</h2>
        <button 
          onClick={() => navigate("/explore")}
          className="flex items-center gap-1 text-primary font-medium text-sm"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {stores.map((store, index) => {
          const inWishlist = isInWishlist('store', parseInt(store.id));
          
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/store/${store.id}`)}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/10]">
                <img
                  src={store.image || "/placeholder.svg"}
                  alt={store.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                
                {/* Curved bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-card" style={{ borderRadius: '20px 20px 0 0' }} />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                  {store.category}
                </div>
                
                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist('store', parseInt(store.id), {
                      id: parseInt(store.id),
                      name: store.name,
                      banner_image: store.image,
                    });
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-destructive text-destructive' : 'text-white'}`} />
                </button>

                {/* Time & Distance */}
                <div className="absolute bottom-7 left-2 flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>{store.deliveryTime}</span>
                  <span>·</span>
                  <span>{store.distance}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3.5">
                {/* Name */}
                <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1.5">
                  {store.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs truncate">{store.location}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyStores;
