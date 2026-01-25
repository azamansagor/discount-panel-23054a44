import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { MapPin, Loader2 } from "lucide-react";

interface SearchFiltersState {
  type: "all" | "stores" | "products";
  priceRange: "all" | "0-50" | "50-100" | "100+";
  rating: "all" | "3" | "4" | "5";
  useLocation: boolean;
  radius: number;
}

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  onApply: (filters: SearchFiltersState) => void;
  locationLoading?: boolean;
  hasLocation?: boolean;
  onRequestLocation?: () => void;
  locationError?: string | null;
}

const SearchFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onApply,
  locationLoading = false,
  hasLocation = false,
  onRequestLocation,
  locationError,
}: SearchFiltersProps) => {
  // Local state for pending changes
  const [localFilters, setLocalFilters] = useState<SearchFiltersState>(filters);

  // Reset local filters when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleReset = () => {
    const defaultFilters: SearchFiltersState = {
      type: "all",
      priceRange: "all",
      rating: "all",
      useLocation: false,
      radius: 10,
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClose = () => {
    // Reset local filters to current applied filters on close without applying
    setLocalFilters(filters);
    onClose();
  };

  const handleLocationToggle = (checked: boolean) => {
    if (checked && !hasLocation && onRequestLocation) {
      onRequestLocation();
    }
    setLocalFilters({ ...localFilters, useLocation: checked });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-2" />
          <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Location Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Near Me</Label>
              </div>
              <div className="flex items-center gap-2">
                {locationLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={localFilters.useLocation}
                  onCheckedChange={handleLocationToggle}
                  disabled={locationLoading}
                />
              </div>
            </div>
            
            {localFilters.useLocation && (
              <div className="space-y-3 pl-7">
                {locationError ? (
                  <p className="text-sm text-destructive">{locationError}</p>
                ) : hasLocation ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Search radius</span>
                      <span className="font-medium">{localFilters.radius} km</span>
                    </div>
                    <Slider
                      value={[localFilters.radius]}
                      onValueChange={([value]) => setLocalFilters({ ...localFilters, radius: value })}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enable location access to search nearby
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type</Label>
            <RadioGroup
              value={localFilters.type}
              onValueChange={(value) => setLocalFilters({ ...localFilters, type: value as SearchFiltersState["type"] })}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: "all", label: "All" },
                { value: "stores", label: "Stores" },
                { value: "products", label: "Products" },
              ].map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`type-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`type-${option.value}`}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer border transition-all ${
                      localFilters.type === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Price Range</Label>
            <RadioGroup
              value={localFilters.priceRange}
              onValueChange={(value) => setLocalFilters({ ...localFilters, priceRange: value as SearchFiltersState["priceRange"] })}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: "all", label: "Any" },
                { value: "0-50", label: "$0 - $50" },
                { value: "50-100", label: "$50 - $100" },
                { value: "100+", label: "$100+" },
              ].map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`price-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`price-${option.value}`}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer border transition-all ${
                      localFilters.priceRange === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Minimum Rating</Label>
            <RadioGroup
              value={localFilters.rating}
              onValueChange={(value) => setLocalFilters({ ...localFilters, rating: value as SearchFiltersState["rating"] })}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: "all", label: "Any" },
                { value: "3", label: "3+ ⭐" },
                { value: "4", label: "4+ ⭐" },
                { value: "5", label: "5 ⭐" },
              ].map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`rating-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`rating-${option.value}`}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer border transition-all ${
                      localFilters.rating === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-xl text-base font-semibold"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            className="flex-1 h-14 rounded-xl text-base font-semibold"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchFilters;
