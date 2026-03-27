import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import {
  IndianRupee, ShoppingBag, TrendingUp, Clock,
  Store, Users, ChefHat, Truck, Shield, UtensilsCrossed,
  Layers, Tag, Crown, AlertTriangle, Calendar, ChevronDown,
  ChevronRight, Percent
} from 'lucide-react';

type DateRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom';

const DATE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

const getDateRange = (range: DateRange, customFrom?: string, customTo?: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return { from: today.toISOString(), to: now.toISOString() };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y.toISOString(), to: today.toISOString() };
    }
    case 'this_week': {
      const dow = today.getDay();
      const monday = new Date(today);
      monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
      return { from: monday.toISOString(), to: now.toISOString() };
    }
    case 'last_week': {
      const dow = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(thisMonday.getDate() - (dow === 0 ? 6 : dow - 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      return { from: lastMonday.toISOString(), to: thisMonday.toISOString() };
    }
    case 'this_month': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstOfMonth.toISOString(), to: now.toISOString() };
    }
    case 'custom':
      return {
        from: customFrom ? new Date(customFrom).toISOString() : today.toISOString(),
        to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : now.toISOString(),
      };
  }
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [orderStats, setOrderStats] = useState({ revenue: 0, total: 0, active: 0, delivered: 0, cancelled: 0, avgOrder: 0, totalDiscount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [menuStats, setMenuStats] = useState({ categories: 0, items: 0, activeItems: 0, variants: 0 });
  const [teamStats, setTeamStats] = useState({ superAdmins: 0, storeManagers: 0, kitchenManagers: 0, deliveryPartners: 0 });
  const [storeCount, setStoreCount] = useState(0);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; phone: string; orders: number; spent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrderStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dateRange, customFrom, customTo]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchOrderStats(), fetchMenuStats(), fetchTeamStats(), fetchStoreStats(), fetchTopSellers(), fetchTopCustomers()]);
    setLoading(false);
  };

  const fetchOrderStats = async () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);

    const [ordersRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total, status, created_at, discount').gte('created_at', from).lte('created_at', to),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const orders = ordersRes.data || [];
    const activeStatuses = ['new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery'];
    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

    setOrderStats({
      revenue,
      total: orders.length,
      active: orders.filter(o => activeStatuses.includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      avgOrder: orders.length > 0 ? Math.round(revenue / orders.length) : 0,
      totalDiscount,
    });
    setRecentOrders(recentRes.data || []);
  };

  const fetchMenuStats = async () => {
    const [cats, items, variants] = await Promise.all([
      supabase.from('menu_categories').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id, is_active', { count: 'exact' }),
      supabase.from('menu_variants').select('id', { count: 'exact', head: true }),
    ]);
    const allItems = items.data || [];
    setMenuStats({
      categories: cats.count || 0,
      items: allItems.length,
      activeItems: allItems.filter(i => i.is_active).length,
      variants: variants.count || 0,
    });
  };

  const fetchTeamStats = async () => {
    const { data } = await supabase.from('user_roles').select('role').eq('is_active', true);
    const roles = data || [];
    setTeamStats({
      superAdmins: roles.filter(r => r.role === 'super_admin').length,
      storeManagers: roles.filter(r => r.role === 'store_manager').length,
      kitchenManagers: roles.filter(r => r.role === 'kitchen_manager').length,
      deliveryPartners: roles.filter(r => r.role === 'delivery_partner').length,
    });
  };

  const fetchStoreStats = async () => {
    const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true });
    setStoreCount(count || 0);
  };

  const fetchTopSellers = async () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);
    // Get order IDs in the date range first
    const { data: rangeOrders } = await supabase.from('orders').select('id').gte('created_at', from).lte('created_at', to);
    if (!rangeOrders || rangeOrders.length === 0) { setTopSellers([]); return; }

    const orderIds = rangeOrders.map(o => o.id);
    const { data: orderItems } = await supabase.from('order_items').select('menu_item_id, name, quantity, price').in('order_id', orderIds);
    if (!orderItems || orderItems.length === 0) { setTopSellers([]); return; }

    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orderItems.forEach(oi => {
      const key = oi.menu_item_id || oi.name;
      const existing = map.get(key) || { name: oi.name, qty: 0, revenue: 0 };
      existing.qty += oi.quantity;
      existing.revenue += Number(oi.price) * oi.quantity;
      map.set(key, existing);
    });

    setTopSellers(Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5));
  };

  const fetchTopCustomers = async () => {
    const { data: orders } = await supabase.from('orders').select('customer_name, customer_phone, total');
    if (!orders) return;
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number }>();
    orders.forEach(o => {
      const key = o.customer_phone || o.customer_name || 'unknown';
      const existing = map.get(key);
      if (existing) { existing.orders += 1; existing.spent += Number(o.total); }
      else { map.set(key, { name: o.customer_name || 'Guest', phone: o.customer_phone || '-', orders: 1, spent: Number(o.total) }); }
    });
    setTopCustomers(Array.from(map.values()).sort((a, b) => b.spent - a.spent).slice(0, 10));
  };

  const selectedLabel = DATE_OPTIONS.find(d => d.key === dateRange)?.label || 'Today';
  const totalTeam = teamStats.superAdmins + teamStats.storeManagers + teamStats.kitchenManagers + teamStats.deliveryPartners;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg text-gradient-gold">Command Center</h1>
            <p className="text-muted-foreground text-[10px]">Super Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Date Range Selector */}
        <div className="relative">
          <button onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground">
            <Calendar size={14} className="text-secondary" />
            <span>{selectedLabel}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showDatePicker && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 p-2">
              <div className="grid grid-cols-3 gap-1">
                {DATE_OPTIONS.filter(d => d.key !== 'custom').map(d => (
                  <button key={d.key} onClick={() => { setDateRange(d.key); setShowDatePicker(false); }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${dateRange === d.key ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground hover:bg-muted'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-[10px] text-muted-foreground mb-1">Custom Range</p>
                <div className="flex gap-2">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-xs text-foreground" />
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-xs text-foreground" />
                </div>
                <button onClick={() => { setDateRange('custom'); setShowDatePicker(false); }}
                  className="w-full mt-2 py-1.5 bg-secondary/20 text-secondary rounded-lg text-xs font-medium">Apply Custom</button>
              </div>
            </motion.div>
          )}
        </div>

        {/* ===== ORDERS & REVENUE ===== */}
        <div>
          <button onClick={() => navigate('/ops-orders')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={12} /> Orders & Revenue
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Revenue', value: `₹${orderStats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Total Orders', value: orderStats.total, icon: ShoppingBag, color: 'text-secondary', bg: 'bg-secondary/10' },
              { label: 'Active', value: orderStats.active, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Delivered', value: orderStats.delivered, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/ops-orders')}
                className="bg-card border border-border rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="font-heading text-lg text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>
          {/* Avg Order & Discounts row */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {orderStats.avgOrder > 0 && (
              <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Avg Order</span>
                <span className="font-heading text-sm text-secondary">₹{orderStats.avgOrder}</span>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Percent size={12} className="text-orange-400" />
                <span className="text-[10px] text-muted-foreground">Discounts</span>
              </div>
              <span className="font-heading text-sm text-orange-400">₹{orderStats.totalDiscount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* ===== TOP SELLERS ===== */}
        <div>
          <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} /> Top Sellers
          </h2>
          {topSellers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-xs text-muted-foreground">No order data yet — top sellers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topSellers.map((item, idx) => (
                <motion.div key={item.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading text-sm ${
                    idx === 0 ? 'bg-secondary/20 text-secondary' : idx === 1 ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.qty} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-heading text-secondary">₹{item.revenue.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ===== MENU SECTION ===== */}
        <div>
          <button onClick={() => navigate('/menu')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed size={12} /> Menu Overview
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Categories', value: menuStats.categories, icon: Layers, color: 'text-purple-400' },
              { label: 'Items', value: menuStats.items, icon: UtensilsCrossed, color: 'text-secondary' },
              { label: 'Active', value: menuStats.activeItems, icon: Tag, color: 'text-green-400' },
              { label: 'Variants', value: menuStats.variants, icon: Crown, color: 'text-yellow-400' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => navigate('/menu')}
                className="bg-card border border-border rounded-xl p-3 text-center cursor-pointer active:scale-[0.98] transition-transform">
                <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
                <p className="font-heading text-lg text-foreground">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ===== STORES SECTION ===== */}
        <div>
          <button onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Store size={12} /> Stores
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={() => navigate('/settings')}
            className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Store size={22} className="text-secondary" />
            </div>
            <div>
              <p className="font-heading text-2xl text-foreground">{storeCount}</p>
              <p className="text-xs text-muted-foreground">Active Store{storeCount !== 1 ? 's' : ''}</p>
            </div>
          </motion.div>
        </div>

        {/* ===== TEAM SECTION ===== */}
        <div>
          <button onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} /> Team ({totalTeam})
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Super Admins', value: teamStats.superAdmins, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Store Managers', value: teamStats.storeManagers, icon: Store, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Kitchen Staff', value: teamStats.kitchenManagers, icon: ChefHat, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Delivery Partners', value: teamStats.deliveryPartners, icon: Truck, color: 'text-green-400', bg: 'bg-green-500/10' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                onClick={() => navigate('/settings')}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <div>
                  <p className="font-heading text-lg text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ===== TOP CUSTOMERS ===== */}
        <div>
          <button onClick={() => navigate('/customers')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} /> Top 10 Customers
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          {topCustomers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-xs text-muted-foreground">No customer data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c, idx) => (
                <motion.div key={c.phone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading text-sm ${
                    idx === 0 ? 'bg-secondary/20 text-secondary' : idx === 1 ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.phone} • {c.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-heading text-secondary">₹{c.spent.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ===== ALERTS ===== */}
        {orderStats.active > 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-3">
            <AlertTriangle size={18} className="text-destructive shrink-0" />
            <span className="text-sm text-destructive">{orderStats.active} orders in pipeline — monitor delays</span>
          </motion.div>
        )}

        {/* ===== RECENT ORDERS ===== */}
        <div>
          <button onClick={() => navigate('/ops-orders')}
            className="w-full flex items-center justify-between mb-2">
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={12} /> Recent Orders
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
          {recentOrders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <ShoppingBag size={32} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <motion.div key={order.id} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/ops-orders')}
                  className="bg-card border border-border rounded-xl p-3 cursor-pointer active:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.customer_name || 'Guest'} {order.customer_phone ? `• ${order.customer_phone}` : ''}</span>
                    <span className="font-medium text-foreground">₹{Number(order.total).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Percent size={10} className="text-orange-400" />
                      <span className="text-[10px] text-orange-400">Discount: ₹{Number(order.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
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
