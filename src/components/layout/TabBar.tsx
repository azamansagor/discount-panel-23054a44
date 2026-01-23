import { motion } from "framer-motion";
import { Home, LayoutGrid, Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface TabItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: LayoutGrid },
  { path: "/wishlist", label: "Wishlist", icon: Heart },
  { path: "/profile", label: "Account", icon: User },
];

export const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                />
              </motion.div>
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
