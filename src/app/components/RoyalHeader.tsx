import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';

const PlayfulHeader = () => {
  const { walletBalance } = useAppStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center">
            <span className="font-display text-white text-base leading-none">JG</span>
          </div>
          <span className="font-display text-lg text-ink leading-none -tracking-wide">Goofing</span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-mint shadow-pop-mint"
          >
            <span className="text-xs">🪙</span>
            <span className="text-xs text-ink font-display tabular-nums">{walletBalance}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Search"
          >
            <Search size={16} className="text-ink" strokeWidth={2.5} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={16} className="text-ink" strokeWidth={2.5} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-coral rounded-full ring-2 ring-background" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default PlayfulHeader;
