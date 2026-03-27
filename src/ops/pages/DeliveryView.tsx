import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import StatusBadge from '../components/StatusBadge';
import { MapPin, Phone, Navigation, Package, CheckCircle } from 'lucide-react';

const DeliveryView = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (user) fetchDeliveries();
    const channel = supabase
      .channel('delivery-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => fetchDeliveries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, tab]);

  const fetchDeliveries = async () => {
    if (!user) return;
    let query = supabase
      .from('delivery_assignments')
      .select('*, orders(*)')
      .eq('delivery_partner_id', user.id)
      .order('created_at', { ascending: false });

    if (tab === 'active') {
      query = query.in('status', ['assigned', 'picked_up', 'out_for_delivery']);
    } else {
      query = query.eq('status', 'delivered');
    }

    const { data } = await query;
    setDeliveries(data || []);
    setLoading(false);
  };

  const updateDeliveryStatus = async (deliveryId: string, orderId: string, status: string) => {
    const now = new Date().toISOString();
    const deliveryUpdates: any = { status };
    const orderUpdates: any = { status };

    if (status === 'picked_up') {
      deliveryUpdates.picked_up_at = now;
      orderUpdates.picked_up_at = now;
    }
    if (status === 'out_for_delivery') {
      orderUpdates.out_for_delivery_at = now;
    }
    if (status === 'delivered') {
      deliveryUpdates.delivered_at = now;
      orderUpdates.delivered_at = now;
    }

    await Promise.all([
      supabase.from('delivery_assignments').update(deliveryUpdates).eq('id', deliveryId),
      supabase.from('orders').update(orderUpdates).eq('id', orderId),
    ]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">My Deliveries</h1>
        <div className="flex gap-2 mt-2">
          {(['active', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                tab === t ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-card text-muted-foreground border-border'
              }`}
            >
              {t === 'active' ? 'Active' : 'History'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-36 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-heading">{tab === 'active' ? 'No active deliveries' : 'No delivery history'}</p>
          </div>
        ) : (
          <AnimatePresence>
            {deliveries.map(d => {
              const order = d.orders;
              if (!order) return null;
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-secondary mt-0.5 shrink-0" />
                      <p className="text-foreground">{order.customer_address || 'No address'}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">₹{Number(order.total).toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs">{order.payment_method?.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Contact & Nav buttons */}
                  {tab === 'active' && (
                    <div className="flex gap-2">
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-xs font-medium">
                          <Phone size={14} /> Call
                        </a>
                      )}
                      {order.customer_address && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(order.customer_address)}`}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium"
                        >
                          <Navigation size={14} /> Navigate
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {tab === 'active' && (
                    <div>
                      {d.status === 'assigned' && (
                        <button onClick={() => updateDeliveryStatus(d.id, order.id, 'picked_up')} className="w-full py-3.5 bg-saffron/20 text-saffron border-2 border-saffron/40 rounded-xl text-sm font-heading tracking-wider">
                          📦 PICKED UP
                        </button>
                      )}
                      {d.status === 'picked_up' && (
                        <button onClick={() => updateDeliveryStatus(d.id, order.id, 'out_for_delivery')} className="w-full py-3.5 bg-blue-500/20 text-blue-400 border-2 border-blue-500/40 rounded-xl text-sm font-heading tracking-wider">
                          🚚 OUT FOR DELIVERY
                        </button>
                      )}
                      {d.status === 'out_for_delivery' && (
                        <button onClick={() => updateDeliveryStatus(d.id, order.id, 'delivered')} className="w-full py-3.5 bg-green-500/20 text-green-400 border-2 border-green-500/40 rounded-xl text-sm font-heading tracking-wider">
                          ✅ DELIVERED
                        </button>
                      )}
                    </div>
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

export default DeliveryView;
