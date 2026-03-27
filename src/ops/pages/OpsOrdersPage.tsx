import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import DateRangeFilter, { DateRange, getDateRange } from '../components/DateRangeFilter';
import { useAuth } from '../hooks/useAuth';
import { Search, ChevronDown, ChevronUp, Package, Phone, Printer } from 'lucide-react';

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
  preparing: [{ next: 'ready', label: 'Mark Ready', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }],
  ready: [{ next: 'assigned', label: 'Assign Delivery', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }],
  assigned: [{ next: 'picked_up', label: 'Picked Up', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }],
  picked_up: [{ next: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }],
  out_for_delivery: [{ next: 'delivered', label: 'Mark Delivered', color: 'bg-green-600/20 text-green-400 border-green-600/30' }],
};

const TIMESTAMP_MAP: Record<string, string> = {
  accepted: 'accepted_at', preparing: 'preparing_at', ready: 'ready_at',
  assigned: 'assigned_at', picked_up: 'picked_up_at', out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at', cancelled: 'cancelled_at',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

/** Print KOT – Kitchen Order Ticket (items only, no pricing) */
const printKOT = (order: any, items: any[]) => {
  const win = window.open('', '_blank', 'width=300,height=600');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>KOT - ${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; padding: 8px; font-size: 12px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .item { display: flex; justify-content: space-between; padding: 3px 0; }
  .item-name { flex: 1; }
  .qty { width: 40px; text-align: center; font-weight: bold; font-size: 14px; }
  h2 { font-size: 16px; margin: 4px 0; }
  .big { font-size: 18px; font-weight: bold; }
  .instructions { background: #f0f0f0; padding: 4px; margin-top: 4px; font-style: italic; }
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
    <div class="item">
      <span class="item-name">${i + 1}. ${it.name}</span>
      <span class="qty">x${it.quantity}</span>
    </div>
    ${it.special_instructions ? `<div style="font-size:10px;color:#666;padding-left:16px;">Note: ${it.special_instructions}</div>` : ''}
  `).join('')}
  <div class="line"></div>
  ${order.special_instructions ? `<div class="instructions">Instructions: ${order.special_instructions}</div><div class="line"></div>` : ''}
  <div class="center" style="margin-top:8px;font-size:10px;">
    Printed: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
  </div>
</body></html>`);
  win.document.close();
  win.print();
};

/** Print Delivery Order – Full invoice with customer details, pricing, address */
const printDeliveryOrder = (order: any, items: any[]) => {
  const win = window.open('', '_blank', 'width=300,height=800');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Delivery - ${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; padding: 8px; font-size: 11px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; }
  h2 { font-size: 14px; }
  .total-row { font-size: 14px; font-weight: bold; }
</style></head><body>
  <div class="center">
    <h2>BIRYAAN</h2>
    <p style="font-size:10px;">Royal Biryani Experience</p>
  </div>
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
    <div class="row">
      <span>${i + 1}. ${it.name} x${it.quantity}</span>
      <span>₹${(Number(it.price) * it.quantity).toFixed(0)}</span>
    </div>
  `).join('')}
  <div class="line"></div>
  <div class="row"><span>Subtotal</span><span>₹${Number(order.subtotal).toFixed(0)}</span></div>
  ${Number(order.discount) > 0 ? `<div class="row"><span>Discount</span><span>-₹${Number(order.discount).toFixed(0)}</span></div>` : ''}
  ${Number(order.tax) > 0 ? `<div class="row"><span>Tax</span><span>₹${Number(order.tax).toFixed(0)}</span></div>` : ''}
  <div class="line"></div>
  <div class="row total-row"><span>TOTAL</span><span>₹${Number(order.total).toFixed(0)}</span></div>
  <div class="line"></div>
  ${order.special_instructions ? `<div style="padding:4px 0;font-style:italic;font-size:10px;">Note: ${order.special_instructions}</div><div class="line"></div>` : ''}
  <div class="center" style="margin-top:8px;font-size:9px;">
    Thank you for ordering with Biryaan!<br/>
    Printed: ${new Date().toLocaleString('en-IN')}
  </div>
</body></html>`);
  win.document.close();
  win.print();
};

const OpsOrdersPage = () => {
  const { role, storeId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

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
      .order('created_at', { ascending: false });
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
    if (expanded === orderId) { setExpanded(null); } else { setExpanded(orderId); loadOrderItems(orderId); }
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
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg text-gradient-gold">Orders</h1>
          <span className="text-xs text-muted-foreground">{filtered.length} orders</span>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange}
          customFrom={customFrom} customTo={customTo}
          onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo} />
      </div>

      {/* Status filter chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {ORDER_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              filter === s ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-card text-muted-foreground border-border'
            }`}>
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
                <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-lg overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{order.customer_name || 'Guest'}</p>
                        {order.customer_phone && (
                          <a href={`tel:${order.customer_phone}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-secondary hover:underline">
                            <Phone size={10} />
                            {order.customer_phone}
                          </a>
                        )}
                      </div>
                      <span className="text-sm font-heading text-secondary">₹{Number(order.total).toLocaleString()}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-border">
                      <div className="p-4 space-y-3">
                        {/* Customer & Address */}
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Customer Details</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground font-medium">{order.customer_name || 'Guest'}</span>
                            {order.customer_phone && (
                              <a href={`tel:${order.customer_phone}`}
                                className="flex items-center gap-1.5 px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-medium">
                                <Phone size={12} /> Call {order.customer_phone}
                              </a>
                            )}
                          </div>
                          {(order.house_number || order.customer_address) && (
                            <div className="mt-1">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delivery Address</p>
                              <p className="text-xs text-foreground">
                                {order.house_number ? `${order.house_number}, ` : ''}{order.customer_address || '-'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase mb-1">Items</p>
                          {items.length > 0 ? items.map(it => (
                            <div key={it.id} className="flex justify-between text-xs py-1">
                              <span className="text-foreground">{it.name} × {it.quantity}</span>
                              <span className="text-muted-foreground">₹{Number(it.price) * it.quantity}</span>
                            </div>
                          )) : <p className="text-xs text-muted-foreground">Loading items...</p>}
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Subtotal:</span> <span className="text-foreground">₹{Number(order.subtotal)}</span></div>
                          {Number(order.discount) > 0 && <div><span className="text-muted-foreground">Discount:</span> <span className="text-green-500">-₹{Number(order.discount)}</span></div>}
                          {Number(order.tax) > 0 && <div><span className="text-muted-foreground">Tax:</span> <span className="text-foreground">₹{Number(order.tax)}</span></div>}
                          <div><span className="text-muted-foreground">Total:</span> <span className="text-foreground font-heading">₹{Number(order.total)}</span></div>
                          <div><span className="text-muted-foreground">Payment:</span> <span className="text-foreground">{(order.payment_method || 'COD').toUpperCase()}</span></div>
                          <div><span className="text-muted-foreground">Pay Status:</span> <span className="text-foreground">{order.payment_status || 'pending'}</span></div>
                        </div>

                        {order.special_instructions && (
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground uppercase">Special Instructions</p>
                            <p className="text-xs text-foreground">{order.special_instructions}</p>
                          </div>
                        )}

                        {/* Print buttons */}
                        <div className="flex gap-2">
                          <button onClick={() => printKOT(order, items)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
                            <Printer size={13} /> Print KOT
                          </button>
                          <button onClick={() => printDeliveryOrder(order, items)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
                            <Printer size={13} /> Print Delivery Order
                          </button>
                        </div>
                      </div>

                      {/* Status actions */}
                      {actions.length > 0 && (role === 'super_admin' || role === 'store_manager') && (
                        <div className="px-4 pb-4 flex gap-2">
                          {actions.map(a => (
                            <button key={a.next} onClick={() => updateStatus(order.id, a.next)}
                              className={`flex-1 py-2 border rounded-lg text-xs font-medium ${a.color}`}>
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
