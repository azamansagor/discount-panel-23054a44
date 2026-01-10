import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  discount: number;
}

// Mock API call - replace with actual API
const fetchProducts = async (): Promise<Product[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  
  return [
    {
      id: "1",
      name: "Wireless Earbuds Pro",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop",
      price: 79.99,
      originalPrice: 129.99,
      rating: 4.8,
      discount: 38,
    },
    {
      id: "2",
      name: "Smart Watch Series 5",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&fit=crop",
      price: 199.99,
      originalPrice: 299.99,
      rating: 4.6,
      discount: 33,
    },
    {
      id: "3",
      name: "Premium Sneakers",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
      price: 89.99,
      originalPrice: 149.99,
      rating: 4.9,
      discount: 40,
    },
    {
      id: "4",
      name: "Leather Backpack",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop",
      price: 59.99,
      originalPrice: 99.99,
      rating: 4.7,
      discount: 40,
    },
    {
      id: "5",
      name: "Portable Speaker",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop",
      price: 49.99,
      originalPrice: 79.99,
      rating: 4.5,
      discount: 37,
    },
    {
      id: "6",
      name: "Coffee Maker",
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=200&h=200&fit=crop",
      price: 119.99,
      originalPrice: 179.99,
      rating: 4.4,
      discount: 33,
    },
  ];
};

export const FeaturedProducts = () => {
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
              className="bg-card rounded-2xl overflow-hidden shadow-card"
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                />
                {/* Discount badge */}
                <div className="absolute top-2 left-2 px-2 py-1 gradient-accent rounded-lg">
                  <span className="text-xs font-bold text-accent-foreground">
                    -{product.discount}%
                  </span>
                </div>
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
