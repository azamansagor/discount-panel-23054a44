import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_ROOT = "https://discountpanel.shop/api";

interface SliderStore {
  id: number;
  name: string;
  featured_image: string;
}

const ImageSlider = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<SliderStore[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(`${API_ROOT}/stores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ per_page: 6, page: 1 }),
        });
        const data = await response.json();
        setStores(data.data || []);
      } catch (error) {
        console.error("Error fetching slider stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (stores.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stores.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stores.length]);

  if (loading) {
    return (
      <div className="px-4 pt-3">
        <div className="flex gap-2.5">
          <div className="w-[60%] h-36 bg-secondary rounded-2xl animate-pulse flex-shrink-0" />
          <div className="w-[35%] h-36 bg-secondary rounded-2xl animate-pulse flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (stores.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-2.5"
          animate={{ x: `-${currentIndex * 62.5}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          {stores.map((store) => (
            <div
              key={store.id}
              className="w-[60%] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => navigate(`/store/${store.id}`)}
            >
              <img
                src={store.featured_image || "/placeholder.svg"}
                alt={store.name}
                className="w-full h-36 object-cover rounded-2xl"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {stores.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
