import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Heart, MapPin, Tag, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import TabBar from "@/components/layout/TabBar";
import { Skeleton } from "@/components/ui/skeleton";
import RemoveWishlistDrawer from "@/components/wishlist/RemoveWishlistDrawer";

const API_BASE_URL = 'https://discountpanel.shop/api';

interface ProductData {
  id: number;
  name: string;
  slug?: string;
  price?: string;
  featured_image?: string;
  banner_image?: string;
  address?: string;
  store?: {
    id: number;
    name: string;
  };
  discounts?: Array<{
    id: number;
    discount_type: string;
    amount: string;
  }>;
}

const Wishlist = () => {
  const navigate = useNavigate();
  const { isLoading, refreshWishlist, loadMore, pagination, toggleWishlist, getAllDisplayItems, localWishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [fetchedItems, setFetchedItems] = useState<Map<string, ProductData>>(new Map());
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  
  // Remove confirmation drawer state
  const [removeDrawerOpen, setRemoveDrawerOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ type: 'product' | 'store'; id: number; data: ProductData | null } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated]);

  // Fetch missing product/store data for local wishlist items
  useEffect(() => {
    const fetchMissingData = async () => {
      const displayItems = getAllDisplayItems();
      
      for (const item of displayItems) {
        const key = `${item.type}:${item.item_id}`;
        
        // Skip if we already have data or are fetching
        if (item.item || fetchedItems.has(key) || fetchingIds.has(key)) {
          continue;
        }

        setFetchingIds(prev => new Set(prev).add(key));

        try {
          if (item.type === 'product') {
            const response = await fetch(`${API_BASE_URL}/products/${item.item_id}`);
            const data = await response.json();
            if (data.success && data.data) {
              setFetchedItems(prev => new Map(prev).set(key, data.data));
            }
          } else {
            const response = await fetch(`${API_BASE_URL}/stores/${item.item_id}`);
            const data = await response.json();
            if (data.success && data.data) {
              setFetchedItems(prev => new Map(prev).set(key, data.data));
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${item.type} ${item.item_id}:`, error);
        } finally {
          setFetchingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }
      }
    };

    fetchMissingData();
  }, [getAllDisplayItems, localWishlistItems]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && pagination.hasMore && !isLoading && isAuthenticated) {
      loadMore();
    }
  };

  const getDiscount = (item?: ProductData) => {
    if (item?.discounts && item.discounts.length > 0) {
      const discount = item.discounts[0];
      return discount.discount_type === 'percentage' 
        ? `${parseFloat(discount.amount)}%` 
        : `৳${discount.amount}`;
    }
    return null;
  };

  const handleRemoveClick = (e: React.MouseEvent, type: 'product' | 'store', itemId: number, itemData: ProductData | null) => {
    e.stopPropagation();
    setItemToRemove({ type, id: itemId, data: itemData });
    setRemoveDrawerOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    
    setIsRemoving(true);
    await toggleWishlist(itemToRemove.type, itemToRemove.id);
    setIsRemoving(false);
    setRemoveDrawerOpen(false);
    setItemToRemove(null);
  };

  const handleCloseDrawer = () => {
    if (!isRemoving) {
      setRemoveDrawerOpen(false);
      setItemToRemove(null);
    }
  };

  const displayItems = getAllDisplayItems();

  // Get item data - either from the item itself, or from fetched cache
  const getItemData = (item: { type: 'product' | 'store'; item_id: number; item?: ProductData }) => {
    if (item.item) return item.item;
    const key = `${item.type}:${item.item_id}`;
    return fetchedItems.get(key);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-semibold text-foreground">Wishlist</h1>
          </div>
          {!isAuthenticated && displayItems.length > 0 && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Login to sync
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full h-12 pl-4 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {["Sort by", "Filters", "Discount", "Category"].map((filter) => (
            <button
              key={filter}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded-full text-sm font-medium text-foreground whitespace-nowrap hover:bg-muted transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div 
        className="px-4 pt-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        onScroll={handleScroll}
      >
        {isLoading && displayItems.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding products you love</p>
            <button
              onClick={() => navigate("/home")}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Explore Products
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayItems.map((wishlistItem, index) => {
              const itemData = getItemData(wishlistItem);
              const discount = getDiscount(itemData);
              const isProduct = wishlistItem.type === 'product';
              const imageUrl = isProduct ? itemData?.featured_image : itemData?.banner_image;
              const isFetching = fetchingIds.has(`${wishlistItem.type}:${wishlistItem.item_id}`);

              return (
                <motion.div
                  key={`${wishlistItem.type}-${wishlistItem.item_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => itemData && navigate(isProduct ? `/product/${wishlistItem.item_id}` : `/store/${wishlistItem.item_id}`)}
                  className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {isFetching ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={itemData?.name || "Item"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Discount Badge */}
                    {discount && (
                      <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {discount} OFF
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => handleRemoveClick(e, wishlistItem.type, wishlistItem.item_id, itemData || null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {isFetching ? (
                      <>
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                          {itemData?.name || "Loading..."}
                        </h3>
                        
                        {isProduct && itemData?.store && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{itemData.store.name}</span>
                          </div>
                        )}

                        {isProduct && itemData?.price && (
                          <div className="flex items-center gap-1 text-primary font-bold text-sm">
                            ৳{parseFloat(itemData.price).toLocaleString()}
                          </div>
                        )}

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (itemData) {
                              navigate(isProduct ? `/product/${wishlistItem.item_id}` : `/store/${wishlistItem.item_id}`);
                            }
                          }}
                          className="w-full mt-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          View {isProduct ? "Product" : "Store"}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && displayItems.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Remove Confirmation Drawer */}
      <RemoveWishlistDrawer
        isOpen={removeDrawerOpen}
        onClose={handleCloseDrawer}
        onConfirm={handleConfirmRemove}
        item={itemToRemove?.data || null}
        type={itemToRemove?.type || 'product'}
        isLoading={isRemoving}
      />

      <TabBar />
    </div>
  );
};

export default Wishlist;
