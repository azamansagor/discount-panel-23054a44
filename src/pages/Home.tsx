import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin, ChevronDown } from "lucide-react";
import SearchBar from "@/components/home/SearchBar";
import CategoryTabs from "@/components/home/CategoryTabs";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import NearbyStores from "@/components/home/NearbyStores";
import PromoBanner from "@/components/home/PromoBanner";
import TabBar from "@/components/layout/TabBar";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Location Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Delivery To</p>
            <button className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">New York, USA</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* Notification Button */}
          <button 
            onClick={() => navigate("/notifications")}
            className="relative w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
          </button>
        </div>
      </motion.header>

      {/* Search */}
      <SearchBar />

      {/* Category Tabs */}
      <CategoryTabs />

      {/* Featured Products - Horizontal Scroll */}
      <FeaturedProducts />

      {/* Nearby Stores - List Style */}
      <NearbyStores />

      {/* Promo Banner */}
      <PromoBanner />

      {/* Best Offers Section - Reuse Featured Products with different title */}
      <BestOffers />

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
};

// Best Offers Section (similar to Featured but different styling)
const BestOffers = () => {
  return (
    <div className="py-4 pb-8">
      <div className="px-4 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Best Offers</h2>
        <button className="flex items-center gap-1 text-primary font-medium text-sm">
          See all
        </button>
      </div>
      
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* These would be populated by API - showing static for now */}
        <BestOfferCard />
        <BestOfferCard />
      </div>
    </div>
  );
};

const BestOfferCard = () => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer"
    >
      <div className="relative">
        <div className="w-full h-28 bg-secondary" />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent rounded-md">
          <span className="text-[10px] font-bold text-accent-foreground">15% OFF</span>
        </div>
        <button className="absolute top-2 right-2 w-7 h-7 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
          <motion.div whileTap={{ scale: 1.2 }}>
            ❤️
          </motion.div>
        </button>
      </div>
      <div className="p-2.5">
        <p className="text-[10px] text-muted-foreground mb-0.5">📍 25-30 mins • 4.4 km</p>
        <h3 className="text-xs font-semibold text-foreground line-clamp-1 mb-1">
          Modern Miami City in CA
        </h3>
        <p className="text-[10px] text-muted-foreground mb-1">📍 New York City, NY</p>
        <span className="text-xs font-bold text-primary">$16,000</span>
      </div>
    </motion.div>
  );
};

export default Home;
