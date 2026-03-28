import { useState, useEffect, useRef, useMemo } from "react";
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
  const currentIndexRef = useRef(0);
  const isDraggingRef = useRef(false);

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

  // Create tripled list for infinite illusion
  const infiniteItems = useMemo(() => {
    if (products.length === 0) return [];
    return [...products, ...products, ...products];
  }, [products]);

  const getItemOffset = (index: number) => {
    const itemWidth = window.innerWidth * 0.48;
    const gap = 12;
    return index * (itemWidth + gap);
  };

  // Set initial scroll to the middle set on mount
  useEffect(() => {
    if (products.length === 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    const startIndex = products.length; // start of middle copy
    currentIndexRef.current = startIndex;
    // Instant scroll (no smooth) to middle set
    requestAnimationFrame(() => {
      container.scrollLeft = getItemOffset(startIndex);
    });
  }, [products]);

  // Auto-scroll with infinite loop
  useEffect(() => {
    if (products.length <= 1 || !scrollRef.current) return;
    const container = scrollRef.current;
    const len = products.length;

    const interval = setInterval(() => {
      currentIndexRef.current += 1;
      const idx = currentIndexRef.current;

      container.scrollTo({
        left: getItemOffset(idx),
        behavior: "smooth",
      });

      // After smooth scroll, if we've gone past the middle set, reset silently
      setTimeout(() => {
        if (currentIndexRef.current >= len * 2) {
          currentIndexRef.current = len;
          container.scrollLeft = getItemOffset(len);
        }
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, [products]);

  // On manual scroll end, normalize position back to middle set
  useEffect(() => {
    if (products.length === 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    const len = products.length;
    let scrollTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const itemWidth = window.innerWidth * 0.48;
        const gap = 12;
        const currentScroll = container.scrollLeft;
        const nearestIndex = Math.round(currentScroll / (itemWidth + gap));
        currentIndexRef.current = nearestIndex;

        // If in first or third copy, jump to equivalent in middle copy
        if (nearestIndex < len) {
          const newIndex = nearestIndex + len;
          currentIndexRef.current = newIndex;
          container.scrollLeft = getItemOffset(newIndex);
        } else if (nearestIndex >= len * 2) {
          const newIndex = nearestIndex - len;
          currentIndexRef.current = newIndex;
          container.scrollLeft = getItemOffset(newIndex);
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
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
          paddingLeft: "26%",
          paddingRight: "26%",
        }}
      >
        {infiniteItems.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            className="flex-shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer shadow-md"
            style={{ width: "48vw" }}
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
