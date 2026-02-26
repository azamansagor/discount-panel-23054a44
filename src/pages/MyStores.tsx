import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Store, MapPin, Loader2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TabBar from "@/components/layout/TabBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { API_BASE_URL } from "@/lib/api";

interface StoreItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  banner_image: string;
  location_name: string;
  created_at: string;
}

const MyStores = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteStoreId, setDeleteStoreId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchStores(1);
  }, [isAuthenticated]);

  const fetchStores = async (pageNum: number) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/stores?page=${pageNum}&per_page=15`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      let newStores: StoreItem[] = [];
      if (data.success && data.data) {
        const d = data.data;
        newStores = Array.isArray(d) ? d : d.data || [];
        const lastPage = d.last_page || d.meta?.last_page;
        if (lastPage) setHasMore(pageNum < lastPage);
        else setHasMore(newStores.length >= 15);
      } else if (data.stores) {
        newStores = data.stores;
        setHasMore(false);
      }
      setStores((prev) => (pageNum === 1 ? newStores : [...prev, ...newStores]));
      setPage(pageNum);
    } catch {
      console.error("Failed to fetch stores");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchStores(page + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore, page]
  );

  const handleDelete = async () => {
    if (!deleteStoreId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/stores/${deleteStoreId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Store deleted successfully" });
        setStores((prev) => prev.filter((s) => s.id !== deleteStoreId));
      } else {
        toast({ title: data.message || "Failed to delete store", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteStoreId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">My Stores</h1>
          </div>
          <button onClick={() => navigate("/my-stores/create")} className="p-2 bg-primary rounded-full">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </motion.header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">No stores yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first store to start selling</p>
            <button onClick={() => navigate("/my-stores/create")} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
              Create Store
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50"
              >
                <button
                  onClick={() => navigate(`/my-stores/${store.id}/products`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {store.banner_image ? (
                    <img src={store.banner_image} alt={store.name} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{store.name}</p>
                    {store.location_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {store.location_name}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/my-stores/${store.id}/edit`)}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setDeleteStoreId(store.id)}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
            <div ref={lastElementRef} className="h-1" />
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteStoreId !== null} onOpenChange={(open) => { if (!open) setDeleteStoreId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this store? This action cannot be undone and all associated products will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TabBar />
    </div>
  );
};

export default MyStores;
