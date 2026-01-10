import { motion } from "framer-motion";
import { MapPin, ChevronRight, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

interface Store {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  distance: string;
}

// Mock API call - replace with actual API
const fetchStores = async (): Promise<Store[]> => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  
  return [
    {
      id: "1",
      name: "TechZone Electronics",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop",
      category: "Electronics",
      location: "123 Market Street",
      distance: "0.5 km",
    },
    {
      id: "2",
      name: "Fashion Forward",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=100&h=100&fit=crop",
      category: "Fashion",
      location: "456 Style Avenue",
      distance: "1.2 km",
    },
    {
      id: "3",
      name: "Gourmet Kitchen",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
      category: "Food & Dining",
      location: "789 Culinary Lane",
      distance: "0.8 km",
    },
    {
      id: "4",
      name: "Beauty Palace",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
      category: "Beauty",
      location: "321 Glamour Road",
      distance: "1.5 km",
    },
    {
      id: "5",
      name: "Sports Hub",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop",
      category: "Sports & Fitness",
      location: "555 Athletic Blvd",
      distance: "2.0 km",
    },
    {
      id: "6",
      name: "Home & Living",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop",
      category: "Home Decor",
      location: "888 Cozy Street",
      distance: "1.8 km",
    },
  ];
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
