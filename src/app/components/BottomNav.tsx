import { Home, Sparkles, Gift, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: 'Home', color: 'coral' },
  { path: '/menu', icon: Sparkles, label: 'Play', color: 'butter' },
  { path: '/wallet', icon: Gift, label: 'Rewards', color: 'mint' },
  { path: '/profile', icon: User, label: 'Me', color: 'lavender' },
];

const colorMap: Record<string, string> = {
  coral: 'bg-gradient-coral',
  butter: 'bg-gradient-butter',
  mint: 'bg-gradient-mint',
  lavender: 'bg-gradient-lavender',
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <div className="flex items-center justify-around bg-card rounded-[28px] shadow-pop border-2 border-ink/8 max-w-lg mx-auto p-2">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center px-3 py-1.5 min-w-[60px]"
            >
              <motion.div
                animate={{
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1 : 1,
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isActive ? `${colorMap[tab.color]} shadow-pop-${tab.color}` : 'bg-transparent'
                }`}
              >
                <tab.icon
                  size={20}
                  className={isActive ? 'text-ink' : 'text-muted-foreground'}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              </motion.div>
              <span className={`text-[10px] font-display mt-0.5 transition-colors ${isActive ? 'text-ink' : 'text-muted-foreground'}`}>
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
