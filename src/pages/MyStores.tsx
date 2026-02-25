import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Store, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TabBar from "@/components/layout/TabBar";

const API_BASE_URL = "https://discountpanel.shop/api";

interface StoreItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  banner_image: string;
  location_name: string;
  created_at: string;
}

const MyStores = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchStores();
  }, [isAuthenticated]);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/stores`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setStores(Array.isArray(data.data) ? data.data : data.data.data || []);
      } else if (data.stores) {
        setStores(data.stores);
      }
    } catch {
      console.error("Failed to fetch stores");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">My Stores</h1>
          </div>
          <button
            onClick={() => navigate("/my-stores/create")}
            className="p-2 bg-primary rounded-full"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </motion.header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">No stores yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first store to start selling</p>
            <button
              onClick={() => navigate("/my-stores/create")}
              className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Create Store
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store, index) => (
              <motion.button
                key={store.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/my-stores/${store.id}/products`)}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 text-left"
              >
                {store.banner_image ? (
                  <img
                    src={store.banner_image}
                    alt={store.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{store.name}</p>
                  {store.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {store.location_name}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default MyStores;
