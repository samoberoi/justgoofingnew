import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const STAGES = [
  { status: 'new', label: 'Order Placed', emoji: '📝', desc: 'Your dawat request has been received' },
  { status: 'accepted', label: 'Accepted', emoji: '✅', desc: 'The royal kitchen has accepted your order' },
  { status: 'preparing', label: 'Dum Ceremony', emoji: '🔥', desc: 'Your biryani is being prepared with love' },
  { status: 'ready', label: 'Fragrance Rises', emoji: '✨', desc: 'Your biryani is ready and packed' },
  { status: 'assigned', label: 'Rider Assigned', emoji: '🏇', desc: 'A royal rider has been assigned' },
  { status: 'picked_up', label: 'Picked Up', emoji: '📦', desc: 'Your order has been picked up' },
  { status: 'out_for_delivery', label: 'On the Way', emoji: '🛵', desc: 'Your royal feast is en route' },
  { status: 'delivered', label: 'Delivered', emoji: '👑', desc: 'Enjoy your dawat!' },
];

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as any)?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      setOrder(data);
      setLoading(false);
    };
    fetchOrder();

    const channel = supabase
      .channel(`track-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Package size={48} className="text-muted-foreground mb-4" />
        <h2 className="font-heading text-lg text-foreground">No order to track</h2>
        <button onClick={() => navigate('/home')} className="mt-4 px-6 py-3 bg-gradient-saffron rounded-lg font-heading text-sm text-primary-foreground">
          Browse Menu
        </button>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex(s => s.status === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/home')}><ArrowLeft size={20} className="text-foreground" /></button>
          <div>
            <h1 className="font-heading text-lg text-foreground">Track Order</h1>
            <p className="text-[10px] text-muted-foreground">{order.order_number}</p>
          </div>
        </div>
      </header>

      {isCancelled ? (
        <div className="px-6 pt-16 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="font-heading text-xl text-destructive">Order Cancelled</h2>
          <p className="text-sm text-muted-foreground mt-2">This order has been cancelled</p>
          <button onClick={() => navigate('/home')} className="mt-6 px-6 py-3 bg-gradient-saffron rounded-lg font-heading text-sm text-primary-foreground">
            Order Again
          </button>
        </div>
      ) : (
        <div className="px-6 pt-8">
          <div className="space-y-0">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={stage.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={isCurrent ? { scale: 0 } : {}}
                      animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                      transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                        isCompleted ? 'bg-secondary/20' : 'bg-muted'
                      }`}
                    >
                      {stage.emoji}
                    </motion.div>
                    {idx < STAGES.length - 1 && (
                      <div className={`w-0.5 h-12 ${idx < currentIdx ? 'bg-secondary' : 'bg-border'}`} />
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <h3 className={`font-heading text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {stage.label}
                      {isCurrent && <span className="text-secondary ml-2 text-[10px]">● Current</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
