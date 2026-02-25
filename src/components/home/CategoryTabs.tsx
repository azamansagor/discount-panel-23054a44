import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  icon: string;
}

import { API_BASE_URL as API_ROOT, STORAGE_URL } from "@/lib/api";

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_ROOT}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ per_page: 10, page: 1 }),
  });

  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return data.data || data;
};

export const CategoryTabs = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const handleCategoryClick = (category: Category) => {
    navigate(`/category/${category.id}/${encodeURIComponent(category.name)}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <h3 className="text-base font-bold text-foreground italic mb-4">Categories</h3>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-secondary rounded-full animate-pulse" />
              <div className="w-12 h-3 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h3 className="text-base font-bold text-foreground italic mb-4">Categories</h3>
      <div className="flex gap-5 overflow-x-auto scrollbar-hide">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCategoryClick(category)}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {category.icon ? (
                <img
                  src={`${STORAGE_URL}/${category.icon}`}
                  alt={category.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <span className="text-xs font-medium text-foreground whitespace-nowrap">
              {category.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
