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
      <button
        onClick={() => navigate(tab.path)}
        className="relative flex flex-col items-center justify-center w-14 h-14 shrink-0"
        aria-label={tab.label}
      >
        <motion.div
          animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className={isActive ? '' : 'opacity-55 grayscale'}
        >
          <Icon3D name={tab.icon} size={30} alt={tab.label} />
        </motion.div>
        {isActive && (
          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-ink" />
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none">
      <div className="relative max-w-lg mx-auto pointer-events-auto h-16">
        {/* Pill background */}
        <div className="absolute inset-0 bg-card rounded-full shadow-pop border border-border" />

        {/* Tabs row */}
        <div className="relative h-full flex items-center justify-between px-3">
          <div className="flex items-center gap-1">
            {left.map(t => <Tab key={t.path} tab={t} />)}
          </div>
          {/* spacer reserves room for FAB */}
          <div className="w-16 shrink-0" aria-hidden />
          <div className="flex items-center gap-1">
            {right.map(t => <Tab key={t.path} tab={t} />)}
          </div>
        </div>

        {/* Center FAB — perfectly centered to nav pill */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
          onClick={() => navigate('/my-qr')}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] w-16 h-16 rounded-full bg-ink flex items-center justify-center shadow-hero ring-4 ring-background"
          aria-label="My QR"
        >
          <Icon3D name="qr" size={34} alt="" />
        </motion.button>
      </div>
    </nav>
  );
};

export default BottomNav;
