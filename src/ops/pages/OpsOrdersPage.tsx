import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import DateRangeFilter, { DateRange, getDateRange } from '../components/DateRangeFilter';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Package, Phone, Printer, Clock, ChevronRight,
  MapPin, CreditCard, X, ArrowUp, ArrowDown,
  CheckCircle2, Flame, Truck, Timer, AlertTriangle
} from 'lucide-react';

/* ── Status Config ── */
const ORDER_STATUSES = ['all', 'new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  new: { icon: Package, label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  accepted: { icon: CheckCircle2, label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  preparing: { icon: Flame, label: 'Preparing', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  ready: { icon: Timer, label: 'Ready', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  assigned: { icon: Truck, label: 'Assigned', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  picked_up: { icon: Truck, label: 'Picked Up', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  out_for_delivery: { icon: Truck, label: 'Out for Delivery', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  delivered: { icon: CheckCircle2, label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  cancelled: { icon: X, label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  new: [
    { next: 'accepted', label: 'Accept', color: 'bg-emerald-500 text-white' },
    { next: 'cancelled', label: 'Cancel', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  ],
  accepted: [
    { next: 'preparing', label: 'Start Cooking', color: 'bg-orange-500 text-white' },
    { next: 'cancelled', label: 'Cancel', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  ],
  preparing: [{ next: 'ready', label: 'Mark Ready', color: 'bg-cyan-500 text-white' }],
  ready: [{ next: 'assigned', label: 'Assign Rider', color: 'bg-purple-500 text-white' }],
  assigned: [{ next: 'picked_up', label: 'Picked Up', color: 'bg-amber-500 text-white' }],
  picked_up: [{ next: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-500 text-white' }],
  out_for_delivery: [{ next: 'delivered', label: 'Delivered ✓', color: 'bg-green-500 text-white' }],
};

const TIMESTAMP_MAP: Record<string, string> = {
  accepted: 'accepted_at', preparing: 'preparing_at', ready: 'ready_at',
  assigned: 'assigned_at', picked_up: 'picked_up_at', out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at', cancelled: 'cancelled_at',
};

/* ── Timer thresholds (minutes) per status ── */
const URGENCY_THRESHOLDS: Record<string, { amber: number; red: number }> = {
  new: { amber: 2, red: 5 },
  accepted: { amber: 3, red: 7 },
  preparing: { amber: 25, red: 40 },
  ready: { amber: 5, red: 10 },
  assigned: { amber: 5, red: 10 },
  picked_up: { amber: 10, red: 20 },
  out_for_delivery: { amber: 25, red: 45 },
};

type Urgency = 'green' | 'amber' | 'red';

const getUrgency = (status: string, elapsedMins: number, prepTime?: number): Urgency => {
  const thresholds = URGENCY_THRESHOLDS[status];
  if (!thresholds) return 'green';
  const amber = status === 'preparing' && prepTime ? prepTime * 0.8 : thresholds.amber;
  const red = status === 'preparing' && prepTime ? prepTime * 1.3 : thresholds.red;
  if (elapsedMins >= red) return 'red';
  if (elapsedMins >= amber) return 'amber';
  return 'green';
};

const URGENCY_STYLES: Record<Urgency, { border: string; timer: string; pulse: boolean; glow: string }> = {
  green: { border: 'border-l-emerald-500', timer: 'text-emerald-400', pulse: false, glow: '' },
  amber: { border: 'border-l-amber-500', timer: 'text-amber-400', pulse: false, glow: 'shadow-amber-500/5' },
  red: { border: 'border-l-red-500', timer: 'text-red-400', pulse: true, glow: 'shadow-red-500/10 shadow-lg' },
};

const formatElapsed = (mins: number): string => {
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${Math.floor(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
};

const formatElapsedDetailed = (mins: number): string => {
  if (mins < 1) return '0:00';
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  const s = Math.floor((mins % 1) * 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const getStatusTimestamp = (order: any): string => {
  const map: Record<string, string> = {
    new: order.created_at,
    accepted: order.accepted_at || order.created_at,
    preparing: order.preparing_at || order.created_at,
    ready: order.ready_at || order.created_at,
    assigned: order.assigned_at || order.created_at,
    picked_up: order.picked_up_at || order.created_at,
    out_for_delivery: order.out_for_delivery_at || order.created_at,
    delivered: order.delivered_at || order.created_at,
    cancelled: order.cancelled_at || order.created_at,
  };
  return map[order.status] || order.created_at;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

/* ── Print functions ── */
const printKOT = (order: any, items: any[]) => {
  const win = window.open('', '_blank', 'width=300,height=600');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>KOT - ${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; padding: 8px; font-size: 12px; }
  .center { text-align: center; } .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .item { display: flex; justify-content: space-between; padding: 3px 0; }
  .qty { width: 40px; text-align: center; font-weight: bold; font-size: 14px; }
  h2 { font-size: 16px; margin: 4px 0; } .big { font-size: 18px; font-weight: bold; }
</style></head><body>
  <div class="center"><h2>*** KOT ***</h2><p class="bold">KITCHEN ORDER TICKET</p></div>
  <div class="line"></div>
  <div class="item"><span>Order #:</span><span class="bold">${order.order_number}</span></div>
  <div class="item"><span>Date:</span><span>${formatDateTime(order.created_at)}</span></div>
  <div class="item"><span>Type:</span><span class="bold">DELIVERY</span></div>
  <div class="line"></div>
  <div class="center big" style="margin:6px 0">ITEMS</div>
  <div class="line"></div>
  ${items.map((it, i) => `
    <div class="item"><span>${i + 1}. ${it.name}</span><span class="qty">x${it.quantity}</span></div>
    ${it.special_instructions ? `<div style="font-size:10px;color:#666;padding-left:16px;">Note: ${it.special_instructions}</div>` : ''}
  `).join('')}
  <div class="line"></div>
  ${order.special_instructions ? `<div style="background:#f0f0f0;padding:4px;font-style:italic;">Instructions: ${order.special_instructions}</div><div class="line"></div>` : ''}
  <div class="center" style="margin-top:8px;font-size:10px;">Printed: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
</body></html>`);
  win.document.close(); win.print();
};

const printDeliveryOrder = (order: any, items: any[]) => {
  const win = window.open('', '_blank', 'width=300,height=800');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Delivery - ${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; padding: 8px; font-size: 11px; }
  .center { text-align: center; } .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; }
  h2 { font-size: 14px; } .total-row { font-size: 14px; font-weight: bold; }
</style></head><body>
  <div class="center"><h2>BIRYAAN</h2><p style="font-size:10px;">Royal Biryani Experience</p></div>
  <div class="line"></div>
  <div class="center bold" style="font-size:13px;">DELIVERY ORDER</div>
  <div class="line"></div>
  <div class="row"><span>Order #:</span><span class="bold">${order.order_number}</span></div>
  <div class="row"><span>Date:</span><span>${formatDateTime(order.created_at)}</span></div>
  <div class="row"><span>Payment:</span><span>${(order.payment_method || 'COD').toUpperCase()} (${order.payment_status || 'pending'})</span></div>
  <div class="line"></div>
  <div class="bold">CUSTOMER</div>
  <div class="row"><span>Name:</span><span>${order.customer_name || 'Guest'}</span></div>
  <div class="row"><span>Phone:</span><span class="bold">${order.customer_phone || '-'}</span></div>
  ${order.house_number ? `<div class="row"><span>House #:</span><span>${order.house_number}</span></div>` : ''}
  ${order.customer_address ? `<div style="padding:2px 0;"><span>Addr: </span><span>${order.customer_address}</span></div>` : ''}
  <div class="line"></div>
  <div class="bold" style="margin-bottom:4px;">ITEMS</div>
  ${items.map((it, i) => `
    <div class="row"><span>${i + 1}. ${it.name} x${it.quantity}</span><span>₹${(Number(it.price) * it.quantity).toFixed(0)}</span></div>
  `).join('')}
  <div class="line"></div>
  <div class="row"><span>Subtotal</span><span>₹${Number(order.subtotal).toFixed(0)}</span></div>
  ${Number(order.discount) > 0 ? `<div class="row"><span>Discount</span><span>-₹${Number(order.discount).toFixed(0)}</span></div>` : ''}
  ${Number(order.tax) > 0 ? `<div class="row"><span>Tax</span><span>₹${Number(order.tax).toFixed(0)}</span></div>` : ''}
  <div class="line"></div>
  <div class="row total-row"><span>TOTAL</span><span>₹${Number(order.total).toFixed(0)}</span></div>
  <div class="line"></div>
  ${order.special_instructions ? `<div style="padding:4px 0;font-style:italic;font-size:10px;">Note: ${order.special_instructions}</div><div class="line"></div>` : ''}
  <div class="center" style="margin-top:8px;font-size:9px;">Thank you for ordering with Biryaan!<br/>Printed: ${new Date().toLocaleString('en-IN')}</div>
</body></html>`);
  win.document.close(); win.print();
};

/* ══════════════════════════════════════════════ */
/*                 MAIN COMPONENT                 */
/* ══════════════════════════════════════════════ */

const OpsOrdersPage = () => {
  const { role, storeId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [now, setNow] = useState(Date.now());
  const [prepTime, setPrepTime] = useState(30); // default prep time in minutes

  // Live timer tick every 10s for responsive urgency updates
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch store prep time
  useEffect(() => {
    supabase.from('stores').select('default_prep_time').eq('is_active', true).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.default_prep_time) setPrepTime(data.default_prep_time); });
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('ops-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter, dateRange, customFrom, customTo]);

  const fetchOrders = async () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);
    let query = supabase.from('orders').select('*')
      .gte('created_at', from).lte('created_at', to)
      .order('created_at', { ascending: true }); // oldest first
    if (filter !== 'all') query = query.eq('status', filter as any);
    if (role === 'store_manager' && storeId) query = query.eq('store_id', storeId);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleExpand = (orderId: string) => {
    if (expandedId === orderId) { setExpandedId(null); }
    else { setExpandedId(orderId); loadOrderItems(orderId); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (TIMESTAMP_MAP[newStatus]) updates[TIMESTAMP_MAP[newStatus]] = new Date().toISOString();
    await supabase.from('orders').update(updates).eq('id', orderId);
  };

  const filtered = orders.filter(o =>
    !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search)
  );

  // Status counts for summary
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const activeStatuses = ['new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery'];
  const activeCount = activeStatuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);

  const canAct = role === 'super_admin' || role === 'store_manager';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg text-gradient-gold">Orders</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeCount} active · {orders.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(statusCounts['new'] || 0) > 0 && (
              <span className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/25 rounded-full text-xs font-bold text-blue-400 animate-pulse">
                {statusCounts['new']} NEW
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
        </div>

        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange}
          customFrom={customFrom} customTo={customTo}
          onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo} />
      </div>

      {/* ── Status Summary Strip ── */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {ORDER_STATUSES.map(s => {
          const count = s === 'all' ? orders.length : (statusCounts[s] || 0);
          const isActive = filter === s;
          const config = s !== 'all' ? STATUS_CONFIG[s] : null;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-secondary/20 text-secondary border-secondary/30 scale-105'
                  : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'
              }`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              {count > 0 && (
                <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-secondary/30 text-secondary' : 'bg-muted text-muted-foreground'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Order Tiles ── */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs mt-1 opacity-60">Try adjusting your filters</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((order, index) => {
              const statusTs = getStatusTimestamp(order);
              const elapsedMs = now - new Date(statusTs).getTime();
              const elapsedMins = elapsedMs / 60000;
              const urgency = (order.status === 'delivered' || order.status === 'cancelled')
                ? 'green' as Urgency
                : getUrgency(order.status, elapsedMins, prepTime);
              const urgStyle = URGENCY_STYLES[urgency];
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
              const StatusIcon = config.icon;
              const actions = STATUS_FLOW[order.status] || [];
              const isExpanded = expandedId === order.id;
              const items = orderItems[order.id] || [];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className={`bg-card border border-border rounded-2xl overflow-hidden border-l-4 ${urgStyle.border} ${urgStyle.glow} transition-shadow`}
                >
                  {/* ── Tile Header ── */}
                  <button onClick={() => toggleExpand(order.id)} className="w-full text-left p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-base text-foreground">{order.order_number}</span>
                          <span className="font-heading text-base text-secondary">₹{Number(order.total).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-sm text-foreground font-medium truncate">{order.customer_name || 'Guest'}</span>
                          {order.customer_phone && (
                            <a href={`tel:${order.customer_phone}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-secondary hover:underline shrink-0">
                              <Phone size={10} /> {order.customer_phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Status + Timer */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${config.bg} ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </div>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div className={`flex items-center gap-1 text-xs font-mono ${urgStyle.timer} ${urgStyle.pulse ? 'animate-pulse' : ''}`}>
                            <Clock size={11} />
                            {formatElapsed(elapsedMins)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Quick Actions (always visible) ── */}
                    {actions.length > 0 && canAct && (
                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        {actions.map(a => (
                          <button key={a.next}
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, a.next); }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 ${a.color}`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* ── Expanded Details ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          {/* Customer & Address */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer</p>
                            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground font-semibold">{order.customer_name || 'Guest'}</span>
                                {order.customer_phone && (
                                  <a href={`tel:${order.customer_phone}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-bold">
                                    <Phone size={12} /> {order.customer_phone}
                                  </a>
                                )}
                              </div>
                              {(order.house_number || order.customer_address) && (
                                <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                                  <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground">
                                    {order.house_number ? `${order.house_number}, ` : ''}{order.customer_address || '-'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Items</p>
                            <div className="bg-muted/30 rounded-xl divide-y divide-border/50">
                              {items.length > 0 ? items.map(it => (
                                <div key={it.id} className="flex justify-between items-center px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary">
                                      {it.quantity}×
                                    </span>
                                    <span className="text-sm text-foreground">{it.name}</span>
                                  </div>
                                  <span className="text-sm font-heading text-muted-foreground">₹{Number(it.price) * it.quantity}</span>
                                </div>
                              )) : (
                                <div className="px-3 py-4 text-center text-xs text-muted-foreground">Loading items...</div>
                              )}
                            </div>
                          </div>

                          {/* Totals */}
                          <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Subtotal</span><span>₹{Number(order.subtotal)}</span>
                            </div>
                            {Number(order.discount) > 0 && (
                              <div className="flex justify-between text-xs text-green-400">
                                <span>Discount</span><span>-₹{Number(order.discount)}</span>
                              </div>
                            )}
                            {Number(order.tax) > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tax</span><span>₹{Number(order.tax)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-heading text-foreground pt-1.5 border-t border-border/50">
                              <span>Total</span><span className="text-secondary">₹{Number(order.total)}</span>
                            </div>
                            <div className="flex gap-4 text-[11px] text-muted-foreground pt-1">
                              <span className="flex items-center gap-1"><CreditCard size={10} /> {(order.payment_method || 'COD').toUpperCase()}</span>
                              <span className="capitalize">{order.payment_status || 'pending'}</span>
                            </div>
                          </div>

                          {/* Special Instructions */}
                          {order.special_instructions && (
                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Special Instructions</p>
                              <p className="text-xs text-foreground">{order.special_instructions}</p>
                            </div>
                          )}

                          {/* Timeline */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timeline</p>
                            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs">
                              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-foreground">{formatDateTime(order.created_at)}</span></div>
                              {order.accepted_at && <div className="flex justify-between"><span className="text-muted-foreground">Accepted</span><span className="text-foreground">{formatDateTime(order.accepted_at)}</span></div>}
                              {order.preparing_at && <div className="flex justify-between"><span className="text-muted-foreground">Preparing</span><span className="text-foreground">{formatDateTime(order.preparing_at)}</span></div>}
                              {order.ready_at && <div className="flex justify-between"><span className="text-muted-foreground">Ready</span><span className="text-foreground">{formatDateTime(order.ready_at)}</span></div>}
                              {order.assigned_at && <div className="flex justify-between"><span className="text-muted-foreground">Assigned</span><span className="text-foreground">{formatDateTime(order.assigned_at)}</span></div>}
                              {order.picked_up_at && <div className="flex justify-between"><span className="text-muted-foreground">Picked Up</span><span className="text-foreground">{formatDateTime(order.picked_up_at)}</span></div>}
                              {order.out_for_delivery_at && <div className="flex justify-between"><span className="text-muted-foreground">Out for Delivery</span><span className="text-foreground">{formatDateTime(order.out_for_delivery_at)}</span></div>}
                              {order.delivered_at && <div className="flex justify-between"><span className="text-emerald-400">Delivered</span><span className="text-emerald-400 font-medium">{formatDateTime(order.delivered_at)}</span></div>}
                              {order.cancelled_at && <div className="flex justify-between"><span className="text-red-400">Cancelled</span><span className="text-red-400 font-medium">{formatDateTime(order.cancelled_at)}</span></div>}
                            </div>
                          </div>

                          {/* Print Buttons */}
                          <div className="flex gap-2">
                            <button onClick={() => printKOT(order, items)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted/80 transition-colors active:scale-95">
                              <Printer size={14} /> Print KOT
                            </button>
                            <button onClick={() => printDeliveryOrder(order, items)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted/80 transition-colors active:scale-95">
                              <Printer size={14} /> Delivery Order
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsOrdersPage;
