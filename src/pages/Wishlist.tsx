import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Heart, MapPin, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import TabBar from "@/components/layout/TabBar";
import { Skeleton } from "@/components/ui/skeleton";

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, isLoading, refreshWishlist, loadMore, pagination, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && pagination.hasMore && !isLoading) {
      loadMore();
    }
  };

  const getDiscount = (item: typeof wishlistItems[0]) => {
    if (item.item?.discounts && item.item.discounts.length > 0) {
      const discount = item.item.discounts[0];
      return discount.discount_type === 'percentage' 
        ? `${parseFloat(discount.amount)}%` 
        : `৳${discount.amount}`;
    }
    return null;
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, type: 'product' | 'store', itemId: number) => {
    e.stopPropagation();
    await toggleWishlist(type, itemId);
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
        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Login to see your wishlist</h2>
            <p className="text-muted-foreground mb-6">Save your favorite products and stores</p>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Login
            </button>
          </motion.div>
        ) : isLoading && wishlistItems.length === 0 ? (
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
        ) : wishlistItems.length === 0 ? (
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
            {wishlistItems.map((wishlistItem, index) => {
              const discount = getDiscount(wishlistItem);
              const item = wishlistItem.item;
              const isProduct = wishlistItem.type === 'product';
              const imageUrl = isProduct ? item?.featured_image : item?.banner_image;

              return (
                <motion.div
                  key={wishlistItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(isProduct ? `/product/${item?.id}` : `/store/${item?.id}`)}
                  className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={item?.name || "Item"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Discount Badge */}
                    {discount && (
                      <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {discount} OFF
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => handleRemoveFromWishlist(e, wishlistItem.type, wishlistItem.item_id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                      {item?.name || "Unknown Item"}
                    </h3>
                    
                    {isProduct && item?.store && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{item.store.name}</span>
                      </div>
                    )}

                    {isProduct && item?.price && (
                      <div className="flex items-center gap-1 text-primary font-bold text-sm">
                        ৳{parseFloat(item.price).toLocaleString()}
                      </div>
                    )}

                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(isProduct ? `/product/${item?.id}` : `/store/${item?.id}`);
                      }}
                      className="w-full mt-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      View {isProduct ? "Product" : "Store"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && wishlistItems.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default Wishlist;
