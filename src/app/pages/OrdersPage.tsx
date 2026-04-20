import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarCheck, Clock, Users, Ticket, Hourglass } from 'lucide-react';
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
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchAll = async () => {
      const [bookingsRes, packsRes] = await Promise.all([
        supabase
          .from('bookings' as any)
          .select('*')
          .eq('user_id', userId)
          .order('booking_date', { ascending: false })
          .order('slot_time', { ascending: false }),
        supabase
          .from('user_packs' as any)
          .select('*')
          .eq('user_id', userId)
          .order('purchased_at', { ascending: false }),
      ]);
      setBookings((bookingsRes.data as any) || []);
      setPacks((packsRes.data as any) || []);
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && !['completed', 'cancelled'].includes(b.status));
  const past = bookings.filter(b => !upcoming.includes(b));
  const activePacks = packs.filter(p => p.status === 'active' && Number(p.hours_used) < Number(p.total_hours));
  const usedPacks = packs.filter(p => !activePacks.includes(p));

  const renderPack = (pack: any, i: number) => {
    const accent = PACK_COLORS[i % PACK_COLORS.length];
    const hoursLeft = Number(pack.total_hours) - Number(pack.hours_used);
    const pct = Math.min(100, (Number(pack.hours_used) / Number(pack.total_hours)) * 100);
    return (
      <motion.div
        key={pack.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => navigate('/wallet')}
        className="bg-card border-2 border-ink/8 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-pop"
      >
        <div className={`${accent} px-4 py-3 flex items-center justify-between text-white`}>
          <div className="flex items-center gap-2">
            <Ticket size={15} />
            <span className="font-display text-sm">Play Pack</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-heading bg-white/30 text-white capitalize">
            {pack.status}
          </span>
        </div>
        <div className="p-4">
          <p className="font-display text-base text-ink">{pack.pack_name}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-ink/60 flex-wrap">
            <span className="flex items-center gap-1"><Hourglass size={11} /> {hoursLeft}h left of {pack.total_hours}h</span>
            <span className="flex items-center gap-1"><CalendarCheck size={11} /> {formatDateTime(pack.purchased_at)}</span>
          </div>
          <div className="mt-3 h-2 bg-ink/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-mint" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-ink/5">
            <span className="text-[11px] text-ink/55">
              {pack.is_free_welcome ? '🎉 Welcome offer' : 'Paid'}
            </span>
            <span className="font-display text-base text-ink">₹{Number(pack.amount_paid)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

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

  const isEmpty = bookings.length === 0 && packs.length === 0;

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
          <h1 className="font-display text-xl text-ink">My Orders 🎟️</h1>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-16 bg-card border-2 border-ink/8 rounded-3xl shadow-pop">
            <div className="text-5xl mb-3 animate-bounce-soft">🎈</div>
            <p className="font-display text-lg text-ink">Nothing here yet!</p>
            <p className="text-xs text-ink/55 mt-1">Pick a package and let's goof off</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/home')}
              className="mt-5 px-6 py-3 bg-gradient-coral rounded-2xl text-sm font-heading text-white shadow-pop-coral">
              Browse Packs
            </motion.button>
          </div>
        ) : (
          <>
            {activePacks.length > 0 && (
              <div>
                <h2 className="font-display text-lg text-ink mb-3 flex items-center gap-2">
                  🎟️ Active Packs
                </h2>
                <div className="space-y-3">{activePacks.map(renderPack)}</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-display text-lg text-ink mb-3 flex items-center gap-2">
                  ⏰ Upcoming Bookings
                </h2>
                <div className="space-y-3">{upcoming.map(renderBooking)}</div>
              </div>
            )}
            {(past.length > 0 || usedPacks.length > 0) && (
              <div>
                <h2 className="font-display text-lg text-ink/55 mb-3 flex items-center gap-2">
                  📚 Past
                </h2>
                <div className="space-y-3">
                  {past.map(renderBooking)}
                  {usedPacks.map((p, i) => renderPack(p, past.length + i))}
                </div>
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
