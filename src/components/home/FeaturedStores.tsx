import { motion } from "framer-motion";
import { MapPin, ChevronRight, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

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
}

const API_ROOT = "https://discountpanel.shop/api";

const fetchStores = async (): Promise<Store[]> => {
  const response = await fetch(`${API_ROOT}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      per_page: 6,
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
    distance: "Nearby",
  }));
};

export const FeaturedStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores().then((data) => {
      setStores(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Featured Stores</h2>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 bg-card rounded-2xl">
              <div className="w-16 h-16 bg-secondary rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-secondary rounded animate-pulse mb-2" />
                <div className="w-1/2 h-3 bg-secondary rounded animate-pulse mb-2" />
                <div className="w-2/3 h-3 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Featured Stores</h2>
        <button className="flex items-center gap-1 text-primary font-medium text-sm">
          View All
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
            className="flex gap-3 p-3 bg-card rounded-2xl shadow-sm border border-border/50"
          >
            {/* Store Image */}
            <img
              src={store.image}
              alt={store.name}
              className="w-16 h-16 rounded-xl object-cover"
            />

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {store.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                {store.category}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{store.location}</span>
                <span className="text-primary font-medium">• {store.distance}</span>
              </div>
            </div>

            {/* View Location Button */}
            <button className="self-center flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">View</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedStores;
