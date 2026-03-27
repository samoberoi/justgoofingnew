import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import {
  IndianRupee, ShoppingBag, TrendingUp, Clock,
  Store, Users, AlertTriangle
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();

    // Real-time subscription for orders
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDashboard = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [ordersRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total, status, created_at'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const orders = ordersRes.data || [];
    const activeStatuses = ['new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery'];

    setStats({
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      totalOrders: orders.length,
      activeOrders: orders.filter(o => activeStatuses.includes(o.status)).length,
      todayOrders: orders.filter(o => o.created_at?.startsWith(today)).length,
    });

    setRecentOrders(recentRes.data || []);
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-400' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-secondary' },
    { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'text-yellow-400' },
    { label: "Today's Orders", value: stats.todayOrders, icon: TrendingUp, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg text-gradient-gold">Super Admin</h1>
            <p className="text-muted-foreground text-xs">Command Center</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-muted-foreground text-xs">{stat.label}</span>
              </div>
              <p className="font-heading text-xl text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Alerts */}
        {stats.activeOrders > 5 && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <AlertTriangle size={18} className="text-destructive" />
            <span className="text-sm text-destructive">{stats.activeOrders} orders in pipeline — monitor delays</span>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <h2 className="font-heading text-sm text-foreground mb-3">Recent Orders</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.customer_name || 'Walk-in'}</span>
                    <span className="font-medium text-foreground">₹{Number(order.total).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default SuperAdminDashboard;
