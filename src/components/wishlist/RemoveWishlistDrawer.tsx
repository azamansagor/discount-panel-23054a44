import { MapPin, Clock, Heart } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ItemData {
  id: number;
  name: string;
  price?: string;
  featured_image?: string;
  banner_image?: string;
  store?: {
    id: number;
    name: string;
  };
  address?: string;
}

interface RemoveWishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: ItemData | null;
  type: 'product' | 'store';
  isLoading?: boolean;
}

const STORAGE_URL = "https://discountpanel.shop/storage";

const RemoveWishlistDrawer = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  type,
  isLoading = false,
}: RemoveWishlistDrawerProps) => {
  if (!item) return null;

  const imageUrl = type === 'product' ? item.featured_image : item.banner_image;
  const getImageSrc = (url?: string) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http")) return url;
    return `${STORAGE_URL}/${url}`;
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="pt-4 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <DrawerTitle className="text-center text-xl font-bold">
            Remove From Wishlist ?
          </DrawerTitle>
        </DrawerHeader>

        {/* Item Preview Card */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
              <img
                src={getImageSrc(imageUrl)}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {item.name}
                </h3>
                <Heart className="w-5 h-5 text-destructive fill-destructive flex-shrink-0" />
              </div>
              
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm truncate">
                  {item.store?.name || item.address || "Location available"}
                </span>
              </div>

              {item.price && (
                <div className="flex items-center gap-1 mt-1 text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">
                    ${parseFloat(item.price).toLocaleString()}/Monthly
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📦 {type === 'product' ? 'Product' : 'Store'}</span>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              View Details
            </Button>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 px-0">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-xl text-base font-semibold border-border"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 h-14 rounded-xl text-base font-semibold bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Yes, Remove"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default RemoveWishlistDrawer;