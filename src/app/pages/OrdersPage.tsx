import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    const { data } = await (supabase
      .from('orders')
      .select('*') as any)
      .eq('user_id', userId!)
      .order('created_at', { ascending: false });

    const fetchedOrders = data || [];
    setOrders(fetchedOrders);

    if (fetchedOrders.length > 0) {
      const ids = fetchedOrders.map(o => o.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids);

      const grouped: Record<string, any[]> = {};
      (items || []).forEach(it => {
        if (!grouped[it.order_id]) grouped[it.order_id] = [];
        grouped[it.order_id].push(it);
      });
      setOrderItems(grouped);
    }
    setLoading(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusConfig: Record<string, { bg: string; text: string }> = {
    delivered: { bg: 'bg-green-500/10', text: 'text-green-500' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-500' },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">My Orders</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-heading text-base text-foreground">No Orders Yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your royal feast history will appear here</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/home')}
              className="mt-5 px-6 py-3 bg-gradient-saffron rounded-xl text-xs font-heading text-primary-foreground uppercase tracking-wider">
              Browse Menu
            </motion.button>
          </div>
        ) : (
          orders.map((order, i) => {
            const items = orderItems[order.id] || [];
            const config = statusConfig[order.status] || { bg: 'bg-secondary/10', text: 'text-secondary' };

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/tracking/${order.id}`)}
                className="bg-card border border-border rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform hover:border-secondary/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Package size={14} className="text-secondary" />
                    </div>
                    <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.text}`}>
                    {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {items.slice(0, 3).map(it => (
                    <p key={it.id} className="text-[11px] text-muted-foreground">{it.name} × {it.quantity}</p>
                  ))}
                  {items.length > 3 && <p className="text-[11px] text-muted-foreground/60">+{items.length - 3} more</p>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">{formatDate(order.created_at)}</span>
                  <span className="font-heading text-sm text-secondary">₹{Number(order.total).toLocaleString()}</span>
                </div>
                {order.status === 'delivered' && (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.stopPropagation(); navigate('/home'); }}
                    className="w-full mt-2.5 py-2 bg-secondary/10 border border-secondary/20 rounded-xl text-xs font-heading text-secondary flex items-center justify-center gap-1.5">
                    <RefreshCw size={12} /> Reorder
                  </motion.button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default OrdersPage;
