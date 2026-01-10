import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Ticket
} from "lucide-react";
import TabBar from "@/components/layout/TabBar";

const menuItems = [
  { icon: ShoppingBag, label: "My Orders", badge: "3" },
  { icon: Heart, label: "Wishlist", badge: "12" },
  { icon: Ticket, label: "My Coupons", badge: "5" },
  { icon: Bell, label: "Notifications", badge: null },
  { icon: Settings, label: "Settings", badge: null },
  { icon: HelpCircle, label: "Help & Support", badge: null },
];

const Profile = () => {
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
            <h2 className="text-lg font-bold text-foreground">John Doe</h2>
            <p className="text-sm text-muted-foreground">john.doe@email.com</p>
          </div>
          <button className="text-primary font-medium text-sm">Edit</button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Saved", value: "$1,234" },
            { label: "Orders", value: "23" },
            { label: "Points", value: "850" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-card rounded-2xl text-center border border-border/50"
            >
              <p className="text-xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
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
                className="flex items-center gap-3 w-full px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-b-0"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground text-left">
                  {item.label}
                </span>
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

      {/* Logout Button */}
      <div className="px-4 py-6">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 w-full py-4 text-destructive font-medium"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>
      </div>

      <TabBar />
    </div>
  );
};

export default Profile;
