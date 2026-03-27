import { useState, useEffect, useRef, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll
  useEffect(() => {
    if (products.length <= 1 || !scrollRef.current) return;
    const container = scrollRef.current;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % products.length;
      const itemWidth = container.firstElementChild?.getBoundingClientRect().width || 0;
      const gap = 12;
      container.scrollTo({
        left: currentIndex * (itemWidth + gap),
        behavior: "smooth",
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [products]);

  if (loading) {
    return (
      <div className="px-4 pt-3">
        <div className="flex gap-3 overflow-hidden">
          <div className="w-[75%] flex-shrink-0 h-36 bg-secondary rounded-2xl animate-pulse" />
          <div className="w-[75%] flex-shrink-0 h-36 bg-secondary rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="pt-3">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollBehavior: "smooth",
          paddingLeft: "calc(50% - 24% + 6px)",
          paddingRight: "calc(50% - 24% + 6px)",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[48%] flex-shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer shadow-md"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={
                product.featured_image && product.featured_image.trim() !== ""
                  ? product.featured_image
                  : "/placeholder.svg"
              }
              alt={product.name}
              className="w-full h-36 object-cover"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
