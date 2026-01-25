import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Search, MapPin, Clock, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import TabBar from "@/components/layout/TabBar";
import { useWishlist } from "@/contexts/WishlistContext";
import { useDebounce } from "@/hooks/useDebounce";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

interface ResultItem {
  id: number;
  name: string;
  images: string[];
  category: string;
  type: "store" | "product";
  location?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  tags?: string[];
  distance?: string;
  deliveryTime?: string;
}

interface ApiResponse {
  items: any[];
  current_page: number;
  last_page: number;
  total: number;
}

type FilterType = "all" | "store" | "product";

const CategoryResults = () => {
  const { categoryId, categoryName } = useParams();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [items, setItems] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; type: "store" | "product" }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<ResultItem | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      setShowSuggestions(true);

      try {
        const response = await fetch(`${API_ROOT}/categories/get_products_stores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_id: Number(categoryId),
            type: filter,
            per_page: 5,
            page: 1,
            search: debouncedSearchQuery,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const mappedSuggestions = (data.items || []).map((item: any) => ({
            id: item.id,
            name: item.name || item.title,
            type: item.type || "product",
          }));
          setSuggestions(mappedSuggestions);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery, categoryId, filter]);

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

  const handleSuggestionSelect = (suggestion: { id: number; name: string; type: "store" | "product" }) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
  };

  const fetchItems = useCallback(async (pageNum: number, filterType: FilterType, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(`${API_ROOT}/categories/get_products_stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: Number(categoryId),
          type: filterType,
          per_page: 10,
          page: pageNum,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const data: ApiResponse = await response.json();
      
      const mappedItems: ResultItem[] = (data.items || []).map((item: any) => {
        // Extract all images
        const images: string[] = [];
        if (item.featured_image) images.push(item.featured_image);
        if (item.banner_image && item.banner_image !== item.featured_image) images.push(item.banner_image);
        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img: any) => {
            const imgPath = typeof img === 'string' ? img : img.path || img.image;
            if (imgPath && !images.includes(imgPath)) images.push(imgPath);
          });
        }
        if (images.length === 0) images.push('');

        // Calculate price and discount
        const price = parseFloat(item.price) || 0;
        const discountAmount = item.discounts?.[0]?.amount ? parseFloat(item.discounts[0].amount) : 0;

        // Extract tags/features
        const tags: string[] = [];
        if (item.categories && Array.isArray(item.categories)) {
          item.categories.slice(0, 3).forEach((cat: any) => {
            if (cat.name) tags.push(cat.name);
          });
        }

        return {
          id: item.id,
          name: item.name || item.title,
          images,
          category: item.categories?.[0]?.name || item.category || "Uncategorized",
          type: item.type || (item.featured_image ? "product" : "store"),
          location: item.location || item.address || "Location not specified",
          price,
          discount: discountAmount > 0 ? Math.round(discountAmount) : undefined,
          tags,
          distance: item.distance || "4.4 km",
          deliveryTime: item.delivery_time || "25-30 mins",
        };
      });

      if (reset) {
        setItems(mappedItems);
      } else {
        setItems(prev => [...prev, ...mappedItems]);
      }

      setHasMore(data.current_page < data.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchItems(1, filter, true);
  }, [filter, fetchItems]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchItems(page + 1, filter);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, page, filter, fetchItems]);

  const handleWishlistToggle = (item: ResultItem) => {
    const type = item.type as 'product' | 'store';
    const inWishlist = isInWishlist(type, item.id);
    
    if (inWishlist) {
      setItemToRemove(item);
      setRemoveDrawerOpen(true);
    } else {
      toggleWishlist(type, item.id, {
        id: item.id,
        name: item.name,
        price: item.price ? String(item.price) : undefined,
        featured_image: item.images[0] ? `${STORAGE_URL}/${item.images[0]}` : undefined,
        banner_image: item.images[0] ? `${STORAGE_URL}/${item.images[0]}` : undefined,
        discounts: item.discount ? [{ id: 0, discount_type: 'percentage', amount: String(item.discount) }] : undefined,
      });
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      const type = itemToRemove.type as 'product' | 'store';
      toggleWishlist(type, itemToRemove.id, {
        id: itemToRemove.id,
        name: itemToRemove.name,
        price: itemToRemove.price ? String(itemToRemove.price) : undefined,
        featured_image: itemToRemove.images[0] ? `${STORAGE_URL}/${itemToRemove.images[0]}` : undefined,
        banner_image: itemToRemove.images[0] ? `${STORAGE_URL}/${itemToRemove.images[0]}` : undefined,
        discounts: itemToRemove.discount ? [{ id: 0, discount_type: 'percentage', amount: String(itemToRemove.discount) }] : undefined,
      });
    }
    setRemoveDrawerOpen(false);
    setItemToRemove(null);
  };

  const filteredItems = items.filter(item => 
    searchQuery === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/home");
              }
            }}
            className="shrink-0 -ml-2 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {categoryName ? decodeURIComponent(categoryName) : "Search"}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4" ref={searchContainerRef}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full h-12 pl-4 pr-12 rounded-xl bg-secondary/50 border-0 text-foreground placeholder:text-muted-foreground"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            
            <SearchSuggestions
              suggestions={suggestions}
              isVisible={showSuggestions}
              isLoading={loadingSuggestions}
              onSelect={handleSuggestionSelect}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-3">
        {(["all", "product", "store"] as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              filter === filterType
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
                <div className="aspect-[16/10] bg-secondary animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-secondary rounded animate-pulse w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No items found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const itemKey = `${item.type}-${item.id}`;
              const inWishlist = isInWishlist(item.type as 'product' | 'store', item.id);
              
              return (
                <motion.div
                  key={itemKey}
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
                      src={item.images[0] ? `${STORAGE_URL}/${item.images[0]}` : "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />

                    {/* Curved bottom overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-card" style={{ borderRadius: '24px 24px 0 0' }} />

                    {/* Discount Badge */}
                    {item.discount && item.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                        {item.discount}% OFF
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistToggle(item);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          inWishlist
                            ? "fill-destructive text-destructive"
                            : "text-white"
                        }`}
                      />
                    </button>

                    {/* Time & Distance Info */}
                    <div className="absolute bottom-8 left-3 flex items-center gap-1.5 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span>{item.deliveryTime}</span>
                      <span>·</span>
                      <span>{item.distance}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="font-bold text-foreground text-lg line-clamp-1 mb-2">
                      {item.name}
                    </h3>

                    {/* Location & Price Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                      {item.price !== undefined && item.price > 0 && (
                        <span className="text-primary font-bold text-lg">
                          ${item.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium text-muted-foreground"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{tag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
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
          price: itemToRemove.price ? String(itemToRemove.price) : undefined,
          featured_image: itemToRemove.images[0] ? `${STORAGE_URL}/${itemToRemove.images[0]}` : undefined,
          banner_image: itemToRemove.images[0] ? `${STORAGE_URL}/${itemToRemove.images[0]}` : undefined,
          address: itemToRemove.location,
        } : null}
        type={itemToRemove?.type || 'product'}
      />
    </div>
  );
};

export default CategoryResults;
