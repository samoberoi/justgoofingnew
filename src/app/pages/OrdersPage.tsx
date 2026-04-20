import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarCheck, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  booked: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'Booked' },
  confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Confirmed' },
  checked_in: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Checked In' },
  completed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Completed' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Cancelled' },
};

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
    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => navigate(`/booking-confirmed/${booking.id}`)}
        className="bg-card border border-border rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform hover:border-secondary/15"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CalendarCheck size={14} className="text-secondary" />
            </div>
            <span className="font-heading text-sm text-foreground">{booking.booking_number}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        </div>
        <p className="font-heading text-sm text-foreground mt-2">{booking.package_name}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarCheck size={11} /> {formatDate(booking.booking_date)}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {String(booking.slot_time).slice(0, 5)}</span>
          <span className="flex items-center gap-1"><Users size={11} /> {booking.num_kids}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
          <span className="text-[10px] text-muted-foreground">
            {booking.is_free_welcome ? '🎉 Welcome offer' : booking.payment_status === 'paid' ? 'Paid' : 'Pay at venue'}
          </span>
          <span className="font-heading text-sm text-secondary">₹{Number(booking.total_amount)}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/home')}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">My Bookings</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CalendarCheck size={28} className="text-muted-foreground/40" />
            </div>
            <p className="font-heading text-base text-foreground">No Bookings Yet</p>
            <p className="text-xs text-muted-foreground mt-1">Pick a package and book your fun!</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/home')}
              className="mt-5 px-6 py-3 bg-gradient-saffron rounded-xl text-xs font-heading text-primary-foreground uppercase tracking-wider">
              Browse Packages
            </motion.button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-heading text-xs text-secondary uppercase tracking-[0.15em] mb-2.5">Upcoming</h2>
                <div className="space-y-2.5">{upcoming.map(renderBooking)}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2.5">Past</h2>
                <div className="space-y-2.5">{past.map(renderBooking)}</div>
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
