import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Clock, Users, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreSelection } from '../hooks/useStoreSelection';
import Icon3D from '../components/Icon3D';

const BookingConfirmedPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { selectedStore } = useStoreSelection();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!bookingId) return;
      const { data } = await supabase.from('bookings' as any).select('*').eq('id', bookingId).maybeSingle();
      setBooking(data);
    };
    fetch();
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-10 px-5 pb-24 relative overflow-hidden">
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 1, 1, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-2.5 h-2.5 rounded-sm pointer-events-none"
          style={{ background: ['hsl(var(--coral))', 'hsl(var(--mint))', 'hsl(var(--butter))', 'hsl(var(--lavender))'][i % 4] }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="w-24 h-24 rounded-3xl bg-mint flex items-center justify-center mb-4 shadow-pop-mint relative z-10"
      >
        <CheckCircle2 size={44} className="text-ink" strokeWidth={2.5} />
      </motion.div>

      <h1 className="font-display text-3xl text-ink text-center -tracking-wide relative z-10">Booking confirmed!</h1>
      <p className="text-sm text-muted-foreground mt-2 text-center font-heading relative z-10">See you at Just Goofing 🎉</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 w-full max-w-md bg-card rounded-[28px] p-5 space-y-4 shadow-pop border border-border relative z-10"
      >
        <div className="text-center pb-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-heading">Booking ID</p>
          <p className="font-display text-2xl text-coral mt-1">{booking.booking_number}</p>
        </div>

        <div className="space-y-3">
          <p className="font-display text-base text-ink">{booking.package_name}</p>
          <div className="flex items-center gap-2 text-sm text-ink font-heading">
            <Calendar size={14} className="text-coral" strokeWidth={2.5} />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink font-heading">
            <Clock size={14} className="text-mint" strokeWidth={2.5} />
            {String(booking.slot_time).slice(0, 5)}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink font-heading">
            <Users size={14} className="text-butter" strokeWidth={2.5} />
            {booking.num_kids} {booking.num_kids === 1 ? 'kid' : 'kids'}
          </div>
          {selectedStore?.name && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground font-heading">
              <MapPin size={12} className="text-grape mt-0.5 shrink-0" strokeWidth={2.5} />
              {selectedStore.name}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-heading">Pay at venue</span>
            <span className="font-display text-xl text-ink">₹{Number(booking.total_amount)}</span>
          </div>
          {booking.is_free_welcome && (
            <p className="text-[11px] text-mint mt-1 font-display">Welcome offer applied — FREE!</p>
          )}
        </div>

        <div className="bg-butter rounded-2xl p-4 flex items-center gap-3">
          <Icon3D name="qr" size={44} alt="" />
          <div>
            <p className="text-[10px] text-ink/70 uppercase tracking-wider font-heading">Show at counter</p>
            <p className="font-display text-base text-ink tracking-widest mt-0.5">{booking.qr_code}</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 w-full max-w-md flex flex-col gap-2 relative z-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/orders')}
          className="w-full py-3.5 bg-ink rounded-full font-display text-sm text-white flex items-center justify-center gap-2"
        >
          View bookings <ArrowRight size={14} strokeWidth={2.5} />
        </motion.button>
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 text-sm text-muted-foreground font-heading"
        >
          Back to home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmedPage;
