import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const mockOrders = [
  { id: 'BRYN-4021', items: ['Badshahi Murgh Biryani x1'], total: 349, status: 'Delivered', date: '27 Feb 2026' },
  { id: 'BRYN-3998', items: ['Nawabi Gosht Biryani x2'], total: 898, status: 'Delivered', date: '24 Feb 2026' },
  { id: 'BRYN-3965', items: ['Zaffrani Sabz Biryani x1', 'Sehat Murgh Biryani x1'], total: 628, status: 'Delivered', date: '20 Feb 2026' },
];

const OrdersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">My Orders</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {mockOrders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-secondary" />
                <span className="font-heading text-sm text-foreground">{order.id}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                {order.status}
              </span>
            </div>
            <div className="mt-2">
              {order.items.map(item => (
                <p key={item} className="text-xs text-muted-foreground">{item}</p>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground">{order.date}</span>
              <span className="font-heading text-sm text-secondary">₹{order.total}</span>
            </div>
            <button
              onClick={() => navigate('/app/tracking')}
              className="w-full mt-3 py-2 bg-muted rounded-lg text-xs font-heading text-foreground"
            >
              Reorder
            </button>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default OrdersPage;
