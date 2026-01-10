import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const STORAGE_URL = "https://discountpanel.shop/storage";

const API_ROOT = "https://discountpanel.shop/api";

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_ROOT}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      per_page: 10,
      page: 1,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await response.json();
  return data.data || data;
};

export const CategorySlider = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-4">
        <h2 className="text-lg font-bold text-foreground mb-4 px-4">Popular Categories</h2>
        <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-secondary animate-pulse" />
              <div className="w-14 h-3 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-foreground mb-4 px-4">Popular Categories</h2>
      <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm bg-secondary overflow-hidden p-3"
            >
              {category.icon ? (
                <img 
                  src={`${STORAGE_URL}/${category.icon}`} 
                  alt={category.name} 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <span className="text-xs font-medium text-foreground text-center line-clamp-1 w-16">
              {category.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategorySlider;
