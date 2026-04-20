import { Home, CalendarCheck, Wallet, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/orders', icon: CalendarCheck, label: 'Bookings' },
  { path: '/wallet', icon: Wallet, label: 'Rewards' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-secondary/10 bg-background/90 backdrop-blur-2xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-px left-3 right-3 h-0.5 bg-gradient-saffron rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={20}
                className={`transition-colors ${isActive ? 'text-secondary' : 'text-muted-foreground/60'}`}
                fill={isActive ? 'currentColor' : 'none'}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-secondary' : 'text-muted-foreground/60'}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
