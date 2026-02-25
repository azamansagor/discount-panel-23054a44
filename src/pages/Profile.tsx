import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  Heart,
  Bell,
  BookOpen,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
} from "lucide-react";
import TabBar from "@/components/layout/TabBar";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { getAllDisplayItems } = useWishlist();
  
  const wishlistCount = getAllDisplayItems().length;
  
  const menuItems = [
    { icon: Heart, label: "Wishlist", badge: wishlistCount > 0 ? wishlistCount.toString() : null, route: "/wishlist" },
    { icon: Bell, label: "Notifications", badge: null, route: "/notifications" },
    { icon: BookOpen, label: "Tutorials", badge: null, route: "/tutorials" },
    { icon: Settings, label: "Settings", badge: null },
    { icon: HelpCircle, label: "Help & Support", badge: null },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (route?: string) => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <button className="p-2 bg-secondary rounded-full">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.header>

      {/* Profile Card */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card border border-border/50"
        >
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            {isAuthenticated ? (
              <>
                <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground">Guest User</h2>
                <p className="text-sm text-muted-foreground">Login to access your account</p>
              </>
            )}
          </div>
          {isAuthenticated ? (
            <button className="text-primary font-medium text-sm">Edit</button>
          ) : (
            <button onClick={() => navigate("/login")} className="text-primary font-medium text-sm">
              Login
            </button>
          )}
        </motion.div>
      </div>

      {/* Menu Items */}
      <div className="px-4">
        <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMenuClick(item.route)}
                className="flex items-center gap-3 w-full px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-b-0"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Login/Logout Button */}
      <div className="px-4 py-6">
        {isAuthenticated ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-4 text-destructive font-medium"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl"
          >
            <LogIn className="w-5 h-5" />
            Log In
          </motion.button>
        )}
      </div>

      <TabBar />
    </div>
  );
};

export default Profile;
