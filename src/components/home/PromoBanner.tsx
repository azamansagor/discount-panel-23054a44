import { motion } from "framer-motion";

export const PromoBanner = () => {
  return (
    <div className="px-4 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-5"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-primary-foreground mb-1">
            Your Savings, Your Way
          </h3>
          <p className="text-primary-foreground/80 text-sm mb-4 max-w-[200px]">
            Unlock exclusive deals and discounts at your favorite stores.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-card text-foreground rounded-xl text-sm font-semibold shadow-lg hover:bg-card/90 transition-colors"
          >
            Explore Now
          </motion.button>
        </div>

        {/* Decorative circles on the right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-white/30" />
          <div className="w-3 h-3 rounded-full bg-white/50" />
          <div className="w-3 h-3 rounded-full bg-white/70" />
        </div>
      </motion.div>
    </div>
  );
};

export default PromoBanner;
