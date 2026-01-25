import { motion } from "framer-motion";
import { ChevronRight, Heart, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";

interface Discount {
  id: number;
  title: string;
  discount_type: string;
  amount: string;
}

interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  featured_image: string;
  average_rating: number;
  discounts: Discount[];
  store?: {
    name?: string;
    address?: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApiProduct[];
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  discount: number;
  location: string;
  storeName: string;
}

const API_ROOT = "https://discountpanel.shop/api";

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_ROOT}/products/featured`, {
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
    throw new Error("Failed to fetch products");
  }

  const result: ApiResponse = await response.json();
  
  return result.data.map((item) => {
    const discount = item.discounts.length > 0 
      ? parseFloat(item.discounts[0].amount) 
      : 0;
    const price = parseFloat(item.price);
    const originalPrice = discount > 0 
      ? price / (1 - discount / 100) 
      : price;

    return {
      id: String(item.id),
      name: item.name,
      image: item.featured_image,
      price,
      originalPrice: Math.round(originalPrice * 100) / 100,
      rating: item.average_rating || 0,
      reviewCount: Math.floor(Math.random() * 200) + 20,
      discount: Math.round(discount),
      location: item.store?.address || "Location available",
      storeName: item.store?.name || "Store",
    };
  });
};

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-4">
        <div className="px-4 flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Featured Deals</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="bg-card rounded-2xl overflow-hidden border border-border">
                <div className="aspect-[16/10] bg-secondary animate-pulse" />
                <div className="p-3.5 space-y-2">
                  <div className="w-full h-4 bg-secondary rounded animate-pulse" />
                  <div className="flex justify-between">
                    <div className="w-24 h-3 bg-secondary rounded animate-pulse" />
                    <div className="w-16 h-4 bg-secondary rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="px-4 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Featured Deals</h2>
        <button 
          onClick={() => navigate("/explore")}
          className="flex items-center gap-1 text-primary font-medium text-sm"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
        {products.map((product, index) => {
          const inWishlist = isInWishlist('product', parseInt(product.id));
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-72"
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10]">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                      {product.discount}% OFF
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-3 right-3 w-8 h-8 bg-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist('product', parseInt(product.id), {
                        id: parseInt(product.id),
                        name: product.name,
                        price: String(product.price),
                        featured_image: product.image,
                        store: { id: 0, name: product.storeName },
                      });
                    }}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-destructive text-destructive' : 'text-white'}`} />
                  </button>
                </div>

                {/* Content with curved top */}
                <div className="relative bg-card -mt-4 pt-2 px-3.5 pb-3.5" style={{ borderRadius: '16px 16px 0 0' }}>
                  {/* Time & Distance */}
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                    <Clock className="h-3 w-3" />
                    <span>25-30 mins</span>
                    <span>·</span>
                    <span>4.4 km</span>
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1.5">
                    {product.name}
                  </h3>

                  {/* Location & Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs truncate max-w-[100px]">{product.location}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      ${product.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedProducts;
