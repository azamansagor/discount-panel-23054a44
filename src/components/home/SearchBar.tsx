import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const filters = ["All", "Nearby", "Popular", "New", "Trending"];

export const SearchBar = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="px-4 pt-2 pb-4">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search deals, stores, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 bg-secondary rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary rounded-xl">
          <SlidersHorizontal className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
        {filters.map((filter) => (
          <motion.button
            key={filter}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter
                ? "gradient-primary text-primary-foreground shadow-card"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
