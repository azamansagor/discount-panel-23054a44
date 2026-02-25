import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TabBar from "@/components/layout/TabBar";

const API_BASE_URL = "https://discountpanel.shop/api";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  featured_image: string;
  short_description: string;
  discounts: Array<{ discount_type: string; discount_amount: number }>;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await fetch(`${API_BASE_URL}/user/products?per_page=50`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
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

  const getDiscountedPrice = (product: Product) => {
    if (!product.discounts?.length) return null;
    const d = product.discounts[0];
    if (d.discount_type === "percentage") return product.price * (1 - d.discount_amount / 100);
    return product.price - d.discount_amount;
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
          <div className="grid grid-cols-2 gap-3">
            {products.map((product, index) => {
              const discounted = getDiscountedPrice(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl border border-border/50 overflow-hidden"
                >
                  <div className="aspect-square bg-muted">
                    {product.featured_image ? (
                      <img src={product.featured_image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {discounted != null ? (
                        <>
                          <span className="text-sm font-bold text-primary">${discounted.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-foreground">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default MyProducts;
