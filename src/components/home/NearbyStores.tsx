import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

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
  price: string;
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
    price: "$" + (Math.floor(Math.random() * 3000) + 500) + "/Monthly",
  }));
};

export const NearbyStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<Store | null>(null);

  const handleWishlistClick = (store: Store) => {
    const storeId = parseInt(store.id);
    if (isInWishlist('store', storeId)) {
      setItemToRemove(store);
      setRemoveDrawerOpen(true);
    } else {
      toggleWishlist('store', storeId, {
        id: storeId,
        name: store.name,
        banner_image: store.image,
      });
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      toggleWishlist('store', parseInt(itemToRemove.id));
      setRemoveDrawerOpen(false);
      setItemToRemove(null);
    }
  };

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
            <div key={i} className="flex gap-3 p-3 bg-card rounded-2xl border border-border">
              <div className="w-20 h-20 bg-secondary rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-secondary rounded animate-pulse" />
                <div className="w-1/2 h-3 bg-secondary rounded animate-pulse" />
                <div className="w-2/3 h-3 bg-secondary rounded animate-pulse" />
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

      <div className="space-y-3">
        {stores.map((store, index) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/store/${store.id}`)}
            className="flex gap-3 p-3 bg-card rounded-2xl border border-border shadow-sm cursor-pointer"
          >
            {/* Store Image */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={store.image || "/placeholder.svg"}
                alt={store.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWishlistClick(store);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
              >
                <Heart className={`w-3 h-3 transition-colors ${isInWishlist('store', parseInt(store.id)) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                {store.name}
              </h3>
              
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate">{store.location}</span>
              </div>
              
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-semibold">{store.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <RemoveWishlistDrawer
        isOpen={removeDrawerOpen}
        onClose={() => {
          setRemoveDrawerOpen(false);
          setItemToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        item={itemToRemove ? {
          id: parseInt(itemToRemove.id),
          name: itemToRemove.name,
          banner_image: itemToRemove.image,
          address: itemToRemove.location,
        } : null}
        type="store"
      />
    </div>
  );
};

export default NearbyStores;
