import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarCheck, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { Star, Sparkle } from '../components/Stickers';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  booked: { bg: 'bg-butter/30', text: 'text-ink', label: 'Booked' },
  confirmed: { bg: 'bg-sky/30', text: 'text-ink', label: 'Confirmed' },
  checked_in: { bg: 'bg-mint/40', text: 'text-ink', label: 'Checked In' },
  completed: { bg: 'bg-ink/10', text: 'text-ink/70', label: 'Completed' },
  cancelled: { bg: 'bg-coral/30', text: 'text-ink', label: 'Cancelled' },
};

const PACK_COLORS = [
  'bg-gradient-coral shadow-pop-coral',
  'bg-gradient-mint shadow-pop-mint',
  'bg-gradient-butter shadow-pop-butter',
  'bg-gradient-lavender shadow-pop-lavender',
];

const OrdersPage = () => {
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings' as any)
        .select('*')
        .eq('user_id', userId)
        .order('booking_date', { ascending: false })
        .order('slot_time', { ascending: false });
      setBookings((data as any) || []);
      setLoading(false);
    };
    fetchBookings();
  }, [userId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && !['completed', 'cancelled'].includes(b.status));
  const past = bookings.filter(b => !upcoming.includes(b));

  const renderBooking = (booking: any, i: number) => {
    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.booked;
    const accent = PACK_COLORS[i % PACK_COLORS.length];
    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => navigate(`/booking-confirmed/${booking.id}`)}
        className="bg-card border-2 border-ink/8 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-pop"
      >
        <div className={`${accent} px-4 py-3 flex items-center justify-between text-white`}>
          <div className="flex items-center gap-2">
            <CalendarCheck size={15} />
            <span className="font-display text-sm">{booking.booking_number}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading bg-white/30 text-white`}>
            {config.label}
          </span>
        </div>
        <div className="p-4">
          <p className="font-display text-base text-ink">{booking.package_name}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-ink/60 flex-wrap">
            <span className="flex items-center gap-1"><CalendarCheck size={11} /> {formatDate(booking.booking_date)}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {String(booking.slot_time).slice(0, 5)}</span>
            <span className="flex items-center gap-1"><Users size={11} /> {booking.num_kids}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-ink/5">
            <span className="text-[11px] text-ink/55">
              {booking.is_free_welcome ? '🎉 Welcome offer' : booking.payment_status === 'paid' ? 'Paid' : 'Pay at venue'}
            </span>
            <span className="font-display text-base text-ink">₹{Number(booking.total_amount)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <Star className="absolute top-24 right-8 w-7 h-7 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute top-64 left-6 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <h1 className="font-display text-xl text-ink">My Bookings 🎟️</h1>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-card border-2 border-ink/8 rounded-3xl shadow-pop">
            <div className="text-5xl mb-3 animate-bounce-soft">🎈</div>
            <p className="font-display text-lg text-ink">No bookings yet!</p>
            <p className="text-xs text-ink/55 mt-1">Pick a package and let's goof off</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/home')}
              className="mt-5 px-6 py-3 bg-gradient-coral rounded-2xl text-sm font-heading text-white shadow-pop-coral">
              Browse Packs
            </motion.button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-display text-lg text-ink mb-3 flex items-center gap-2">
                  ⏰ Upcoming
                </h2>
                <div className="space-y-3">{upcoming.map(renderBooking)}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="font-display text-lg text-ink/55 mb-3 flex items-center gap-2">
                  📚 Past
                </h2>
                <div className="space-y-3">{past.map(renderBooking)}</div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default OrdersPage;
