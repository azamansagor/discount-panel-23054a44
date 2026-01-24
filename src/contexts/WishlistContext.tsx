import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'https://discountpanel.shop/api';

interface WishlistItem {
  id: number;
  type: 'product' | 'store';
  item_id: number;
  item: {
    id: number;
    name: string;
    slug?: string;
    price?: string;
    featured_image?: string;
    banner_image?: string;
    store?: {
      id: number;
      name: string;
    };
    discounts?: Array<{
      id: number;
      discount_type: string;
      amount: string;
    }>;
  };
  created_at: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  localWishlist: Set<string>; // Format: "type:item_id"
  isLoading: boolean;
  isInWishlist: (type: 'product' | 'store', itemId: number) => boolean;
  toggleWishlist: (type: 'product' | 'store', itemId: number) => Promise<void>;
  addToWishlist: (type: 'product' | 'store', itemId: number) => Promise<void>;
  removeFromWishlist: (type: 'product' | 'store', itemId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
    hasMore: boolean;
  };
  loadMore: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const getLocalWishlistKey = () => 'local_wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [localWishlist, setLocalWishlist] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    hasMore: false,
  });

  // Load local wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(getLocalWishlistKey());
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalWishlist(new Set(parsed));
      } catch {
        localStorage.removeItem(getLocalWishlistKey());
      }
    }
  }, []);

  // Save local wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(getLocalWishlistKey(), JSON.stringify([...localWishlist]));
  }, [localWishlist]);

  // Sync with server when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      syncWithServer();
    }
  }, [isAuthenticated, user?.token]);

  const getAuthHeaders = useCallback(() => {
    if (!user?.token) return {};
    return {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }, [user?.token]);

  const syncWithServer = async () => {
    if (!user?.token) return;

    // First, sync local items to server
    const localItems = [...localWishlist];
    for (const item of localItems) {
      const [type, itemId] = item.split(':');
      try {
        await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: type as 'product' | 'store',
            item_id: parseInt(itemId),
          }),
        });
      } catch (error) {
        console.error('Failed to sync item to server:', error);
      }
    }

    // Then fetch the complete server wishlist
    await fetchWishlist(1, true);
  };

  const fetchWishlist = async (page: number = 1, reset: boolean = false) => {
    if (!user?.token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/list`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page,
          per_page: 12,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const items = data.data || [];
        setWishlistItems(prev => reset ? items : [...prev, ...items]);
        
        // Update local wishlist set from server data
        const serverWishlistSet = new Set<string>();
        const allItems = reset ? items : [...wishlistItems, ...items];
        allItems.forEach((item: WishlistItem) => {
          serverWishlistSet.add(`${item.type}:${item.item_id}`);
        });
        setLocalWishlist(serverWishlistSet);

        setPagination({
          currentPage: data.pagination?.current_page || 1,
          lastPage: data.pagination?.last_page || 1,
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.has_more_pages || false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWishlist = useCallback(async () => {
    if (isAuthenticated) {
      await fetchWishlist(1, true);
    }
  }, [isAuthenticated, user?.token]);

  const loadMore = async () => {
    if (pagination.hasMore && !isLoading) {
      await fetchWishlist(pagination.currentPage + 1, false);
    }
  };

  const isInWishlist = useCallback((type: 'product' | 'store', itemId: number) => {
    return localWishlist.has(`${type}:${itemId}`);
  }, [localWishlist]);

  const toggleWishlist = async (type: 'product' | 'store', itemId: number) => {
    const key = `${type}:${itemId}`;
    const wasInWishlist = localWishlist.has(key);

    // Optimistic update
    setLocalWishlist(prev => {
      const newSet = new Set(prev);
      if (wasInWishlist) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });

    // Update local items list optimistically
    if (wasInWishlist) {
      setWishlistItems(prev => prev.filter(item => !(item.type === type && item.item_id === itemId)));
    }

    // Sync with server if authenticated
    if (isAuthenticated && user?.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ type, item_id: itemId }),
        });

        const data = await response.json();
        
        if (!data.success) {
          // Revert on failure
          setLocalWishlist(prev => {
            const newSet = new Set(prev);
            if (wasInWishlist) {
              newSet.add(key);
            } else {
              newSet.delete(key);
            }
            return newSet;
          });
        } else {
          // Refresh to get updated item data
          await fetchWishlist(1, true);
        }
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
        // Revert on error
        setLocalWishlist(prev => {
          const newSet = new Set(prev);
          if (wasInWishlist) {
            newSet.add(key);
          } else {
            newSet.delete(key);
          }
          return newSet;
        });
      }
    }
  };

  const addToWishlist = async (type: 'product' | 'store', itemId: number) => {
    if (isInWishlist(type, itemId)) return;
    await toggleWishlist(type, itemId);
  };

  const removeFromWishlist = async (type: 'product' | 'store', itemId: number) => {
    if (!isInWishlist(type, itemId)) return;
    await toggleWishlist(type, itemId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      localWishlist,
      isLoading,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      refreshWishlist,
      pagination,
      loadMore,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
