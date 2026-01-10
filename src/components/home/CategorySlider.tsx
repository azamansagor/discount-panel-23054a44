import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}

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
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Popular Categories</h2>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-secondary animate-pulse" />
              <div className="w-12 h-3 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold text-foreground mb-4">Popular Categories</h2>
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-secondary overflow-hidden"
            >
              {category.image ? (
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <span>{category.icon || "📦"}</span>
              )}
            </div>
            <span className="text-xs font-medium text-foreground text-center line-clamp-1">
              {category.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategorySlider;
