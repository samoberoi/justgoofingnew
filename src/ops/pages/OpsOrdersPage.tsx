import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react';

const ORDER_STATUSES = ['all', 'new', 'accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  new: [
    { next: 'accepted', label: 'Accept Order', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
    { next: 'cancelled', label: 'Cancel', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  ],
  accepted: [
    { next: 'preparing', label: 'Start Preparing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { next: 'cancelled', label: 'Cancel', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  ],
  preparing: [
    { next: 'ready', label: 'Mark Ready', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ],
  ready: [
    { next: 'assigned', label: 'Assign Delivery', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ],
  assigned: [
    { next: 'picked_up', label: 'Picked Up', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ],
  picked_up: [
    { next: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  ],
  out_for_delivery: [
    { next: 'delivered', label: 'Mark Delivered', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
  ],
};

const TIMESTAMP_MAP: Record<string, string> = {
  accepted: 'accepted_at',
  preparing: 'preparing_at',
  ready: 'ready_at',
  assigned: 'assigned_at',
  picked_up: 'picked_up_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
};

const OpsOrdersPage = () => {
  const { role, storeId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('ops-orders-live')
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

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleExpand = (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
    } else {
      setExpanded(orderId);
      loadOrderItems(orderId);
    }
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

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg text-gradient-gold">Orders</h1>
          <span className="text-xs text-muted-foreground">{orders.length} total</span>
        </div>
        <div className="mt-2 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone..."
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
              filter === s ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(order => {
              const actions = STATUS_FLOW[order.status] || [];
              const isExpanded = expanded === order.id;
              const items = orderItems[order.id] || [];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button onClick={() => toggleExpand(order.id)} className="w-full p-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{order.customer_name || 'Guest'} • {order.customer_phone || '-'}</p>
                      <span className="text-sm font-heading text-secondary">₹{Number(order.total).toLocaleString()}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-border">
                      {/* Order details */}
                      <div className="p-4 space-y-3">
                        {order.customer_address && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Delivery Address</p>
                            <p className="text-xs text-foreground">{order.customer_address}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase mb-1">Items</p>
                          {items.length > 0 ? items.map(it => (
                            <div key={it.id} className="flex justify-between text-xs py-1">
                              <span className="text-foreground">{it.name} × {it.quantity}</span>
                              <span className="text-muted-foreground">₹{Number(it.price) * it.quantity}</span>
                            </div>
                          )) : (
                            <p className="text-xs text-muted-foreground">Loading items...</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Subtotal:</span> <span className="text-foreground">₹{Number(order.subtotal)}</span></div>
                          {Number(order.discount) > 0 && <div><span className="text-muted-foreground">Discount:</span> <span className="text-green-500">-₹{Number(order.discount)}</span></div>}
                          <div><span className="text-muted-foreground">Payment:</span> <span className="text-foreground">{order.payment_method?.toUpperCase()}</span></div>
                          <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground">{order.payment_status}</span></div>
                        </div>

                        {order.special_instructions && (
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground uppercase">Special Instructions</p>
                            <p className="text-xs text-foreground">{order.special_instructions}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {actions.length > 0 && (role === 'super_admin' || role === 'store_manager') && (
                        <div className="px-4 pb-4 flex gap-2">
                          {actions.map(a => (
                            <button
                              key={a.next}
                              onClick={() => updateStatus(order.id, a.next)}
                              className={`flex-1 py-2 border rounded-lg text-xs font-medium ${a.color}`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
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
