import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { useAuth } from '../hooks/useAuth';
import { Clock, ChefHat, CheckCircle, AlertTriangle, Timer } from 'lucide-react';

const KitchenView = () => {
  const { storeId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderPrepTimes, setOrderPrepTimes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const prevCountRef = useRef(0);
  const defaultPrepTime = 30;

  // Tick every 10s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    let query = supabase.from('orders')
      .select('*, order_items(*, menu_items!order_items_menu_item_id_fkey(prep_time))')
      .in('status', ['accepted', 'preparing'])
      .order('created_at', { ascending: true });
    if (storeId) query = query.eq('store_id', storeId);
    const { data } = await query;
    const newOrders = data || [];

    // Compute per-order expected prep time from actual items
    const prepTimes: Record<string, number> = {};
    newOrders.forEach((order: any) => {
      const maxPrep = (order.order_items || []).reduce((max: number, item: any) => {
        const itemPrep = item.menu_items?.prep_time || defaultPrepTime;
        return Math.max(max, itemPrep);
      }, defaultPrepTime);
      prepTimes[order.id] = maxPrep;
    });
    setOrderPrepTimes(prepTimes);

    // Sound alert for new orders
    if (newOrders.length > prevCountRef.current && prevCountRef.current > 0) {
      try { new Audio('/notification.mp3').play().catch(() => {}); } catch {}
    }
    prevCountRef.current = newOrders.length;
    setOrders(newOrders);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    const updates: any = { status };
    if (status === 'preparing') updates.preparing_at = new Date().toISOString();
    if (status === 'ready') updates.ready_at = new Date().toISOString();
    await supabase.from('orders').update(updates).eq('id', orderId);
  };

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((now - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="text-secondary" size={22} />
            <h1 className="font-heading text-lg text-gradient-gold">Kitchen</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{orders.length} orders</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ChefHat size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-heading">All clear!</p>
            <p className="text-sm mt-1">No pending orders</p>
          </div>
        ) : (
          <AnimatePresence>
            {orders.map(order => {
              const expectedPrep = orderPrepTimes[order.id] || defaultPrepTime;
              const elapsed = getElapsedMinutes(order.created_at);
              const delayed = elapsed > expectedPrep;
              const isUrgent = delayed || elapsed > expectedPrep * 0.8;
              const isWarning = !isUrgent && elapsed > expectedPrep * 0.5;
              // Progress percentage towards expected prep time
              const progress = Math.min((elapsed / expectedPrep) * 100, 150);
              const formatTime = (m: number) => {
                if (m < 1) return '0:00';
                const h = Math.floor(m / 60);
                const mins = m % 60;
                return h > 0 ? `${h}:${String(mins).padStart(2, '0')}` : `${mins}m`;
              };
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-card border-2 rounded-xl p-4 space-y-3 ${delayed ? 'border-destructive/60' : isUrgent ? 'border-amber-500/50' : isWarning ? 'border-amber-500/30' : 'border-border'}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg text-foreground">{order.order_number}</span>
                      {delayed && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle size={10} /> DELAYED
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold font-mono ${delayed ? 'bg-destructive/20 text-destructive animate-pulse' : isUrgent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      <Clock size={14} />
                      {formatTime(elapsed)}
                    </div>
                  </div>

                  {/* Prep time progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Timer size={10} /> ETA: {expectedPrep}m</span>
                      <span>{delayed ? `+${elapsed - expectedPrep}m over` : `${Math.max(expectedPrep - elapsed, 0)}m left`}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${delayed ? 'bg-destructive' : progress > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {delayed && (
                    <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                      <AlertTriangle size={14} /> Exceeded prep time by {elapsed - expectedPrep}m — prioritize!
                    </div>
                  )}

                  {/* Items - big and bold */}
                  <div className="space-y-1.5">
                    {(order.order_items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-foreground font-bold text-base">{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special instructions */}
                  {order.special_instructions && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                      <p className="text-yellow-400 text-sm font-medium">⚠️ {order.special_instructions}</p>
                    </div>
                  )}

                  {/* Big action buttons */}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full py-4 bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 rounded-xl text-lg font-heading tracking-wider"
                    >
                      🍳 START PREPARING
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full py-4 bg-green-500/20 text-green-400 border-2 border-green-500/40 rounded-xl text-lg font-heading tracking-wider"
                    >
                      ✅ MARK READY
                    </button>
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

export default KitchenView;
