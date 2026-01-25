import { motion } from "framer-motion";
import { Heart, MapPin, Clock, Bed, Bath, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";

const STORAGE_URL = "https://discountpanel.shop/storage";

interface ItemCardProps {
  id: number;
  name: string;
  images: string[];
  type: "store" | "product";
  location?: string;
  price?: number;
  discount?: number;
  distance?: string;
  deliveryTime?: string;
  tags?: string[];
  variant?: "full" | "compact" | "grid";
  index?: number;
  onWishlistClick?: (e: React.MouseEvent) => void;
  showWishlistConfirmation?: boolean;
}

export const ItemCard = ({
  id,
  name,
  images,
  type,
  location,
  price,
  discount,
  distance = "4.4 km",
  deliveryTime = "25-30 mins",
  tags = [],
  variant = "full",
  index = 0,
  onWishlistClick,
  showWishlistConfirmation = false,
}: ItemCardProps) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(type, id);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/placeholder.svg";
    if (imagePath.startsWith("http")) return imagePath;
    return `${STORAGE_URL}/${imagePath}`;
  };

  const handleClick = () => {
    if (type === "store") {
      navigate(`/store/${id}`);
    } else {
      navigate(`/product/${id}`);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWishlistClick) {
      onWishlistClick(e);
    } else {
      toggleWishlist(type, id, {
        id,
        name,
        price: price ? String(price) : undefined,
        featured_image: images[0] ? getImageUrl(images[0]) : undefined,
        banner_image: images[0] ? getImageUrl(images[0]) : undefined,
        discounts: discount ? [{ id: 0, discount_type: 'percentage', amount: String(discount) }] : undefined,
      });
    }
  };

  const getTagIcon = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes("bed") || lowerTag.includes("room")) return Bed;
    if (lowerTag.includes("bath")) return Bath;
    return Home;
  };

  // Full width card (for explore/category pages)
  if (variant === "full") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.2) }}
        className="bg-card rounded-2xl overflow-hidden shadow-md cursor-pointer"
        onClick={handleClick}
      >
        {/* Image Section */}
        <div className="relative aspect-[16/10]">
          <img
            src={getImageUrl(images[0])}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />

          {/* Discount Badge - Diagonal ribbon style */}
          {discount && discount > 0 && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                inWishlist
                  ? "fill-destructive text-destructive"
                  : "text-white"
              }`}
            />
          </button>

          {/* Time & Distance Info */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4" />
            <span>{deliveryTime}</span>
            <span className="mx-0.5">·</span>
            <span>{distance}</span>
          </div>

          {/* Image Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === 0 ? "bg-white w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-bold text-foreground text-lg line-clamp-1 mb-2">
            {name}
          </h3>

          {/* Location & Price Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{location || "Location not specified"}</span>
            </div>
            {price !== undefined && price > 0 && (
              <span className="text-primary font-bold text-lg">
                ${price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag, idx) => {
                const IconComponent = getTagIcon(tag);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium text-muted-foreground"
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{tag}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Compact card (for horizontal scrolling lists)
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex-shrink-0 w-72"
      >
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer"
          onClick={handleClick}
        >
          {/* Image Container */}
          <div className="relative aspect-[16/10]">
            <img
              src={getImageUrl(images[0])}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            
            {/* Discount Badge */}
            {discount && discount > 0 && (
              <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                {discount}% OFF
              </div>
            )}
            
            {/* Wishlist Button */}
            <button 
              className="absolute top-3 right-3 w-8 h-8 bg-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
              onClick={handleWishlistToggle}
            >
              <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-destructive text-destructive' : 'text-white'}`} />
            </button>

            {/* Time & Distance */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{deliveryTime}</span>
              <span>·</span>
              <span>{distance}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-3.5">
            {/* Name */}
            <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1.5">
              {name}
            </h3>

            {/* Location & Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs truncate max-w-[120px]">{location || "Location"}</span>
              </div>
              {price !== undefined && price > 0 && (
                <span className="text-sm font-bold text-primary">
                  ${price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Grid card (for 2-column grids like wishlist)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={getImageUrl(images[0])}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        
        {/* Discount Badge */}
        {discount && discount > 0 && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-lg text-xs font-bold">
            {discount}% OFF
          </div>
        )}

        {/* Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 w-8 h-8 bg-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-destructive text-destructive' : 'text-white'}`} />
        </button>

        {/* Time & Distance */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          <span>{distance}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1.5">
          {name}
        </h3>
        
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{location || "Location"}</span>
        </div>

        {price !== undefined && price > 0 && (
          <div className="text-primary font-bold text-sm">
            ${price.toLocaleString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ItemCard;
