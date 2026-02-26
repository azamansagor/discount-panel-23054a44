import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Package, Loader2, Pencil, Trash2 } from "lucide-react";
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

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  featured_image: string;
  short_description: string;
  discounts: Array<{ discount_type: string; discount_amount?: number; amount?: string }>;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/store/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          store_id: Number(storeId),
          per_page: 50,
          page: 1,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setProducts(Array.isArray(data.data) ? data.data : data.data.data || []);
      } else if (data.products) {
        setProducts(data.products);
      }
    } catch {
      console.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/products/${deleteProductId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Product deleted successfully" });
        setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
      } else {
        toast({ title: data.message || "Failed to delete product", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  };

  const getDiscountedPrice = (product: Product) => {
    if (!product.discounts?.length) return null;
    const d = product.discounts[0];
    const price = Number(product.price);
    const amount = Number(d.discount_amount || d.amount);
    if (d.discount_type === "percentage") return price * (1 - amount / 100);
    return price - amount;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/my-stores")} className="p-2 bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">My Products</h1>
          </div>
          <button
            onClick={() => navigate(`/my-stores/${storeId}/products/create`)}
            className="p-2 bg-primary rounded-full"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </motion.header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">No products yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first product to your store</p>
            <button
              onClick={() => navigate(`/my-stores/${storeId}/products/create`)}
              className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => {
              const discounted = getDiscountedPrice(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {product.featured_image ? (
                      <img src={product.featured_image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {discounted != null ? (
                        <>
                          <span className="text-sm font-bold text-primary">${Number(discounted).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-foreground">${Number(product.price).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/my-stores/${storeId}/products/${product.id}/edit`)}
                      className="p-2 rounded-full hover:bg-secondary transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteProductId(product.id)}
                      className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => { if (!open) setDeleteProductId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
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

export default MyProducts;
