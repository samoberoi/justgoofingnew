import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import Icon3D from '../components/Icon3D';
import illusEmpty from '@/assets/illus/illus-empty-orders.png';

const STATUS_LABEL: Record<string, string> = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ACCENTS = ['bg-coral', 'bg-mint', 'bg-butter', 'bg-lavender'];

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
        supabase.from('bookings' as any).select('*').eq('user_id', userId).order('booking_date', { ascending: false }).order('slot_time', { ascending: false }),
        supabase.from('user_packs' as any).select('*').eq('user_id', userId).order('purchased_at', { ascending: false }),
      ]);
      setBookings((bookingsRes.data as any) || []);
      setPacks((packsRes.data as any) || []);
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtDateTime = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && !['completed', 'cancelled'].includes(b.status));
  const past = bookings.filter(b => !upcoming.includes(b));
  const activePacks = packs.filter(p => p.status === 'active' && Number(p.hours_used) < Number(p.total_hours));
  const usedPacks = packs.filter(p => !activePacks.includes(p));

  const renderPack = (pack: any, i: number) => {
    const accent = ACCENTS[i % ACCENTS.length];
    const hoursLeft = Number(pack.total_hours) - Number(pack.hours_used);
    const pct = Math.min(100, (Number(pack.hours_used) / Number(pack.total_hours)) * 100);
    return (
      <motion.div
        key={pack.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => navigate('/wallet')}
        className="bg-card rounded-[24px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-soft border border-border"
      >
        <div className={`${accent} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Icon3D name="orders" size={26} alt="" />
            <span className="font-display text-sm text-ink">Hour pack</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-display bg-ink/15 text-ink capitalize">
            {pack.status}
          </span>
        </div>
        <div className="p-4">
          <p className="font-display text-base text-ink">{pack.pack_name}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap font-heading">
            <span className="flex items-center gap-1"><Hourglass size={11} strokeWidth={2.5} /> {hoursLeft}h of {pack.total_hours}h</span>
            <span className="flex items-center gap-1"><Calendar size={11} strokeWidth={2.5} /> {fmtDateTime(pack.purchased_at)}</span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-mint" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[11px] text-muted-foreground font-heading">
              {pack.is_free_welcome ? 'Welcome offer' : 'Paid'}
            </span>
            <span className="font-display text-base text-ink">₹{Number(pack.amount_paid)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBooking = (booking: any, i: number) => {
    const accent = ACCENTS[(i + 1) % ACCENTS.length];
    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => navigate(`/booking-confirmed/${booking.id}`)}
        className="bg-card rounded-[24px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-soft border border-border"
      >
        <div className={`${accent} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Icon3D name="calendar" size={26} alt="" />
            <span className="font-display text-sm text-ink">{booking.booking_number}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-display bg-ink/15 text-ink">
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
        </div>
        <div className="p-4">
          <p className="font-display text-base text-ink">{booking.package_name}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap font-heading">
            <span className="flex items-center gap-1"><Calendar size={11} strokeWidth={2.5} /> {fmtDate(booking.booking_date)}</span>
            <span className="flex items-center gap-1"><Clock size={11} strokeWidth={2.5} /> {String(booking.slot_time).slice(0, 5)}</span>
            <span className="flex items-center gap-1"><Users size={11} strokeWidth={2.5} /> {booking.num_kids}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[11px] text-muted-foreground font-heading">
              {booking.is_free_welcome ? 'Welcome offer' : booking.payment_status === 'paid' ? 'Paid' : 'Pay at venue'}
            </span>
            <span className="font-display text-base text-ink">₹{Number(booking.total_amount)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const isEmpty = bookings.length === 0 && packs.length === 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">My orders</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-5 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-[24px] animate-pulse" />)}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-10 bg-muted rounded-[28px]">
            <img src={illusEmpty} alt="" className="w-40 h-40 mx-auto -mb-2" />
            <p className="font-display text-lg text-ink">Nothing here yet!</p>
            <p className="text-xs text-muted-foreground mt-1 font-heading">Pick a pack and let's goof off</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/menu')}
              className="mt-5 px-6 py-3 bg-ink rounded-full font-display text-sm text-white">
              Browse packs
            </motion.button>
          </div>
        ) : (
          <>
            {activePacks.length > 0 && (
              <div>
                <h2 className="font-display text-base text-ink mb-3 px-1">Active packs</h2>
                <div className="space-y-2.5">{activePacks.map(renderPack)}</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-display text-base text-ink mb-3 px-1">Upcoming bookings</h2>
                <div className="space-y-2.5">{upcoming.map(renderBooking)}</div>
              </div>
            )}
            {(past.length > 0 || usedPacks.length > 0) && (
              <div>
                <h2 className="font-display text-base text-muted-foreground mb-3 px-1">Past</h2>
                <div className="space-y-2.5">
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
