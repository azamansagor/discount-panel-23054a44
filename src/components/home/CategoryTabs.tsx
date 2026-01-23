import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

export const CategoryTabs = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category.id);
    navigate(`/category/${category.id}/${encodeURIComponent(category.name)}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl animate-pulse min-w-[100px]"
            >
              <div className="w-6 h-6 bg-muted rounded-lg" />
              <div className="w-16 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {categories.map((category, index) => {
          const isActive = activeCategory === category.id;
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-card border border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden ${
                isActive ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>
                {category.icon ? (
                  <img 
                    src={`${STORAGE_URL}/${category.icon}`} 
                    alt={category.name} 
                    className="w-full h-full object-contain p-0.5" 
                  />
                ) : (
                  <span className="text-sm">📦</span>
                )}
              </div>
              <span>{category.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
