import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Search as SearchIcon, MapPin, SlidersHorizontal, X, Store, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TabBar from "@/components/layout/TabBar";
import { useWishlist } from "@/contexts/WishlistContext";
import { useDebounce } from "@/hooks/useDebounce";
import SearchFilters from "@/components/search/SearchFilters";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

interface SearchResult {
  id: number;
  name: string;
  slug?: string;
  type: "store" | "product";
  featured_image?: string;
  banner_image?: string;
  price?: string;
  location_name?: string;
  store?: { id: number; name: string; slug: string };
  isOpen?: boolean;
  distance?: number;
}

interface SearchFiltersState {
  type: "all" | "stores" | "products";
  priceRange: "all" | "0-50" | "50-100" | "100+";
  rating: "all" | "3" | "4" | "5";
}

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersState>({
    type: "all",
    priceRange: "all",
    rating: "all",
  });
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 400);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search input or open filters on mount based on query params
  useEffect(() => {
    const shouldOpenFilters = searchParams.get("openFilters") === "true";
    
    if (shouldOpenFilters) {
      // Open filters sheet
      setShowFilters(true);
    } else {
      // Focus search input
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      setShowSuggestions(true);

      try {
        const response = await fetch(`${API_ROOT}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: debouncedQuery,
            per_page: 5,
            page: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const combined: SearchResult[] = [
            ...(data.stores || []).map((s: any) => ({ ...s, type: "store" as const })),
            ...(data.products || []).map((p: any) => ({ ...p, type: "product" as const })),
          ].slice(0, 5);
          setSuggestions(combined);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchResults = useCallback(async (pageNum: number, reset = false, overrideFilters?: SearchFiltersState) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    // Use override filters if provided, otherwise use current state
    const activeFilters = overrideFilters || filters;

    try {
      const response = await fetch(`${API_ROOT}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          type: activeFilters.type,
          price_range: activeFilters.priceRange,
          rating: activeFilters.rating,
          per_page: 10,
          page: pageNum,
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      
      const combined: SearchResult[] = [
        ...(data.stores || []).map((s: any) => ({ ...s, type: "store" as const })),
        ...(data.products || []).map((p: any) => ({ ...p, type: "product" as const })),
      ];

      if (reset) {
        setResults(combined);
      } else {
        setResults(prev => [...prev, ...combined]);
      }

      setHasMore(data.current_page < data.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, filters]);

  // Remove the automatic filter-triggered search - now only on Apply button

  // Handle search submit
  const handleSearch = () => {
    if (searchQuery.length > 0) {
      setPage(1);
      setHasMore(true);
      fetchResults(1, true);
      setShowSuggestions(false);
    }
  };

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && results.length > 0) {
          fetchResults(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, fetchResults, results.length]);

  const handleWishlistToggle = (item: SearchResult) => {
    const type = item.type;
    const inWishlist = isInWishlist(type, item.id);
    
    if (inWishlist) {
      setItemToRemove(item);
      setRemoveDrawerOpen(true);
    } else {
      const image = type === "product" ? item.featured_image : item.banner_image;
      toggleWishlist(type, item.id, {
        id: item.id,
        name: item.name,
        price: item.price,
        featured_image: image,
        banner_image: image,
      });
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      const type = itemToRemove.type;
      const image = type === "product" ? itemToRemove.featured_image : itemToRemove.banner_image;
      toggleWishlist(type, itemToRemove.id, {
        id: itemToRemove.id,
        name: itemToRemove.name,
        price: itemToRemove.price,
        featured_image: image,
        banner_image: image,
      });
    }
    setRemoveDrawerOpen(false);
    setItemToRemove(null);
  };

  const handleSuggestionSelect = (item: SearchResult) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    // Navigate directly to item
    if (item.type === "store") {
      navigate(`/store/${item.id}`);
    } else {
      navigate(`/product/${item.id}`);
    }
  };

  const getImageUrl = (item: SearchResult) => {
    const img = item.type === "product" ? item.featured_image : item.banner_image;
    if (!img) return "/placeholder.svg";
    if (img.startsWith("http")) return img;
    return `${STORAGE_URL}/${img}`;
  };

  const activeFiltersCount = [
    filters.type !== "all",
    filters.priceRange !== "all",
    filters.rating !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 -ml-2 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Search</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4" ref={searchContainerRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search products & stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => {
                  if (searchQuery.length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-secondary/50 border-0 text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    {loadingSuggestions ? (
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
                        {suggestions.map((item) => (
                          <li key={`${item.type}-${item.id}`}>
                            <button
                              type="button"
                              onClick={() => handleSuggestionSelect(item)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                {item.type === "store" ? (
                                  <Store className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(true)}
              className="h-12 w-12 rounded-xl shrink-0 relative"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {filters.type !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                {filters.type === "stores" ? "Stores" : "Products"}
                <button onClick={() => setFilters(f => ({ ...f, type: "all" }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.priceRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                ${filters.priceRange}
                <button onClick={() => setFilters(f => ({ ...f, priceRange: "all" }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.rating !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                {filters.rating}+ Stars
                <button onClick={() => setFilters(f => ({ ...f, rating: "all" }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
                <div className="aspect-[16/10] bg-secondary animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 && searchQuery.length > 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or filters</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Start searching</p>
            <p className="text-sm text-muted-foreground mt-1">Find products and stores near you</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {results.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: Math.min(index * 0.05, 0.2) }}
                className="bg-card rounded-2xl overflow-hidden shadow-md cursor-pointer"
                onClick={() => {
                  if (item.type === "store") {
                    navigate(`/store/${item.id}`);
                  } else {
                    navigate(`/product/${item.id}`);
                  }
                }}
              >
                {/* Image Section */}
                <div className="relative aspect-[16/10]">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />

                  {/* Type Badge */}
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium capitalize">
                    {item.type}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(item);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isInWishlist(item.type, item.id)
                          ? "fill-destructive text-destructive"
                          : "text-white"
                      }`}
                    />
                  </button>

                  {/* Open Status for Stores */}
                  {item.type === "store" && item.isOpen !== undefined && (
                    <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium ${
                      item.isOpen ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                    }`}>
                      {item.isOpen ? "Open Now" : "Closed"}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-lg line-clamp-1 mb-1">
                    {item.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    {item.location_name && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{item.location_name}</span>
                      </div>
                    )}
                    {item.store && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Store className="h-4 w-4" />
                        <span className="line-clamp-1">{item.store.name}</span>
                      </div>
                    )}
                    {item.price && (
                      <span className="text-accent font-bold text-lg">
                        ${parseFloat(item.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-10 mt-4">
          {loadingMore && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      <TabBar />

      {/* Filter Sheet */}
      <SearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          if (searchQuery.length > 0) {
            setPage(1);
            setHasMore(true);
            // Pass new filters directly to avoid stale state
            fetchResults(1, true, newFilters);
          }
        }}
      />

      {/* Remove Wishlist Confirmation Drawer */}
      <RemoveWishlistDrawer
        isOpen={removeDrawerOpen}
        onClose={() => {
          setRemoveDrawerOpen(false);
          setItemToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        item={itemToRemove ? {
          id: itemToRemove.id,
          name: itemToRemove.name,
          price: itemToRemove.price,
          featured_image: itemToRemove.featured_image,
          banner_image: itemToRemove.banner_image,
          address: itemToRemove.location_name,
        } : null}
        type={itemToRemove?.type || 'product'}
      />
    </div>
  );
};

export default Search;
