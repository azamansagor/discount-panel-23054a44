import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  discount: number;
}

const API_ROOT = "https://discountpanel.shop/api";

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_ROOT}/products/featured`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      per_page: 5,
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
      discount: Math.round(discount),
    };
  });
};

export const FeaturedProducts = () => {
  const navigate = useNavigate();
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
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="w-full h-40 bg-secondary rounded-2xl animate-pulse mb-3" />
              <div className="w-3/4 h-4 bg-secondary rounded animate-pulse mb-2" />
              <div className="w-1/2 h-4 bg-secondary rounded animate-pulse" />
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
        <button className="flex items-center gap-1 text-primary font-medium text-sm">
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-40"
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-card rounded-2xl overflow-hidden shadow-card cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                {/* Discount badge - only show if discount > 0 */}
                {product.discount > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 gradient-accent rounded-lg">
                    <span className="text-xs font-bold text-accent-foreground">
                      -{product.discount}%
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                  <span className="text-xs font-medium text-foreground">
                    {product.rating}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-primary">
                    ${product.price}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;
