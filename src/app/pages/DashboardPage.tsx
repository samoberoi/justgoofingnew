import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Plus } from 'lucide-react';
import PlayfulHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import Icon3D from '../components/Icon3D';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';
import charHero from '@/assets/char-hero.png';
import charGirl from '@/assets/char-girl.png';
import charCool from '@/assets/char-cool.png';

interface UserPack {
  id: string;
  pack_name: string;
  total_hours: number;
  hours_used: number;
  status: string;
  is_free_welcome: boolean;
  purchased_at: string;
  payment_status?: string;
  amount_paid?: number;
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

const fmtTime = (t: string) => String(t).slice(0, 5);

// Reference-style accent rotation for pack cards
const packStyles = [
  { bg: 'bg-coral', char: charGirl },
  { bg: 'bg-mint', char: charHero },
  { bg: 'bg-lavender', char: charCool },
  { bg: 'bg-butter', char: charHero },
];

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
    <span className="font-display text-4xl sm:text-5xl text-white tabular-nums tracking-tight">
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
    if (!userId) { setLoading(false); return; }
    const today = new Date().toISOString().split('T')[0];

    const [packsRes, bookingsRes, sessionRes] = await Promise.all([
      supabase.from('user_packs' as any).select('*').eq('user_id', userId).in('status', ['active', 'pending']).order('purchased_at', { ascending: false }),
      supabase.from('bookings' as any).select('id, booking_number, package_name, booking_date, slot_time, status, num_kids').eq('user_id', userId).gte('booking_date', today).not('status', 'in', '("completed","cancelled")').order('booking_date', { ascending: true }).limit(5),
      supabase.from('play_sessions' as any).select('*').eq('user_id', userId).eq('status', 'active').order('checked_in_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setPacks((packsRes.data as any) || []);
    setBookings((bookingsRes.data as any) || []);
    setActiveSession((sessionRes.data as any) || null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
    if (!userId) return;
    const channel = supabase
      .channel('dashboard-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_sessions', filter: `user_id=eq.${userId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_packs', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadData]);

  // If session not hydrated yet, supabase may still be restoring — give it a moment, then redirect to login.
  useEffect(() => {
    if (userId) return;
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/login', { replace: true });
    }, 800);
    return () => clearTimeout(t);
  }, [userId, navigate]);

  const activePacks = packs.filter(p => p.status === 'active');
  const pendingPacks = packs.filter(p => p.status === 'pending' || p.payment_status === 'pending');
  const totalHoursOwned = activePacks.reduce((sum, p) => sum + (Number(p.total_hours) - Number(p.hours_used)), 0);
  const hasAnything = packs.length > 0 || bookings.length > 0 || activeSession;
  const firstName = (userName || '').split(' ')[0] || 'Goofer';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PlayfulHeader />
        <div className="px-5 pt-4 space-y-4 max-w-lg mx-auto">
          <div className="h-72 bg-muted rounded-[32px] animate-pulse" />
          {[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-[24px] animate-pulse" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <PlayfulHeader />

      <div className="px-5 pt-2 space-y-6 max-w-lg mx-auto">
        {/* Greeting */}
        <div>
          <p className="text-xs text-muted-foreground font-heading">Hi {firstName} 👋</p>
          <h1 className="font-display text-[34px] text-ink leading-[1.05] mt-1 -tracking-wide">
            Discover fun
          </h1>
        </div>

        {/* === HERO CARD === */}
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative bg-ink rounded-[32px] p-6 shadow-hero overflow-hidden min-h-[260px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon3D name="clock" size={20} alt="" />
                  <p className="font-heading text-sm text-white/70">Playing right now</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint shrink-0">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-ink opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-ink" />
                  </span>
                  <span className="text-[10px] font-display text-ink">LIVE</span>
                </span>
              </div>
              <div className="py-2">
                <LiveTimer checkedInAt={activeSession.checked_in_at} />
                <p className="text-xs text-white/50 font-heading mt-2">at the venue</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  onClick={() => navigate('/my-qr')}
                  className="py-3.5 bg-white/10 backdrop-blur rounded-2xl text-sm font-display text-white hover:bg-white/15 transition-colors"
                >
                  Show QR
                </button>
                <button
                  onClick={() => navigate('/extend-session/' + activeSession.id)}
                  className="py-3.5 bg-mint rounded-2xl text-sm font-display text-ink hover:scale-[1.02] transition-transform"
                >
                  + Extend 1hr
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-ink rounded-[32px] p-6 pr-4 shadow-hero overflow-hidden min-h-[280px]"
            >
              {/* soft glows */}
              <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-coral/10 blur-3xl pointer-events-none" />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-6 right-8 w-2 h-2 rounded-full bg-mint"
              />
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute top-16 right-20 w-1.5 h-1.5 rounded-full bg-coral"
              />

              <div className="relative z-10 max-w-[58%]">
                <p className="font-heading text-[10px] text-white/60 uppercase tracking-[0.18em]">Your Balance</p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-display text-[64px] text-white -tracking-[0.04em] leading-[0.9]">
                    {totalHoursOwned}
                  </span>
                  <span className="font-display text-xl text-mint">hrs</span>
                </div>
                <p className="text-white/55 text-xs mt-3 font-heading leading-relaxed">
                  {totalHoursOwned > 0 ? 'Ready when you are' : 'Grab a pack to start the fun'}
                </p>

                <div className="flex gap-2 mt-5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/menu')}
                    className="px-5 py-3 bg-mint rounded-full text-sm font-display text-ink flex items-center gap-1.5 shadow-pop-mint"
                  >
                    {totalHoursOwned > 0 ? 'Play more' : 'Get hours'} <ArrowRight size={14} strokeWidth={2.8} />
                  </motion.button>
                  {hasAnything && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => navigate('/my-qr')}
                      className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center"
                      aria-label="QR"
                    >
                      <Icon3D name="qr" size={22} alt="QR" />
                    </motion.button>
                  )}
                </div>
              </div>

              <motion.img
                src={charHero}
                alt=""
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-3 -right-3 w-48 h-48 object-contain pointer-events-none drop-shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PENDING PAYMENT */}
        {pendingPacks.length > 0 && (
          <section>
            <h2 className="font-display text-base text-ink mb-3 px-1">⏳ Awaiting payment</h2>
            <div className="space-y-2.5">
              {pendingPacks.map((pack) => (
                <div key={pack.id} className="bg-butter/30 rounded-[24px] p-4 border border-dashed border-ink/15">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base text-ink truncate">{pack.pack_name}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-coral text-white font-display shrink-0">PENDING</span>
                      </div>
                      <p className="text-[11px] text-ink/70 font-heading mt-1">
                        {pack.total_hours} hrs · ₹{Number(pack.amount_paid || 0)}
                      </p>
                      <p className="text-[11px] text-ink/80 mt-1.5">
                        🎟️ Visit the centre to activate
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MY PACKS — reference-style horizontal cards */}
        {activePacks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-display text-base text-ink">My hour packs</h2>
              <button
                onClick={() => navigate('/menu')}
                className="text-xs text-muted-foreground font-heading flex items-center gap-1"
              >
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {activePacks.map((pack, idx) => {
                const s = packStyles[idx % packStyles.length];
                const remaining = Number(pack.total_hours) - Number(pack.hours_used);
                const pct = (Number(pack.hours_used) / Number(pack.total_hours)) * 100;
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative ${s.bg} rounded-[28px] p-4 w-[180px] shrink-0 overflow-hidden`}
                  >
                    <div className="relative z-10">
                      <p className="font-heading text-[10px] text-ink/60 uppercase tracking-wide">Remaining</p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-3xl text-ink leading-none">{remaining}</span>
                        <span className="font-display text-xs text-ink/70">hrs</span>
                      </div>
                      <p className="font-heading text-xs text-ink/80 mt-2 truncate">{pack.pack_name}</p>
                      {/* progress */}
                      <div className="mt-3 h-1.5 bg-ink/15 rounded-full overflow-hidden">
                        <div className="h-full bg-ink rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {pack.is_free_welcome && (
                      <span className="absolute top-3 right-3 text-[8px] px-2 py-0.5 rounded-full bg-ink text-white font-display">
                        FREE
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {/* Add card */}
              <button
                onClick={() => navigate('/menu')}
                className="w-[120px] shrink-0 rounded-[28px] border-2 border-dashed border-ink/15 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span className="text-[11px] font-heading">Add pack</span>
              </button>
            </div>
          </section>
        )}

        {/* UPCOMING */}
        {bookings.length > 0 && (
          <section>
            <h2 className="font-display text-base text-ink mb-3 px-1">Coming up</h2>
            <div className="space-y-2.5">
              {bookings.map((b, idx) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate('/orders')}
                  className="w-full bg-card rounded-[20px] p-3.5 flex items-center gap-3 shadow-soft hover:scale-[1.01] transition-transform text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-lavender flex flex-col items-center justify-center shrink-0">
                    <span className="font-display text-sm text-ink leading-none">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </span>
                    <span className="text-[8px] font-display text-ink/70 mt-0.5 uppercase">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-ink truncate">{b.package_name}</p>
                    <p className="text-[11px] text-muted-foreground font-heading">
                      {fmtTime(b.slot_time)} · {b.num_kids} {b.num_kids === 1 ? 'kid' : 'kids'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* PARTIES CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/parties')}
          className="w-full bg-butter rounded-[28px] p-5 flex items-center gap-4 shadow-pop text-left overflow-hidden relative"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-ink/60 font-heading uppercase tracking-wider">One-off</p>
            <h3 className="font-display text-xl text-ink -tracking-wide leading-tight mt-0.5">Throw a birthday party 🎉</h3>
            <p className="text-[11px] text-ink/65 font-heading mt-1.5">Basic · Bash · Bonanza — from ₹1,000/kid</p>
          </div>
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icon3D name="gift" size={64} alt="" />
          </motion.div>
        </motion.button>

        {/* EMPTY STATE */}
        {!hasAnything && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted rounded-[32px] p-8 text-center"
          >
            <img src={charCool} alt="" className="w-32 h-32 mx-auto -mb-2" />
            <h2 className="font-display text-2xl text-ink mb-2 -tracking-wide">Let's Goof Around!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5 font-heading">
              Grab an hour pack or book a slot.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/menu')}
              className="px-7 py-3.5 bg-ink rounded-full font-display text-sm text-white inline-flex items-center gap-2"
            >
              Show me the fun ✨
            </motion.button>
            <p className="text-[11px] text-muted-foreground mt-4 font-heading">
              First time? Get <span className="text-coral font-display">1 Hour FREE</span> 🎁
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
