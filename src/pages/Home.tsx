import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import SearchBar from "@/components/home/SearchBar";
import CategorySlider from "@/components/home/CategorySlider";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedStores from "@/components/home/FeaturedStores";
import TabBar from "@/components/layout/TabBar";

const Home = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold text-foreground">Discount Panel</h1>
          </div>
          <button className="relative p-2 bg-secondary rounded-full">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>
      </motion.header>

      {/* Search */}
      <SearchBar />

      {/* Categories */}
      <CategorySlider />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Featured Stores */}
      <FeaturedStores />

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
};

export default Home;
