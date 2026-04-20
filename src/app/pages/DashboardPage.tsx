import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ArrowRight, QrCode, Calendar, PartyPopper, Plus, Sparkles, Timer, ChevronRight } from 'lucide-react';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';

interface UserPack {
  id: string;
  pack_name: string;
  total_hours: number;
  hours_used: number;
  status: string;
  is_free_welcome: boolean;
  purchased_at: string;
}

interface Booking {
  id: string;
  booking_number: string;
  package_name: string;
  booking_date: string;
  slot_time: string;
  status: string;
  num_kids: number;
}

interface ActiveSession {
  id: string;
  user_pack_id: string | null;
  checked_in_at: string;
  hours_consumed: number;
  extended_hours: number;
  num_kids: number;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (t: string) => String(t).slice(0, 5);

const HoursRing = ({ used, total }: { used: number; total: number }) => {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
        <circle
          cx="32" cy="32" r={r}
          stroke="hsl(var(--secondary))" strokeWidth="4" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-sm text-secondary leading-none">{remaining}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">left</span>
      </div>
    </div>
  );
};

const LiveTimer = ({ checkedInAt }: { checkedInAt: string }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkedInAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="font-heading text-3xl text-secondary tabular-nums tracking-wider">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { userId, userName } = useAppStore();
  const [packs, setPacks] = useState<UserPack[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    const [packsRes, bookingsRes, sessionRes] = await Promise.all([
      supabase.from('user_packs' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false }),
      supabase.from('bookings' as any)
        .select('id, booking_number, package_name, booking_date, slot_time, status, num_kids')
        .eq('user_id', userId)
        .gte('booking_date', today)
        .not('status', 'in', '("completed","cancelled")')
        .order('booking_date', { ascending: true })
        .limit(5),
      supabase.from('play_sessions' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setPacks((packsRes.data as any) || []);
    setBookings((bookingsRes.data as any) || []);
    setActiveSession((sessionRes.data as any) || null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();

    if (!userId) return;
    // Realtime updates for sessions/packs
    const channel = supabase
      .channel('dashboard-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_sessions', filter: `user_id=eq.${userId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_packs', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, loadData]);

  const totalHoursOwned = packs.reduce((sum, p) => sum + (Number(p.total_hours) - Number(p.hours_used)), 0);
  const hasAnything = packs.length > 0 || bookings.length > 0 || activeSession;
  const firstName = (userName || '').split(' ')[0] || 'Goofer';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RoyalHeader />
        <div className="px-4 pt-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RoyalHeader />

      <div className="px-4 pt-4 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-xs text-muted-foreground">Welcome back,</p>
          <h1 className="font-heading text-xl text-foreground leading-tight">Hey {firstName} 👋</h1>
        </div>

        {/* ACTIVE SESSION (if checked in) */}
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border-2 border-secondary/40 rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/20 border border-secondary/30">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-secondary opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-secondary" />
                  </span>
                  <span className="text-[9px] font-heading uppercase tracking-wider text-secondary">Live</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Timer size={16} className="text-secondary" />
                <p className="font-heading text-xs uppercase tracking-wider text-secondary">Currently Playing</p>
              </div>
              <div className="text-center py-2">
                <LiveTimer checkedInAt={activeSession.checked_in_at} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Time at venue</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => navigate('/my-qr')}
                  className="py-2.5 bg-card border border-secondary/30 rounded-xl text-xs font-heading uppercase tracking-wider text-secondary"
                >
                  Show QR
                </button>
                <button
                  onClick={() => navigate('/extend-session/' + activeSession.id)}
                  className="py-2.5 bg-gradient-saffron rounded-xl text-xs font-heading uppercase tracking-wider text-primary-foreground"
                >
                  + Extend 1hr
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR CHECK-IN BUTTON (always visible if has packs/bookings) */}
        {!activeSession && hasAnything && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/my-qr')}
            className="w-full bg-gradient-to-r from-secondary/15 via-secondary/8 to-secondary/15 border border-secondary/25 rounded-2xl p-4 flex items-center gap-3 hover:border-secondary/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
              <QrCode size={22} className="text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-heading text-sm text-foreground">Show Your QR</p>
              <p className="text-[11px] text-muted-foreground">Scan at venue to check in</p>
            </div>
            <ChevronRight size={16} className="text-secondary" />
          </motion.button>
        )}

        {/* MY PACKS */}
        {packs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-heading text-xs text-secondary uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Package size={12} /> My Hour Packs
              </h2>
              <button
                onClick={() => navigate('/menu')}
                className="text-[10px] text-secondary/80 font-heading uppercase tracking-wider flex items-center gap-1"
              >
                <Plus size={10} /> Buy More
              </button>
            </div>
            <div className="space-y-2.5">
              {packs.map((pack, idx) => {
                const remaining = Number(pack.total_hours) - Number(pack.hours_used);
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
                  >
                    <HoursRing used={Number(pack.hours_used)} total={Number(pack.total_hours)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-heading text-sm text-foreground truncate">{pack.pack_name}</h3>
                        {pack.is_free_welcome && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold uppercase tracking-wider shrink-0">
                            Welcome
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {Number(pack.hours_used).toFixed(1)} of {Number(pack.total_hours)} hours used
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Purchased {fmtDate(pack.purchased_at)} · No expiry
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-2 px-1">
              <p className="text-[10px] text-muted-foreground text-right">
                Total balance: <span className="text-secondary font-heading">{totalHoursOwned} hrs</span>
              </p>
            </div>
          </section>
        )}

        {/* UPCOMING BOOKINGS */}
        {bookings.length > 0 && (
          <section>
            <h2 className="font-heading text-xs text-secondary uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
              <Calendar size={12} /> Upcoming Bookings
            </h2>
            <div className="space-y-2">
              {bookings.map((b, idx) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate('/orders')}
                  className="w-full bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 hover:border-secondary/30 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex flex-col items-center justify-center shrink-0">
                    <span className="font-heading text-xs text-secondary leading-none">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </span>
                    <span className="text-[8px] text-secondary/70 uppercase tracking-wider mt-0.5">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-foreground truncate">{b.package_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtTime(b.slot_time)} · {b.num_kids} {b.num_kids === 1 ? 'kid' : 'kids'} · #{b.booking_number}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-secondary shrink-0" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {!hasAnything && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-8 text-center mt-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={36} className="text-secondary" />
            </div>
            <h2 className="font-heading text-lg text-foreground mb-2">Let's Goof Around!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5">
              You don't have any packs or bookings yet. Browse our hour packs and one-off slots to get started.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/menu')}
              className="px-7 py-3.5 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron inline-flex items-center gap-2"
            >
              <Sparkles size={14} /> See the Menu
            </motion.button>
            <p className="text-[10px] text-muted-foreground/70 mt-4">
              First-timer? Claim your <span className="text-secondary">1 Hour FREE</span> pack 🎉
            </p>
          </motion.div>
        )}

        {/* QUICK BROWSE link (when has stuff but might want more) */}
        {hasAnything && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/menu')}
            className="w-full bg-card border border-dashed border-secondary/30 rounded-2xl p-3.5 flex items-center justify-center gap-2 text-secondary text-xs font-heading uppercase tracking-wider hover:bg-secondary/5 transition-colors"
          >
            <Plus size={13} /> Browse Packs & Slots
          </motion.button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
