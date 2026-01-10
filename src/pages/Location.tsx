import { motion } from "framer-motion";
import { MapPin, Navigation, Search } from "lucide-react";
import TabBar from "@/components/layout/TabBar";

const Location = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Find Stores</h1>
          <button className="p-2 bg-secondary rounded-full">
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.header>

      {/* Map Placeholder */}
      <div className="relative h-64 bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Map View</p>
            <p className="text-xs text-muted-foreground">Integrate with Google Maps</p>
          </div>
        </div>
      </div>

      {/* Current Location */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card border border-border/50"
        >
          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Current Location</h3>
            <p className="text-sm text-muted-foreground">123 Main Street, City Center</p>
          </div>
          <button className="text-primary font-medium text-sm">Change</button>
        </motion.div>
      </div>

      {/* Nearby Stores */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Nearby Stores</h2>
        <div className="space-y-3">
          {[
            { name: "TechZone Electronics", distance: "0.5 km", deals: 12 },
            { name: "Fashion Forward", distance: "1.2 km", deals: 8 },
            { name: "Gourmet Kitchen", distance: "0.8 km", deals: 15 },
          ].map((store, index) => (
            <motion.div
              key={store.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{store.name}</h3>
                <p className="text-sm text-muted-foreground">{store.distance} away</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg">
                  {store.deals} deals
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
};

export default Location;
