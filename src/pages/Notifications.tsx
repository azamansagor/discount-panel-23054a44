import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  highlight?: string;
  time: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Received Booking',
    message: 'Thank you! Your Booking',
    highlight: '#546567',
    time: '1 min ago'
  },
  {
    id: '2',
    type: 'success',
    title: 'Discount Offer',
    message: 'Hurry! Get up to 50% off on selected items. Shop now!',
    time: '1 min ago'
  },
  {
    id: '3',
    type: 'success',
    title: 'Seasonal Sale',
    message: 'Our Sale is live! Grab your favorite deals before they\'re gone!',
    time: '1 min ago'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Cart Reminder',
    message: 'Our Sale is live! Grab your favorite deals before they\'re gone!',
    time: '1 min ago'
  },
  {
    id: '5',
    type: 'error',
    title: 'Cart Reminder',
    message: 'Our Sale is live! Grab your favorite deals before they\'re gone!',
    time: '1 min ago'
  },
];

const typeColors: Record<NotificationType, string> = {
  info: 'bg-blue-100 text-blue-500',
  success: 'bg-green-100 text-green-500',
  warning: 'bg-yellow-100 text-yellow-500',
  error: 'bg-red-100 text-red-500',
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-cyan-50 to-cyan-50/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/home");
              }
            }}
            className="shrink-0 -ml-2 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
        <div className="h-px bg-border/50" />
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColors[notification.type]}`}>
                  <Info className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notification.message}
                    {notification.highlight && (
                      <>
                        {' '}
                        <span className="text-blue-500 font-medium">{notification.highlight}</span>
                        {' has been placed successfully.'}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">{notification.time}</p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="shrink-0 p-1 -mr-1 -mt-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
