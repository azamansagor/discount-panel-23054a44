import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Filter Button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 text-foreground" />
        </motion.button>
      </div>
    </div>
  );
};

export default SearchBar;
