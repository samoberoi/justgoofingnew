import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Clock, Users, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { Star, Sparkle, Heart, Confetti } from '../components/Stickers';

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
    <div className="min-h-screen bg-background bg-confetti flex flex-col items-center justify-start pt-12 px-6 pb-24 relative overflow-hidden">
      {/* Confetti animation */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 1, 1, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-2.5 h-2.5 rounded-sm pointer-events-none"
          style={{ background: ['#FF7A8A', '#7DD3C0', '#FFD56B', '#B8A5E3', '#FFA3D1'][i % 5] }}
        />
      ))}

      <Star className="absolute top-16 left-8 w-10 h-10 text-butter opacity-60 animate-wobble" />
      <Heart className="absolute top-32 right-10 w-9 h-9 text-bubblegum opacity-60 animate-bounce-soft" />

      <motion.div
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="w-24 h-24 rounded-3xl bg-gradient-mint flex items-center justify-center mb-4 shadow-pop-mint"
      >
        <CheckCircle2 size={44} className="text-white" />
      </motion.div>

      <h1 className="font-display text-3xl text-ink text-center">Booking Confirmed! 🎉</h1>
      <p className="text-sm text-ink/60 mt-2 text-center">See you at Just Goofing!</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 w-full max-w-md bg-card border-2 border-ink/8 rounded-3xl p-5 space-y-4 shadow-pop relative overflow-hidden"
      >
        <Confetti className="absolute top-2 right-2 w-8 h-8 text-coral opacity-40" />

        <div className="text-center pb-3 border-b-2 border-ink/5">
          <p className="text-[10px] text-ink/55 uppercase tracking-wider font-heading">Booking ID</p>
          <p className="font-display text-2xl text-coral">{booking.booking_number}</p>
        </div>

        <div className="space-y-2.5">
          <p className="font-display text-base text-ink">{booking.package_name}</p>
          <div className="flex items-center gap-2 text-sm text-ink">
            <Calendar size={14} className="text-coral" />
            {new Date(booking.booking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink">
            <Clock size={14} className="text-mint" />
            {String(booking.slot_time).slice(0, 5)}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink">
            <Users size={14} className="text-butter" />
            {booking.num_kids} {booking.num_kids === 1 ? 'kid' : 'kids'}
          </div>
          {selectedStore?.name && (
            <div className="flex items-start gap-2 text-xs text-ink/60">
              <MapPin size={12} className="text-grape mt-0.5 shrink-0" />
              {selectedStore.name}
            </div>
          )}
        </div>

        <div className="border-t-2 border-ink/5 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink/60">Pay at venue</span>
            <span className="font-display text-xl text-ink">₹{Number(booking.total_amount)}</span>
          </div>
          {booking.is_free_welcome && (
            <p className="text-[11px] text-mint mt-1 font-heading">🎉 Welcome offer applied — FREE!</p>
          )}
        </div>

        <div className="bg-gradient-butter rounded-2xl p-3.5 text-center">
          <p className="text-[10px] text-ink/70 uppercase tracking-wider font-heading mb-1">Show this code at the counter</p>
          <p className="font-display text-base text-ink tracking-widest">{booking.qr_code}</p>
        </div>
      </motion.div>

      <div className="mt-6 w-full max-w-md flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/orders')}
          className="w-full py-3.5 bg-gradient-coral rounded-2xl font-heading text-sm text-white shadow-pop-coral flex items-center justify-center gap-2"
        >
          View My Bookings <ArrowRight size={14} />
        </motion.button>
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 border-2 border-ink/8 rounded-2xl text-sm text-ink/60 font-heading"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmedPage;
