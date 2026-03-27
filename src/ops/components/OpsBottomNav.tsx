import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, AppRole } from '../hooks/useAuth';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Truck,
  BarChart3, Users, Settings, Ticket, LogOut
} from 'lucide-react';

const navConfig: Record<AppRole, { path: string; icon: any; label: string }[]> = {
  super_admin: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ops-orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ],
  store_manager: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/ops-orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/customers', icon: Users, label: 'Customers' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="opsNavIndicator"
                  className="absolute -top-px left-2 right-2 h-0.5 bg-gradient-saffron rounded-full"
                />
              )}
              <tab.icon size={20} className={isActive ? 'text-secondary' : 'text-muted-foreground'} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-secondary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-2"
        >
          <LogOut size={20} className="text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default OpsBottomNav;
