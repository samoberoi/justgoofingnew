import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

interface ProfileRecentOrdersProps {
  orders: any[];
  navigate: (path: string) => void;
}

const ProfileRecentOrders = ({ orders, navigate }: ProfileRecentOrdersProps) => {
  if (orders.length === 0) return null;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-foreground font-heading flex items-center gap-1.5">
          <Package size={14} className="text-secondary" /> Recent Orders
        </p>
        <button onClick={() => navigate('/orders')} className="text-xs text-secondary font-medium">View All →</button>
      </div>
      <div className="space-y-1.5">
        {orders.map(o => (
          <motion.div key={o.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/tracking/${o.id}`)}
            className="bg-card border border-border rounded-xl p-3 flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-heading text-foreground">{o.order_number}</p>
              <p className="text-[10px] text-muted-foreground">{formatDate(o.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-heading text-secondary">₹{Number(o.total).toLocaleString()}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                o.status === 'delivered' ? 'bg-green-500/10 text-green-500'
                : o.status === 'cancelled' ? 'bg-red-500/10 text-red-500'
                : 'bg-secondary/10 text-secondary'
              }`}>
                {o.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProfileRecentOrders;
