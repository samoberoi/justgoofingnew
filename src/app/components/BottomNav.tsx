import { Home, Sparkles, Gift, User, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/menu', icon: Sparkles, label: 'Play' },
  { path: '/wallet', icon: Gift, label: 'Rewards' },
  { path: '/profile', icon: User, label: 'Me' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Reference layout: 2 tabs · center FAB · 2 tabs
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const Tab = ({ tab }: { tab: typeof tabs[number] }) => {
    const isActive = location.pathname === tab.path;
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => navigate(tab.path)}
        className="relative flex flex-col items-center justify-center w-14 h-14"
        aria-label={tab.label}
      >
        <tab.icon
          size={22}
          className={isActive ? 'text-ink' : 'text-muted-foreground'}
          strokeWidth={isActive ? 2.6 : 2}
          fill={isActive ? 'currentColor' : 'none'}
        />
        {isActive && (
          <motion.div
            layoutId="navdot"
            className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-ink"
          />
        )}
      </motion.button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none">
      <div className="relative max-w-lg mx-auto pointer-events-auto">
        <div className="flex items-center justify-between bg-card rounded-full shadow-pop border border-border px-4 py-2">
          <div className="flex gap-1">
            {left.map(t => <Tab key={t.path} tab={t} />)}
          </div>
          <div className="w-14" /> {/* spacer for FAB */}
          <div className="flex gap-1">
            {right.map(t => <Tab key={t.path} tab={t} />)}
          </div>
        </div>

        {/* Center FAB — reference style black hexagon */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/menu')}
          className="absolute left-1/2 -translate-x-1/2 -top-3 w-16 h-16 rounded-full bg-ink flex items-center justify-center shadow-hero ring-4 ring-background"
          aria-label="Add"
        >
          <Plus size={26} className="text-white" strokeWidth={3} />
        </motion.button>
      </div>
    </nav>
  );
};

export default BottomNav;
