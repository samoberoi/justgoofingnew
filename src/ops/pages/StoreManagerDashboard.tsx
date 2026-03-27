import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import { ShoppingBag, IndianRupee, Clock, AlertTriangle } from 'lucide-react';

const StoreManagerDashboard = () => {
  const { storeId } = useAuth();
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, activeOrders: 0, delayedOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('store-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (storeId) query = query.eq('store_id', storeId);
    const { data: orders } = await query;
    if (!orders) return;

    const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
    const activeStatuses = ['new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery'];
    const active = orders.filter(o => activeStatuses.includes(o.status));
    const delayed = active.filter(o => {
      const elapsed = (Date.now() - new Date(o.created_at).getTime()) / 60000;
      return elapsed > 20;
    });

    setStats({
      todayRevenue: todayOrders.reduce((s, o) => s + Number(o.total), 0),
      todayOrders: todayOrders.length,
      activeOrders: active.length,
      delayedOrders: delayed.length,
    });
    setRecentOrders(orders.slice(0, 10));
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    const tsMap: Record<string, string> = { accepted: 'accepted_at', preparing: 'preparing_at', ready: 'ready_at', cancelled: 'cancelled_at' };
    if (tsMap[newStatus]) updates[tsMap[newStatus]] = new Date().toISOString();
    await supabase.from('orders').update(updates).eq('id', orderId);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Store Manager</h1>
        <p className="text-xs text-muted-foreground">Today's Operations</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-400' },
            { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'text-secondary' },
            { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'text-yellow-400' },
            { label: 'Delayed', value: stats.delayedOrders, icon: AlertTriangle, color: 'text-destructive' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1"><s.icon size={14} className={s.color} /><span className="text-muted-foreground text-xs">{s.label}</span></div>
              <p className="font-heading text-lg text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {stats.delayedOrders > 0 && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <AlertTriangle size={18} className="text-destructive" />
            <span className="text-sm text-destructive">{stats.delayedOrders} delayed orders need attention!</span>
          </div>
        )}

        <div>
          <h2 className="font-heading text-sm text-foreground mb-3">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{order.customer_name || 'Walk-in'}</span>
                  <span className="text-foreground font-medium">₹{Number(order.total).toLocaleString()}</span>
                </div>
                {order.status === 'new' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(order.id, 'accepted')} className="flex-1 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-xs font-medium">Accept</button>
                    <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-3 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-xs font-medium">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default StoreManagerDashboard;
