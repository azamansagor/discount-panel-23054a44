import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_ROOT } from "@/lib/api";

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
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

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

  const total = products.length;

  // Auto-slide
  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(interval);
  }, [total]);

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (total <= 1) return;
      const threshold = 50;
      const swipe = info.offset.x;
      const velocity = info.velocity.x;

      if (swipe < -threshold || velocity < -500) {
        setCurrentIndex((prev) => (prev + 1) % total);
      } else if (swipe > threshold || velocity > 500) {
        setCurrentIndex((prev) => ((prev - 1) + total) % total);
      }
    },
    [total]
  );

  if (loading) {
    return (
      <div className="px-4 pt-3">
        <div className="flex gap-2 items-center justify-center">
          <div className="w-[25%] h-24 bg-secondary rounded-2xl animate-pulse" />
          <div className="w-[45%] h-28 bg-secondary rounded-2xl animate-pulse" />
          <div className="w-[25%] h-24 bg-secondary rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (total === 0) return null;

  const getIndex = (offset: number) => ((currentIndex + offset) % total + total) % total;
  const leftProduct = products[getIndex(-1)];
  const centerProduct = products[getIndex(0)];
  const rightProduct = products[getIndex(1)];

  const slides = [
    { product: leftProduct, position: "left" as const },
    { product: centerProduct, position: "center" as const },
    { product: rightProduct, position: "right" as const },
  ];

  return (
    <div className="px-4 pt-3">
      <motion.div
        className="flex items-center justify-center gap-2 overflow-hidden cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
      >
        {slides.map(({ product, position }) => {
          const isCenter = position === "center";
          return (
            <motion.div
              key={`${position}-${product.id}`}
              layout
              className={`rounded-2xl overflow-hidden flex-shrink-0 pointer-events-auto ${
                isCenter ? "w-[45%] h-28 shadow-lg z-10" : "w-[25%] h-24 opacity-70"
              }`}
              onClick={() => {
                if (isCenter) {
                  navigate(`/product/${product.id}`);
                } else {
                  setCurrentIndex(
                    position === "left" ? getIndex(-1) : getIndex(1)
                  );
                }
              }}
              transition={{ type: "spring", stiffness: 250, damping: 28 }}
            >
              <img
                src={
                  product.featured_image && product.featured_image.trim() !== ""
                    ? product.featured_image
                    : "/placeholder.svg"
                }
                alt={product.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
