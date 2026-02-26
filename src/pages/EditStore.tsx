import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Plus, X, Clock, MapPin, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, STORAGE_URL } from "@/lib/api";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 15); }, [lat, lng, map]);
  return null;
};

interface Category { id: number; name: string; }

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SOCIAL_TYPES = ["Facebook", "X.com", "Instagram", "TikTok", "YouTube", "WhatsApp"];

const EditStore = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", location_name: "", email: "", phone: "", website: "",
  });
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBanner, setExistingBanner] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string }>>(
    Object.fromEntries(DAYS.map((d) => [d, { open: "", close: "" }])),
  );
  const [socialContacts, setSocialContacts] = useState<{ type: string; value: string }[]>([]);
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchStoreData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ per_page: 100, page: 1 }),
      });
      const data = await response.json();
      if (data.success && data.data) setCategories(data.data);
    } catch {}
  };

  const fetchStoreData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      const store = data.data || data;

      setForm({
        name: store.name || "",
        description: store.description || "",
        location_name: store.location_name || store.address || "",
        email: store.email || "",
        phone: store.phone || "",
        website: store.website || "",
      });

      if (store.latitude) { setLatitude(String(store.latitude)); }
      if (store.longitude || store.lng || store.lon) {
        setLongitude(String(store.longitude || store.lng || store.lon));
      }
      if (store.latitude && (store.longitude || store.lng)) {
        setMapCenter([parseFloat(store.latitude), parseFloat(store.longitude || store.lng)]);
      }

      if (store.banner_image) {
        const url = store.banner_image.startsWith("http") ? store.banner_image : `${STORAGE_URL}/${store.banner_image}`;
        setExistingBanner(url);
        setBannerPreview(url);
      }

      if (store.images && Array.isArray(store.images)) {
        setExistingGallery(store.images.map((img: any) => {
          const src = typeof img === "string" ? img : img.image;
          return src.startsWith("http") ? src : `${STORAGE_URL}/${src}`;
        }));
      }

      if (store.categories && Array.isArray(store.categories)) {
        setSelectedCategories(store.categories.map((c: any) => c.id));
      }

      if (store.business_hours) {
        const bh = typeof store.business_hours === "string" ? JSON.parse(store.business_hours) : store.business_hours;
        const merged = { ...Object.fromEntries(DAYS.map((d) => [d, { open: "", close: "" }])) };
        Object.entries(bh).forEach(([day, val]: [string, any]) => {
          if (merged[day]) {
            merged[day] = { open: val.open || "", close: val.close || "" };
          }
        });
        setBusinessHours(merged);
        if (Object.values(merged).some((h) => h.open || h.close)) setShowBusinessHours(true);
      }

      if (store.social_contacts && Array.isArray(store.social_contacts)) {
        const contacts = store.social_contacts.map((s: any) => ({ type: s.type || "Facebook", value: s.value || "" }));
        setSocialContacts(contacts);
        if (contacts.length > 0) setShowSocials(true);
      }
    } catch {
      toast({ title: "Failed to load store data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerImage(file); setBannerPreview(URL.createObjectURL(file)); }
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

  const removeExistingGallery = (index: number) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const addSocialContact = () => setSocialContacts((prev) => [...prev, { type: SOCIAL_TYPES[0], value: "" }]);
  const updateSocialContact = (index: number, key: "type" | "value", val: string) => {
    setSocialContacts((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: val } : s)));
  };
  const removeSocialContact = (index: number) => setSocialContacts((prev) => prev.filter((_, i) => i !== index));
  const updateBusinessHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setMapCenter([lat, lng]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
      const data = await res.json();
      if (data.display_name) handleChange("location_name", data.display_name.split(",").slice(0, 3).join(",").trim());
    } catch {}
  }, []);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => handleMapClick(pos.coords.latitude, pos.coords.longitude),
      () => toast({ title: "Could not get your location", variant: "destructive" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [handleMapClick, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Store name is required", variant: "destructive" }); return; }
    if (selectedCategories.length === 0) { toast({ title: "Please select at least one category", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);
      if (bannerImage) formData.append("banner_image", bannerImage);

      for (const img of galleryImages) {
        if (img.size > 2048 * 1024) {
          toast({ title: `Image "${img.name}" exceeds 2MB limit.`, variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        formData.append("gallery_images[]", img);
      }

      selectedCategories.forEach((id) => formData.append("category_ids[]", id.toString()));

      const hasHours = Object.values(businessHours).some((h) => h.open || h.close);
      if (hasHours) {
        Object.entries(businessHours).forEach(([day, h]) => {
          if (h.open || h.close) {
            formData.append(`business_hours[${day}][open]`, h.open || "");
            formData.append(`business_hours[${day}][close]`, h.close || "");
          }
        });
      }

      const validSocials = socialContacts.filter((s) => s.value.trim());
      if (validSocials.length) {
        validSocials.forEach((s, i) => {
          formData.append(`social_contacts[${i}][type]`, s.type);
          formData.append(`social_contacts[${i}][value]`, s.value);
        });
      }

      const response = await fetch(`${API_BASE_URL}/user/stores/${storeId}`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Store updated successfully!" });
        navigate("/my-stores");
      } else {
        toast({ title: data.message || "Failed to update store", variant: "destructive" });
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
          <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Store</h1>
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
            {existingGallery.map((src, i) => (
              <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingGallery(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-destructive rounded-full">
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {galleryPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={preview} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-destructive rounded-full">
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
            <textarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Describe your store" className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]" />
          </div>

          {/* Categories */}
          <div className="relative">
            <Label>Categories *</Label>
            <button type="button" onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={selectedCategories.length ? "text-foreground" : "text-muted-foreground"}>
                {selectedCategories.length ? categories.filter((c) => selectedCategories.includes(c.id)).map((c) => c.name).join(", ") : "Select categories"}
              </span>
              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {categoryDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-secondary transition-colors">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedCategories.includes(cat.id) ? "bg-primary border-primary" : "border-input"}`}>
                      {selectedCategories.includes(cat.id) && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Store Location */}
          <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-semibold text-foreground"><MapPin className="w-4 h-4" /> Store Location</span>
              <button type="button" onClick={useMyLocation} className="flex items-center gap-1 text-xs text-primary font-medium"><Navigation className="w-3 h-3" /> Use My Location</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => { setLatitude(e.target.value); const lat = parseFloat(e.target.value); const lng = parseFloat(longitude); if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]); }} placeholder="e.g., 23.8103" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => { setLongitude(e.target.value); const lat = parseFloat(latitude); const lng = parseFloat(e.target.value); if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]); }} placeholder="e.g., 90.4125" className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="location_name" className="text-xs">Location Name / Address</Label>
              <Input id="location_name" value={form.location_name} onChange={(e) => handleChange("location_name", e.target.value)} placeholder="Enter store address" className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Click on the map to set location</Label>
              <div className="mt-1 rounded-xl overflow-hidden border border-border h-[200px]">
                <MapContainer center={mapCenter} zoom={13} className="w-full h-full" style={{ height: "200px", width: "100%" }}>
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler onMapClick={handleMapClick} />
                  <MapRecenter lat={mapCenter[0]} lng={mapCenter[1]} />
                  {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
                    <Marker position={[parseFloat(latitude), parseFloat(longitude)]} />
                  )}
                </MapContainer>
              </div>
            </div>
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

        {/* Business Hours */}
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
          <button type="button" onClick={() => setShowBusinessHours(!showBusinessHours)} className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2 text-base font-semibold text-foreground"><Clock className="w-4 h-4" /> Business Hours</span>
            <span className="text-sm text-muted-foreground">{showBusinessHours ? "Hide" : "Show"}</span>
          </button>
          {showBusinessHours && (
            <div className="space-y-3 pt-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-20 text-sm capitalize text-foreground">{day}</span>
                  <Input type="time" value={businessHours[day].open} onChange={(e) => updateBusinessHour(day, "open", e.target.value)} className="flex-1 h-9 text-sm" />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input type="time" value={businessHours[day].close} onChange={(e) => updateBusinessHour(day, "close", e.target.value)} className="flex-1 h-9 text-sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Contacts */}
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border/50">
          <button type="button" onClick={() => setShowSocials(!showSocials)} className="flex items-center justify-between w-full">
            <span className="text-base font-semibold text-foreground">Social Links</span>
            <span className="text-sm text-muted-foreground">{showSocials ? "Hide" : "Show"}</span>
          </button>
          {showSocials && (
            <div className="space-y-3 pt-2">
              {socialContacts.map((sc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={sc.type} onChange={(e) => updateSocialContact(i, "type", e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[100px]">
                    {SOCIAL_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <Input value={sc.value} onChange={(e) => updateSocialContact(i, "value", e.target.value)} placeholder="https://..." className="flex-1 h-9 text-sm" />
                  <button type="button" onClick={() => removeSocialContact(i)} className="p-1 text-destructive"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addSocialContact} className="flex items-center gap-1 text-sm text-primary font-medium">
                <Plus className="w-4 h-4" /> Add Social Link
              </button>
            </div>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Updating..." : "Update Store"}
        </button>
      </form>
    </div>
  );
};

export default EditStore;
