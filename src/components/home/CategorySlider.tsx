import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Mock API call - replace with actual API
const fetchCategories = async (): Promise<Category[]> => {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return [
    { id: "1", name: "Electronics", icon: "💻", color: "hsl(239 84% 67%)" },
    { id: "2", name: "Fashion", icon: "👗", color: "hsl(330 81% 60%)" },
    { id: "3", name: "Food", icon: "🍔", color: "hsl(24 95% 53%)" },
    { id: "4", name: "Beauty", icon: "💄", color: "hsl(340 82% 52%)" },
    { id: "5", name: "Home", icon: "🏠", color: "hsl(142 71% 45%)" },
    { id: "6", name: "Sports", icon: "⚽", color: "hsl(217 91% 60%)" },
    { id: "7", name: "Travel", icon: "✈️", color: "hsl(198 93% 60%)" },
    { id: "8", name: "Books", icon: "📚", color: "hsl(38 92% 50%)" },
  ];
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
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
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
