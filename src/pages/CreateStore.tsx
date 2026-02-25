import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { API_BASE_URL } from "@/lib/api";

const CreateStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location_name: "",
    email: "",
    phone: "",
    website: "",
  });
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Store name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (bannerImage) formData.append("banner_image", bannerImage);

      const response = await fetch(`${API_BASE_URL}/user/stores`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Store created successfully!" });
        navigate("/my-stores");
      } else {
        toast({ title: data.message || "Failed to create store", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Create Store</h1>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-5">
        {/* Banner Image */}
        <div>
          <Label className="text-sm font-medium text-foreground">Banner Image</Label>
          <label className="mt-2 flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Upload className="w-8 h-8 mb-1" />
                <span className="text-sm">Upload banner</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
          </label>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Store Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter store name" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your store"
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
            />
          </div>
          <div>
            <Label htmlFor="location_name">Location</Label>
            <Input id="location_name" value={form.location_name} onChange={(e) => handleChange("location_name", e.target.value)} placeholder="City or area" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="store@example.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+1234567890" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://yoursite.com" className="mt-1" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Store"}
        </button>
      </form>
    </div>
  );
};

export default CreateStore;
