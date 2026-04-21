import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon3D, { Icon3DName } from './Icon3D';

const tabs: { path: string; icon: Icon3DName; label: string }[] = [
  { path: '/home', icon: 'home', label: 'Home' },
  { path: '/menu', icon: 'play', label: 'Play' },
  { path: '/wallet', icon: 'wallet', label: 'Rewards' },
  { path: '/profile', icon: 'user', label: 'Me' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const Tab = ({ tab }: { tab: typeof tabs[number] }) => {
    const isActive = location.pathname === tab.path;
    return (
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => navigate(tab.path)}
        className="relative flex flex-col items-center justify-center w-14 h-14"
        aria-label={tab.label}
      >
        <motion.div
          animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={isActive ? '' : 'opacity-55 grayscale'}
        >
          <Icon3D name={tab.icon} size={32} alt={tab.label} />
        </motion.div>
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
          <div className="w-14" />
          <div className="flex gap-1">
            {right.map(t => <Tab key={t.path} tab={t} />)}
          </div>
        </div>

        {/* Center FAB — 3D play icon on dark disc */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/menu')}
          className="absolute left-1/2 -translate-x-1/2 -top-3 w-16 h-16 rounded-full bg-ink flex items-center justify-center shadow-hero ring-4 ring-background"
          aria-label="Play"
        >
          <Icon3D name="play" size={40} alt="" />
        </motion.button>
      </div>
    </nav>
  );
};

export default BottomNav;
