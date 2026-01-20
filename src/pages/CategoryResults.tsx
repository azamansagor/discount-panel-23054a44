import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import TabBar from "@/components/layout/TabBar";

const API_ROOT = "https://discountpanel.shop/api";
const STORAGE_URL = "https://discountpanel.shop/storage";

interface ResultItem {
  id: number;
  name: string;
  image: string | null;
  category: string;
  type: "store" | "product";
}

interface ApiResponse {
  data: any[];
  current_page: number;
  last_page: number;
  total: number;
}

type FilterType = "all" | "store" | "product";

const CategoryResults = () => {
  const { categoryId, categoryName } = useParams();
  const navigate = useNavigate();
  
  const [items, setItems] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
      
      const mappedItems: ResultItem[] = (data.data || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.title,
        image: item.featured_image || item.banner_image || item.image || null,
        category: item.categories?.[0]?.name || item.category || "Uncategorized",
        type: item.featured_image ? "product" : "store",
      }));

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

  // Initial fetch and filter change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchItems(1, filter, true);
  }, [filter, fetchItems]);

  // Infinite scroll observer
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

  const toggleWishlist = (itemId: number, type: string) => {
    const key = `${type}-${itemId}`;
    setWishlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Stores", value: "store" },
    { label: "Products", value: "product" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground truncate">
            {categoryName ? decodeURIComponent(categoryName) : "Category"}
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="rounded-full"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-secondary animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-secondary rounded animate-pulse" />
                  <div className="h-8 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border"
              >
                {/* Image with Wishlist Button */}
                <div className="relative aspect-square">
                  <img
                    src={item.image ? `${STORAGE_URL}/${item.image}` : "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id, item.type);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        wishlist.has(`${item.type}-${item.id}`)
                          ? "fill-destructive text-destructive"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.category}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    View {item.type === "store" ? "Store" : "Product"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
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
    </div>
  );
};

export default CategoryResults;
