import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
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
    // Get user's phone from profile to match orders
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('user_id', userId!)
      .single();

    if (!profile?.phone) { setLoading(false); return; }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', profile.phone)
      .order('created_at', { ascending: false });

    const fetchedOrders = data || [];
    setOrders(fetchedOrders);

    // Fetch items for all orders
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">My Orders</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders yet</p>
            <p className="text-xs mt-1">Your orders will appear here after you place one</p>
          </div>
        ) : (
          orders.map((order, i) => {
            const items = orderItems[order.id] || [];
            const statusColor = order.status === 'delivered' ? 'bg-green-500/10 text-green-500'
              : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500'
              : 'bg-secondary/10 text-secondary';

            return (
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
                    <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                    {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </div>
                <div className="mt-2">
                  {items.length > 0 ? items.map(it => (
                    <p key={it.id} className="text-xs text-muted-foreground">{it.name} x{it.quantity}</p>
                  )) : (
                    <p className="text-xs text-muted-foreground">Order items</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">{formatDate(order.created_at)}</span>
                  <span className="font-heading text-sm text-secondary">₹{Number(order.total).toLocaleString()}</span>
                </div>
                {order.status === 'delivered' && (
                  <button
                    onClick={() => navigate('/home')}
                    className="w-full mt-3 py-2 bg-muted rounded-lg text-xs font-heading text-foreground"
                  >
                    Reorder
                  </button>
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
