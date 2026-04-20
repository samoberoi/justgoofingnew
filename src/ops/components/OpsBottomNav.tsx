import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, AppRole } from '../hooks/useAuth';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Truck,
  Users, Settings, LogOut, Crown, ScanLine
} from 'lucide-react';

const navConfig: Record<AppRole, { path: string; icon: any; label: string }[]> = {
  super_admin: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/check-in', icon: ScanLine, label: 'Check-In' },
    { path: '/ops-orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/ops-menu', icon: UtensilsCrossed, label: 'Playbook' },
    { path: '/loyalty', icon: Crown, label: 'Loyalty' },
    { path: '/customers', icon: Users, label: 'Users' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ],
  store_manager: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/check-in', icon: ScanLine, label: 'Check-In' },
    { path: '/ops-orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/ops-menu', icon: UtensilsCrossed, label: 'Playbook' },
    { path: '/customers', icon: Users, label: 'Users' },
  ],
  kitchen_manager: [
    { path: '/kitchen', icon: UtensilsCrossed, label: 'Orders' },
  ],
  delivery_partner: [
    { path: '/deliveries', icon: Truck, label: 'Deliveries' },
  ],
};

const OpsBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, signOut } = useAuth();

  if (!role) return null;
  const tabs = navConfig[role];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-ink/8 shadow-pop">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 shrink-0"
            >
              {isActive && (
                <motion.div
                  layoutId="opsNavIndicator"
                  className="absolute inset-x-0 top-0 bottom-0 bg-gradient-coral rounded-2xl shadow-pop-coral"
                  style={{ zIndex: 0 }}
                  transition={{ type: 'spring', damping: 22 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <tab.icon size={18} className={isActive ? 'text-white' : 'text-ink/55'} />
                <span className={`text-[9px] font-heading ${isActive ? 'text-white' : 'text-ink/55'}`}>
                  {tab.label}
                </span>
              </div>
            </motion.button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 shrink-0"
        >
          <LogOut size={18} className="text-ink/55" />
          <span className="text-[9px] font-heading text-ink/55">Out</span>
        </button>
      </div>
    </nav>
  );
};

export default OpsBottomNav;
