import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_ROOT = "https://discountpanel.shop/api";

interface FeaturedProduct {
  id: number;
  name: string;
  featured_image: string;
}

const ImageSlider = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch(`${API_ROOT}/products/featured`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ per_page: 6, page: 1 }),
        });
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / 2));

  // Auto-slide
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalPages]);

  if (loading) {
    return (
      <div className="px-4 pt-3">
        <div className="flex gap-2.5">
          <div className="w-[48%] h-36 bg-secondary rounded-2xl animate-pulse flex-shrink-0" />
          <div className="w-[48%] h-36 bg-secondary rounded-2xl animate-pulse flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <div className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pair = products.slice(pageIdx * 2, pageIdx * 2 + 2);
            return (
              <div key={pageIdx} className="flex gap-2.5 w-full flex-shrink-0">
                {pair.map((product) => (
                  <div
                    key={product.id}
                    className="w-[calc(50%-5px)] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.featured_image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-36 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
