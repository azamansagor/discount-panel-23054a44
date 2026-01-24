import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'https://discountpanel.shop/api';

interface WishlistItemData {
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
}

interface WishlistItem {
  id: number;
  type: 'product' | 'store';
  item_id: number;
  item: WishlistItemData;
  created_at: string;
}

interface LocalWishlistEntry {
  type: 'product' | 'store';
  item_id: number;
  item?: WishlistItemData;
  added_at: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  localWishlistItems: LocalWishlistEntry[];
  isLoading: boolean;
  isInWishlist: (type: 'product' | 'store', itemId: number) => boolean;
  toggleWishlist: (type: 'product' | 'store', itemId: number, itemData?: WishlistItemData) => Promise<void>;
  addToWishlist: (type: 'product' | 'store', itemId: number, itemData?: WishlistItemData) => Promise<void>;
  removeFromWishlist: (type: 'product' | 'store', itemId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
    hasMore: boolean;
  };
  loadMore: () => Promise<void>;
  getAllDisplayItems: () => Array<{ type: 'product' | 'store'; item_id: number; item?: WishlistItemData }>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_WISHLIST_KEY = 'local_wishlist_items';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [localWishlistItems, setLocalWishlistItems] = useState<LocalWishlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    hasMore: false,
  });

  // Load local wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_WISHLIST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalWishlistItems(parsed);
      } catch {
        localStorage.removeItem(LOCAL_WISHLIST_KEY);
      }
    }
  }, []);

  // Save local wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(localWishlistItems));
  }, [localWishlistItems]);

  // Sync with server when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.token && !hasSynced) {
      syncWithServer();
      setHasSynced(true);
    }
    if (!isAuthenticated) {
      setHasSynced(false);
      setWishlistItems([]);
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

    setIsLoading(true);

    // First, sync all local items to server
    const localItems = [...localWishlistItems];
    for (const entry of localItems) {
      try {
        // Use add endpoint to ensure item is in server wishlist
        await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: entry.type,
            item_id: entry.item_id,
          }),
        });
      } catch (error) {
        console.error('Failed to sync item to server:', error);
      }
    }

    // Then fetch the complete server wishlist
    await fetchWishlist(1, true);

    // Clear local items after successful sync (they're now on server)
    if (localItems.length > 0) {
      setLocalWishlistItems([]);
    }

    setIsLoading(false);
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
        const items = Array.isArray(data.data) ? data.data : [];
        setWishlistItems(prev => reset ? items : [...(Array.isArray(prev) ? prev : []), ...items]);

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
    // Check server wishlist first if authenticated
    if (isAuthenticated) {
      const items = Array.isArray(wishlistItems) ? wishlistItems : [];
      return items.some(item => item.type === type && item.item_id === itemId);
    }
    // Check local wishlist for guests
    const localItems = Array.isArray(localWishlistItems) ? localWishlistItems : [];
    return localItems.some(item => item.type === type && item.item_id === itemId);
  }, [wishlistItems, localWishlistItems, isAuthenticated]);

  const toggleWishlist = async (type: 'product' | 'store', itemId: number, itemData?: WishlistItemData) => {
    const wasInWishlist = isInWishlist(type, itemId);

    if (isAuthenticated && user?.token) {
      // Optimistic update for server wishlist
      if (wasInWishlist) {
        setWishlistItems(prev => {
          const items = Array.isArray(prev) ? prev : [];
          return items.filter(item => !(item.type === type && item.item_id === itemId));
        });
      }

      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ type, item_id: itemId }),
        });

        const data = await response.json();

        if (data.success) {
          // Refresh to get updated data
          await fetchWishlist(1, true);
        } else {
          // Revert on failure - refetch
          await fetchWishlist(1, true);
        }
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
        await fetchWishlist(1, true);
      }
    } else {
      // Handle local wishlist for guests
      if (wasInWishlist) {
        setLocalWishlistItems(prev => 
          prev.filter(item => !(item.type === type && item.item_id === itemId))
        );
      } else {
        const newEntry: LocalWishlistEntry = {
          type,
          item_id: itemId,
          item: itemData,
          added_at: new Date().toISOString(),
        };
        setLocalWishlistItems(prev => [...prev, newEntry]);
      }
    }
  };

  const addToWishlist = async (type: 'product' | 'store', itemId: number, itemData?: WishlistItemData) => {
    if (isInWishlist(type, itemId)) return;
    await toggleWishlist(type, itemId, itemData);
  };

  const removeFromWishlist = async (type: 'product' | 'store', itemId: number) => {
    if (!isInWishlist(type, itemId)) return;
    await toggleWishlist(type, itemId);
  };

  // Get all items to display - server items when authenticated, local items when not
  const getAllDisplayItems = useCallback(() => {
    if (isAuthenticated) {
      const items = Array.isArray(wishlistItems) ? wishlistItems : [];
      return items.map(item => ({
        type: item.type,
        item_id: item.item_id,
        item: item.item,
      }));
    }
    const localItems = Array.isArray(localWishlistItems) ? localWishlistItems : [];
    return localItems.map(entry => ({
      type: entry.type,
      item_id: entry.item_id,
      item: entry.item,
    }));
  }, [isAuthenticated, wishlistItems, localWishlistItems]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      localWishlistItems,
      isLoading,
      isInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      refreshWishlist,
      pagination,
      loadMore,
      getAllDisplayItems,
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
