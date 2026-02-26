import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

const EditProduct = () => {
  const navigate = useNavigate();
  const { storeId, productId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    short_description: "",
    price: "",
    affiliate_link: "",
    delivery_radius: "",
  });
  const [isAnywhereDelivery, setIsAnywhereDelivery] = useState(true);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState({
    discount_title: "",
    discount_type: "percentage",
    discount_amount: "",
    discount_start_date: "",
    discount_end_date: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchCategories();
    fetchProduct();
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch {}
  };

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/store/products/show`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ store_id: Number(storeId), product_id: Number(productId) }),
        }
      );
      if (response.status === 403) {
        toast({ title: "You don't own this store", variant: "destructive" });
        navigate("/my-stores");
        return;
      }
      if (response.status === 404) {
        toast({ title: "Product not found", variant: "destructive" });
        navigate(`/my-stores/${storeId}/products`);
        return;
      }
      const data = await response.json();
      const product = data.data || data.product || data;

      setForm({
        name: product.name || "",
        description: product.description || "",
        short_description: product.short_description || "",
        price: product.price?.toString() || "",
        affiliate_link: product.affiliate_link || "",
        delivery_radius: product.delivery_radius?.toString() || "",
      });
      setIsAnywhereDelivery(
        product.is_anywhere_delivery === 1 || product.is_anywhere_delivery === true
      );
      if (product.featured_image) {
        setExistingImage(product.featured_image);
        setImagePreview(product.featured_image);
      }
      if (product.categories?.length) {
        setSelectedCategories(product.categories.map((c: any) => c.id));
      } else if (product.category_ids?.length) {
        setSelectedCategories(product.category_ids);
      }
      if (product.discounts?.length) {
        const d = product.discounts[0];
        setDiscountEnabled(true);
        setDiscount({
          discount_title: d.title || d.discount_title || "",
          discount_type: d.discount_type || "percentage",
          discount_amount: (d.discount_amount || d.amount || "").toString(),
          discount_start_date: d.start_date || d.discount_start_date || "",
          discount_end_date: d.end_date || d.discount_end_date || "",
        });
      }
    } catch {
      toast({ title: "Failed to load product", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price) {
      toast({ title: "Name, description and price are required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("store_id", storeId || "");
      formData.append("name", form.name);
      formData.append("description", form.description);
      if (form.short_description) formData.append("short_description", form.short_description);
      formData.append("price", form.price);
      if (form.affiliate_link) formData.append("affiliate_link", form.affiliate_link);
      formData.append("is_anywhere_delivery", isAnywhereDelivery ? "1" : "0");
      if (!isAnywhereDelivery && form.delivery_radius) formData.append("delivery_radius", form.delivery_radius);
      if (featuredImage) formData.append("featured_image", featuredImage);
      selectedCategories.forEach((id) => formData.append("category_ids[]", id.toString()));

      if (discountEnabled) {
        formData.append("discount_enabled", "1");
        formData.append("discount_title", discount.discount_title);
        formData.append("discount_type", discount.discount_type);
        formData.append("discount_amount", discount.discount_amount);
        if (discount.discount_start_date) formData.append("discount_start_date", discount.discount_start_date);
        if (discount.discount_end_date) formData.append("discount_end_date", discount.discount_end_date);
      }

      const response = await fetch(`${API_BASE_URL}/user/products/${productId}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && (data.success || data.product || data.data)) {
        toast({ title: "Product updated successfully!" });
        navigate(`/my-stores/${storeId}/products`);
      } else {
        toast({ title: data.message || "Failed to update product", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(`/my-stores/${storeId}/products`)} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Product</h1>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">
        {/* Featured Image */}
        <div>
          <Label>Product Image</Label>
          <label className="mt-2 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Upload className="w-8 h-8 mb-1" />
                <span className="text-sm">Upload image</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter product name" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Product description"
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
            />
          </div>
          <div>
            <Label htmlFor="short_description">Short Description</Label>
            <Input id="short_description" value={form.short_description} onChange={(e) => handleChange("short_description", e.target.value)} placeholder="Brief summary" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="price">Price *</Label>
            <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="affiliate_link">Affiliate Link</Label>
            <Input id="affiliate_link" value={form.affiliate_link} onChange={(e) => handleChange("affiliate_link", e.target.value)} placeholder="https://..." className="mt-1" />
          </div>

          {/* Delivery */}
          <div className="flex items-center justify-between">
            <Label>Anywhere Delivery</Label>
            <Switch checked={isAnywhereDelivery} onCheckedChange={setIsAnywhereDelivery} />
          </div>
          {!isAnywhereDelivery && (
            <div>
              <Label htmlFor="delivery_radius">Delivery Radius (km)</Label>
              <Input id="delivery_radius" type="number" value={form.delivery_radius} onChange={(e) => handleChange("delivery_radius", e.target.value)} placeholder="e.g. 50" className="mt-1" />
            </div>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discount */}
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Discount</Label>
            <Switch checked={discountEnabled} onCheckedChange={setDiscountEnabled} />
          </div>
          {discountEnabled && (
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="discount_title">Title</Label>
                <Input id="discount_title" value={discount.discount_title} onChange={(e) => setDiscount((p) => ({ ...p, discount_title: e.target.value }))} placeholder="Summer Sale" className="mt-1" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Type</Label>
                  <select
                    value={discount.discount_type}
                    onChange={(e) => setDiscount((p) => ({ ...p, discount_type: e.target.value }))}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="discount_amount">Amount</Label>
                  <Input id="discount_amount" type="number" value={discount.discount_amount} onChange={(e) => setDiscount((p) => ({ ...p, discount_amount: e.target.value }))} placeholder="10" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={discount.discount_start_date} onChange={(e) => setDiscount((p) => ({ ...p, discount_start_date: e.target.value }))} className="mt-1" />
                </div>
                <div className="flex-1">
                  <Label>End Date</Label>
                  <Input type="date" value={discount.discount_end_date} onChange={(e) => setDiscount((p) => ({ ...p, discount_end_date: e.target.value }))} className="mt-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
