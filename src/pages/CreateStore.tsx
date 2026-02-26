import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Plus, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SOCIAL_TYPES = ["Facebook", "X.com", "Instagram", "TikTok", "YouTube", "WhatsApp"];

const CreateStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
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
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string }>>(
    Object.fromEntries(DAYS.map((d) => [d, { open: "", close: "" }]))
  );
  const [socialContacts, setSocialContacts] = useState<{ type: string; value: string }[]>([]);
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setGalleryImages((prev) => [...prev, ...files]);
      setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addSocialContact = () => {
    setSocialContacts((prev) => [...prev, { type: SOCIAL_TYPES[0], value: "" }]);
  };

  const updateSocialContact = (index: number, key: "type" | "value", val: string) => {
    setSocialContacts((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: val } : s)));
  };

  const removeSocialContact = (index: number) => {
    setSocialContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBusinessHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Store name is required", variant: "destructive" });
      return;
    }
    if (selectedCategories.length === 0) {
      toast({ title: "Please select at least one category", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (bannerImage) formData.append("banner_image", bannerImage);
      galleryImages.forEach((img) => formData.append("gallery_images[]", img));
      selectedCategories.forEach((id) => formData.append("category_ids[]", id.toString()));

      // Business hours
      const hasHours = Object.values(businessHours).some((h) => h.open || h.close);
      if (hasHours) {
        formData.append("business_hours", JSON.stringify(
          Object.fromEntries(
            Object.entries(businessHours).map(([day, h]) => [day, { open: h.open || null, close: h.close || null }])
          )
        ));
      }

      // Social contacts
      const validSocials = socialContacts.filter((s) => s.value.trim());
      if (validSocials.length) {
        formData.append("social_contacts", JSON.stringify(validSocials));
      }

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

        {/* Gallery Images */}
        <div>
          <Label className="text-sm font-medium text-foreground">Gallery Images</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {galleryPreviews.map((preview, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={preview} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-destructive rounded-full"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGallery} />
            </label>
          </div>
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

        {/* Categories */}
        <div>
          <Label>Categories *</Label>
          {categories.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Loading categories...</p>
          )}
        </div>

        {/* Business Hours */}
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setShowBusinessHours(!showBusinessHours)}
            className="flex items-center justify-between w-full"
          >
            <span className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="w-4 h-4" /> Business Hours
            </span>
            <span className="text-sm text-muted-foreground">{showBusinessHours ? "Hide" : "Show"}</span>
          </button>
          {showBusinessHours && (
            <div className="space-y-3 pt-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-20 text-sm capitalize text-foreground">{day}</span>
                  <Input
                    type="time"
                    value={businessHours[day].open}
                    onChange={(e) => updateBusinessHour(day, "open", e.target.value)}
                    className="flex-1 h-9 text-sm"
                    placeholder="Open"
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="time"
                    value={businessHours[day].close}
                    onChange={(e) => updateBusinessHour(day, "close", e.target.value)}
                    className="flex-1 h-9 text-sm"
                    placeholder="Close"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Contacts */}
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setShowSocials(!showSocials)}
            className="flex items-center justify-between w-full"
          >
            <span className="text-base font-semibold text-foreground">Social Links</span>
            <span className="text-sm text-muted-foreground">{showSocials ? "Hide" : "Show"}</span>
          </button>
          {showSocials && (
            <div className="space-y-3 pt-2">
              {socialContacts.map((sc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={sc.type}
                    onChange={(e) => updateSocialContact(i, "type", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[100px]"
                  >
                    {SOCIAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <Input
                    value={sc.value}
                    onChange={(e) => updateSocialContact(i, "value", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 h-9 text-sm"
                  />
                  <button type="button" onClick={() => removeSocialContact(i)} className="p-1 text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSocialContact}
                className="flex items-center gap-1 text-sm text-primary font-medium"
              >
                <Plus className="w-4 h-4" /> Add Social Link
              </button>
            </div>
          )}
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
