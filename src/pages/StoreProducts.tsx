import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TabBar from "@/components/layout/TabBar";
import { useWishlist } from "@/contexts/WishlistContext";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

interface Product {
  id: number;
  name: string;
  price: string;
  featured_image: string;
  discounts?: { amount: string }[];
  discountPercent?: number;
}

interface StoreInfo {
  id: number;
  name: string;
}

export default function StoreProducts() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist, removeFromWishlist } = useWishlist();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<Product | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const fetchStoreProducts = async () => {
      try {
        const response = await fetch(`${API_ROOT}/stores/${storeId}`);
        if (!response.ok) throw new Error("Failed to fetch store");
        const data = await response.json();
        const raw = data.data || data;

        setStore({ id: raw.id, name: raw.name });
        setProducts(raw.products || []);
      } catch (error) {
        console.error("Error fetching store products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchStoreProducts();
  }, [storeId]);

  const getImageUrl = (image: string | null) => {
    if (!image) return "/placeholder.svg";
    if (image.startsWith("http")) return image;
    return `${STORAGE_URL}/${image}`;
  };

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWishlist("product", product.id)) {
      setItemToRemove(product);
      setRemoveDrawerOpen(true);
    } else {
      toggleWishlist("product", product.id, {
        id: product.id,
        name: product.name,
        price: product.price,
        featured_image: product.featured_image,
      });
    }
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    setIsRemoving(true);
    await removeFromWishlist("product", itemToRemove.id);
    setIsRemoving(false);
    setRemoveDrawerOpen(false);
    setItemToRemove(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 pb-24">
        <div className="sticky top-0 z-10 bg-background px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="px-4 grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 -ml-2 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Products</h1>
            {store && (
              <p className="text-sm text-muted-foreground">{store.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => {
                const discountPercent =
                  product.discountPercent ||
                  (product.discounts?.[0]?.amount
                    ? parseFloat(product.discounts[0].amount)
                    : 0);
                const originalPrice = parseFloat(product.price);
                const discountedPrice =
                  discountPercent > 0
                    ? originalPrice * (1 - discountPercent / 100)
                    : originalPrice;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    className="bg-card rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      <img
                        src={getImageUrl(product.featured_image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />

                      {/* Discount Ribbon */}
                      {discountPercent > 0 && (
                        <div className="absolute top-0 left-0 overflow-hidden w-20 h-20">
                          <div className="absolute top-3 -left-6 w-24 bg-destructive text-destructive-foreground text-xs font-bold py-1 text-center transform -rotate-45">
                            {Math.round(discountPercent)}% OFF
                          </div>
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => handleWishlistToggle(product, e)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isInWishlist("product", product.id)
                              ? "fill-destructive text-destructive"
                              : "text-white"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-medium text-sm text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No products available</p>
            <p className="text-sm text-muted-foreground mt-1">
              This store hasn't added any products yet
            </p>
          </div>
        )}
      </div>

      <TabBar />

      {/* Remove Wishlist Drawer */}
      <RemoveWishlistDrawer
        isOpen={removeDrawerOpen}
        onClose={() => {
          setRemoveDrawerOpen(false);
          setItemToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
        item={
          itemToRemove
            ? {
                id: itemToRemove.id,
                name: itemToRemove.name,
                price: itemToRemove.price,
                featured_image: itemToRemove.featured_image,
              }
            : null
        }
        type="product"
      />
    </div>
  );
}
