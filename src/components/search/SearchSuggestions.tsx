import { motion, AnimatePresence } from "framer-motion";
import { Search, Store, Package } from "lucide-react";

interface Suggestion {
  id: number;
  name: string;
  type: "store" | "product";
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  isVisible: boolean;
  isLoading: boolean;
  onSelect: (suggestion: Suggestion) => void;
}

export const SearchSuggestions = ({
  suggestions,
  isVisible,
  isLoading,
  onSelect,
}: SearchSuggestionsProps) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No suggestions found
          </div>
        ) : (
          <ul className="py-2 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.type}-${suggestion.id}`}>
                <button
                  type="button"
                  onClick={() => onSelect(suggestion)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {suggestion.type === "store" ? (
                      <Store className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {suggestion.type}
                    </p>
                  </div>
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchSuggestions;
