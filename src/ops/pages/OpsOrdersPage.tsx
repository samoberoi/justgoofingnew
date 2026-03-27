import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { Search, Filter, RefreshCw } from 'lucide-react';

const ORDER_STATUSES = ['all', 'new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

const OpsOrdersPage = () => {
  const { role, storeId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('ops-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter as any);
    if (role === 'store_manager' && storeId) query = query.eq('store_id', storeId);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const timestamp: Record<string, string> = {
      accepted: 'accepted_at',
      preparing: 'preparing_at',
      ready: 'ready_at',
      cancelled: 'cancelled_at',
    };
    const updates: any = { status: newStatus };
    if (timestamp[newStatus]) updates[timestamp[newStatus]] = new Date().toISOString();

    await supabase.from('orders').update(updates).eq('id', orderId);
  };

  const filtered = orders.filter(o =>
    !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Orders</h1>
        <div className="mt-2 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {ORDER_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              filter === s
                ? 'bg-secondary/20 text-secondary border-secondary/30'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          filtered.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{order.customer_name || 'Walk-in'} • {order.customer_phone || '-'}</p>
                <p className="text-foreground font-medium">₹{Number(order.total).toLocaleString()}</p>
              </div>

              {/* Action buttons based on status */}
              {(role === 'super_admin' || role === 'store_manager') && (
                <div className="flex gap-2">
                  {order.status === 'new' && (
                    <>
                      <button onClick={() => updateStatus(order.id, 'accepted')} className="flex-1 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-xs font-medium">Accept</button>
                      <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-xs font-medium">Cancel</button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium">Start Preparing</button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => updateStatus(order.id, 'assigned')} className="flex-1 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium">Assign Delivery</button>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsOrdersPage;
