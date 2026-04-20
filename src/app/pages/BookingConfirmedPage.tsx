import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Clock, Users, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreSelection } from '../hooks/useStoreSelection';

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
        <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-12 px-6 pb-24">
      {/* Confetti */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 0.7, 0.7, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-2 h-2 rounded-sm pointer-events-none"
          style={{ background: ['#FFD700', '#FF6B9D', '#4ECDC4', '#FFA940', '#7CFC00'][i % 5] }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4"
      >
        <CheckCircle2 size={40} className="text-green-500" />
      </motion.div>

      <h1 className="font-heading text-2xl text-gradient-gold text-center">Booking Confirmed!</h1>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        See you at Just Goofing 🎉
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 w-full max-w-md bg-card border border-border rounded-2xl p-5 space-y-3"
      >
        <div className="text-center pb-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Booking ID</p>
          <p className="font-heading text-lg text-secondary">{booking.booking_number}</p>
        </div>

        <div className="space-y-2.5">
          <p className="font-heading text-base text-foreground">{booking.package_name}</p>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar size={14} className="text-secondary" />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock size={14} className="text-secondary" />
            {String(booking.slot_time).slice(0, 5)}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Users size={14} className="text-secondary" />
            {booking.num_kids} {booking.num_kids === 1 ? 'kid' : 'kids'}
          </div>
          {selectedStore?.address && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin size={12} className="text-secondary mt-0.5 shrink-0" />
              {selectedStore.address}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pay at venue</span>
            <span className="font-heading text-lg text-secondary">₹{Number(booking.total_amount)}</span>
          </div>
          {booking.is_free_welcome && (
            <p className="text-[10px] text-green-500 mt-1">🎉 Welcome offer applied — FREE!</p>
          )}
        </div>

        <div className="bg-muted rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Show this code at the counter</p>
          <p className="font-mono text-sm text-foreground tracking-widest">{booking.qr_code}</p>
        </div>
      </motion.div>

      <div className="mt-6 w-full max-w-md flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/orders')}
          className="w-full py-3.5 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-wider text-primary-foreground shadow-saffron flex items-center justify-center gap-2"
        >
          View My Bookings <ArrowRight size={14} />
        </motion.button>
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmedPage;
