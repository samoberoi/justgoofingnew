import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';
import {
  MapPin, Phone, Navigation, Package, Clock, User,
  Home, ChevronRight, LogOut, History, Truck, ExternalLink, Power
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  status: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  orders: {
    id: string;
    order_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    house_number: string | null;
    total: number;
    payment_method: string | null;
    special_instructions: string | null;
    created_at: string;
    status: string;
    order_items?: { name: string; quantity: number }[];
  } | null;
}

const DeliveryView = () => {
  const { user, signOut } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availLoading, setAvailLoading] = useState(true);

  // Fetch availability status
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_roles')
      .select('is_available')
      .eq('user_id', user.id)
      .eq('role', 'delivery_partner' as any)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setIsAvailable(data?.is_available ?? false);
        setAvailLoading(false);
      });
  }, [user]);

  const toggleAvailability = async () => {
    if (!user) return;
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    await supabase
      .from('user_roles')
      .update({ is_available: newVal } as any)
      .eq('user_id', user.id)
      .eq('role', 'delivery_partner' as any);
  };

  // Live timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveries = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('delivery_assignments')
      .select('*, orders(*, order_items(name, quantity))')
      .eq('delivery_partner_id', user.id)
      .order('created_at', { ascending: false });

    if (tab === 'active') {
      query = query.in('status', ['assigned', 'picked_up', 'out_for_delivery']);
    } else {
      query = query.eq('status', 'delivered');
    }

    const { data } = await query;
    setDeliveries((data as any) || []);
    setLoading(false);
  }, [user, tab]);

  useEffect(() => {
    if (user) fetchDeliveries();
    const channel = supabase
      .channel('delivery-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => fetchDeliveries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDeliveries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, tab, fetchDeliveries]);

  const updateDeliveryStatus = async (deliveryId: string, orderId: string, status: string) => {
    setActionLoading(deliveryId);
    const ts = new Date().toISOString();
    const deliveryUpdates: any = { status };
    const orderUpdates: any = { status };

    if (status === 'picked_up') {
      deliveryUpdates.picked_up_at = ts;
      orderUpdates.picked_up_at = ts;
    }
    if (status === 'out_for_delivery') {
      orderUpdates.out_for_delivery_at = ts;
    }
    if (status === 'delivered') {
      deliveryUpdates.delivered_at = ts;
      orderUpdates.delivered_at = ts;
    }

    await Promise.all([
      supabase.from('delivery_assignments').update(deliveryUpdates).eq('id', deliveryId),
      supabase.from('orders').update(orderUpdates).eq('id', orderId),
    ]);
    setActionLoading(null);
  };

  const formatElapsed = (createdAt: string) => {
    const mins = (now - new Date(createdAt).getTime()) / 60000;
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${Math.floor(mins)}m ago`;
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h}h ${m}m ago`;
  };

  const getGoogleMapsUrl = (address: string, houseNumber?: string | null) => {
    const full = houseNumber ? `${houseNumber}, ${address}` : address;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(full)}`;
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const activeCount = deliveries.length;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg text-foreground flex items-center gap-2">
              <Truck size={20} className="text-secondary" /> My Deliveries
            </h1>
            {tab === 'active' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeCount} active {activeCount === 1 ? 'delivery' : 'deliveries'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Availability Toggle */}
            {!availLoading && (
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isAvailable
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}
              >
                <Power size={14} />
                {isAvailable ? 'Online' : 'Offline'}
              </button>
            )}
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tab === 'active'
                ? 'bg-secondary/15 text-secondary border-secondary/30'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            <Package size={16} /> Active
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tab === 'history'
                ? 'bg-secondary/15 text-secondary border-secondary/30'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            <History size={16} /> History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Package size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-heading text-lg">
              {tab === 'active' ? 'No active deliveries' : 'No delivery history yet'}
            </p>
            <p className="text-sm mt-1">
              {tab === 'active' ? 'New orders will appear here when assigned to you' : 'Your completed deliveries will show here'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {deliveries.map(d => {
              const order = d.orders;
              if (!order) return null;
              const isExpanded = expandedId === d.id;
              const isActive = tab === 'active';

              const statusColor = d.status === 'assigned'
                ? 'border-l-blue-500'
                : d.status === 'picked_up'
                ? 'border-l-yellow-500'
                : d.status === 'out_for_delivery'
                ? 'border-l-orange-500'
                : 'border-l-green-500';

              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`bg-card border border-border rounded-2xl overflow-hidden border-l-4 ${statusColor}`}
                >
                  {/* Card Header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={12} />
                        <span className="text-xs">{formatElapsed(order.created_at)}</span>
                        <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Customer name + total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-secondary shrink-0" />
                        <span className="text-sm text-foreground font-medium truncate">
                          {order.customer_name || 'Customer'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-heading text-foreground">₹{Number(order.total).toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{order.payment_method?.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Address preview */}
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin size={14} className="text-secondary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {order.house_number ? `${order.house_number}, ` : ''}{order.customer_address || 'No address'}
                      </p>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          {/* Full Address */}
                          <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-medium text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Home size={12} className="text-secondary" /> Delivery Address
                            </p>
                            {order.house_number && (
                              <p className="text-sm text-foreground font-medium">
                                House/Flat: {order.house_number}
                              </p>
                            )}
                            <p className="text-sm text-foreground">
                              {order.customer_address || 'No address provided'}
                            </p>
                          </div>

                          {/* Customer Phone */}
                          {order.customer_phone && (
                            <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-secondary" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Customer Phone</p>
                                  <p className="text-sm text-foreground font-medium">{order.customer_phone}</p>
                                </div>
                              </div>
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl text-xs font-medium flex items-center gap-1.5"
                                onClick={e => e.stopPropagation()}
                              >
                                <Phone size={12} /> Call
                              </a>
                            </div>
                          )}

                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="bg-muted/30 rounded-xl p-3">
                              <p className="text-xs font-medium text-foreground uppercase tracking-wider mb-2">Order Items</p>
                              <div className="space-y-1">
                                {order.order_items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-foreground">{item.name}</span>
                                    <span className="text-muted-foreground">×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Special Instructions */}
                          {order.special_instructions && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                              <p className="text-xs font-medium text-yellow-500 uppercase tracking-wider mb-1">Special Instructions</p>
                              <p className="text-sm text-foreground">{order.special_instructions}</p>
                            </div>
                          )}

                          {/* Navigate Button — prominent */}
                          {isActive && order.customer_address && (
                            <a
                              href={getGoogleMapsUrl(order.customer_address, order.house_number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-500/15 text-blue-400 border-2 border-blue-500/30 rounded-xl text-sm font-heading tracking-wider"
                              onClick={e => e.stopPropagation()}
                            >
                              <Navigation size={18} /> OPEN IN GOOGLE MAPS <ExternalLink size={14} />
                            </a>
                          )}

                          {/* Action Buttons */}
                          {isActive && (
                            <div className="pt-1">
                              {d.status === 'assigned' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(d.id, order.id, 'picked_up'); }}
                                  disabled={actionLoading === d.id}
                                  className="w-full py-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-400 border-2 border-yellow-500/40 rounded-xl text-sm font-heading tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  📦 MARK AS PICKED UP
                                </button>
                              )}
                              {d.status === 'picked_up' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(d.id, order.id, 'out_for_delivery'); }}
                                  disabled={actionLoading === d.id}
                                  className="w-full py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border-2 border-blue-500/40 rounded-xl text-sm font-heading tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  🚚 START DELIVERY
                                </button>
                              )}
                              {d.status === 'out_for_delivery' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(d.id, order.id, 'delivered'); }}
                                  disabled={actionLoading === d.id}
                                  className="w-full py-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 border-2 border-green-500/40 rounded-xl text-sm font-heading tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  ✅ MARK AS DELIVERED
                                </button>
                              )}
                            </div>
                          )}

                          {/* History details */}
                          {!isActive && d.delivered_at && (
                            <div className="text-xs text-muted-foreground text-center">
                              Delivered at {new Date(d.delivered_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          )}
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
    </div>
  );
};

export default DeliveryView;
