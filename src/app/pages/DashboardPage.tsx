import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, PartyPopper, Plus, Timer, ChevronRight } from 'lucide-react';
import PlayfulHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { Star, Sparkle, Heart } from '../components/Stickers';
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

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtTime = (t: string) => String(t).slice(0, 5);

// Color rotation for pack cards
const packColors = [
  { bg: 'bg-gradient-coral', shadow: 'shadow-pop-coral', text: 'text-ink' },
  { bg: 'bg-gradient-mint', shadow: 'shadow-pop-mint', text: 'text-ink' },
  { bg: 'bg-gradient-butter', shadow: 'shadow-pop-butter', text: 'text-ink' },
  { bg: 'bg-gradient-lavender', shadow: 'shadow-pop-lavender', text: 'text-ink' },
];

const HoursRing = ({ used, total }: { used: number; total: number }) => {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - ((100 - pct) / 100) * c;

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} stroke="hsl(var(--ink) / 0.12)" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r={r}
          stroke="hsl(var(--ink))" strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl text-ink leading-none">{remaining}</span>
        <span className="text-[9px] font-display text-ink/70 mt-0.5">hrs</span>
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
    <span className="font-display text-4xl text-ink tabular-nums tracking-wide">
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

  const activePacks = packs.filter(p => p.status === 'active');
  const pendingPacks = packs.filter(p => p.status === 'pending' || p.payment_status === 'pending');
  const totalHoursOwned = activePacks.reduce((sum, p) => sum + (Number(p.total_hours) - Number(p.hours_used)), 0);
  const hasAnything = packs.length > 0 || bookings.length > 0 || activeSession;
  const firstName = (userName || '').split(' ')[0] || 'Goofer';

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-confetti">
        <PlayfulHeader />
        <div className="px-4 pt-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse shadow-soft" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-confetti pb-28">
      <PlayfulHeader />

      <div className="px-4 pt-2 space-y-5 max-w-lg mx-auto">
        {/* Greeting */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Heyyy 👋</p>
            <h1 className="font-display text-3xl text-ink leading-tight mt-0.5">
              {firstName}!
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block ml-1"
              >
                ✨
              </motion.span>
            </h1>
          </div>
          {totalHoursOwned > 0 && (
            <div className="bg-gradient-mint rounded-2xl px-3 py-2 shadow-pop-mint border-2 border-ink/8">
              <p className="text-[9px] font-display text-ink/70 leading-none">Balance</p>
              <p className="font-display text-lg text-ink leading-none mt-0.5">{totalHoursOwned} hrs</p>
            </div>
          )}
        </div>

        {/* ACTIVE SESSION */}
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative bg-gradient-coral rounded-[28px] p-6 shadow-pop-coral border-2 border-ink/8 overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 opacity-20">
                <Star size={80} color="hsl(var(--butter))" />
              </div>
              <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 border-2 border-ink/8">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-coral opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-coral" />
                  </span>
                  <span className="text-[10px] font-display text-ink">LIVE</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Timer size={18} className="text-ink" />
                <p className="font-display text-sm text-ink">Playing right now</p>
              </div>
              <div className="text-center py-3">
                <LiveTimer checkedInAt={activeSession.checked_in_at} />
                <p className="text-[11px] text-ink/70 font-medium mt-1">at the venue</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-4 relative z-10">
                <button
                  onClick={() => navigate('/my-qr')}
                  className="py-3 bg-card rounded-2xl text-sm font-display text-ink border-2 border-ink/8 shadow-soft hover:scale-[1.02] transition-transform"
                >
                  Show QR
                </button>
                <button
                  onClick={() => navigate('/extend-session/' + activeSession.id)}
                  className="py-3 bg-ink rounded-2xl text-sm font-display text-cream hover:scale-[1.02] transition-transform"
                >
                  + Extend 1hr
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR CHECK-IN BUTTON */}
        {!activeSession && hasAnything && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/my-qr')}
            className="w-full bg-gradient-butter rounded-[24px] p-5 flex items-center gap-4 shadow-pop-butter border-2 border-ink/8 hover:scale-[1.01] transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shrink-0 border-2 border-ink/8">
              <QrCode size={26} className="text-ink" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-display text-base text-ink">Tap to check in</p>
              <p className="text-xs text-ink/70 font-medium">Show your QR at the venue</p>
            </div>
            <ChevronRight size={20} className="text-ink" strokeWidth={2.5} />
          </motion.button>
        )}

        {/* PENDING PAYMENT PACKS */}
        {pendingPacks.length > 0 && (
          <section>
            <h2 className="font-display text-base text-ink mb-3 flex items-center gap-2 px-1">
              ⏳ Awaiting payment
            </h2>
            <div className="space-y-2.5">
              {pendingPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-butter/40 rounded-[24px] p-4 border-2 border-dashed border-ink/20 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base text-ink truncate">{pack.pack_name}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-coral text-white font-display shrink-0">PENDING</span>
                      </div>
                      <p className="text-[11px] text-ink/70 font-medium mt-1">
                        {pack.total_hours} hrs reserved · ₹{Number(pack.amount_paid || 0)}
                      </p>
                      <p className="text-[11px] text-ink mt-1.5 font-medium">
                        🎟️ Visit the centre & pay to activate. Cash / UPI / Card.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MY PACKS */}
        {activePacks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-display text-base text-ink flex items-center gap-2">
                <Sparkle size={14} color="hsl(var(--coral))" /> My Hour Packs
              </h2>
              <button
                onClick={() => navigate('/menu')}
                className="text-xs text-ink/70 font-display flex items-center gap-1 bg-card rounded-full px-3 py-1.5 shadow-soft border-2 border-ink/8"
              >
                <Plus size={12} strokeWidth={3} /> Buy more
              </button>
            </div>
            <div className="space-y-3">
              {packs.map((pack, idx) => {
                const c = packColors[idx % packColors.length];
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={`${c.bg} rounded-[24px] p-4 ${c.shadow} border-2 border-ink/8 flex items-center gap-4 relative overflow-hidden`}
                  >
                    <div className="absolute top-2 right-2 opacity-30">
                      <Heart size={20} color="hsl(var(--card))" />
                    </div>
                    <HoursRing used={Number(pack.hours_used)} total={Number(pack.total_hours)} />
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-display text-base ${c.text} truncate`}>{pack.pack_name}</h3>
                        {pack.is_free_welcome && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-card font-display text-ink shadow-soft">
                            FREEBIE
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] ${c.text} opacity-80 font-medium mt-1`}>
                        {Number(pack.hours_used).toFixed(1)} of {Number(pack.total_hours)} hrs used
                      </p>
                      <p className={`text-[10px] ${c.text} opacity-60 mt-0.5`}>
                        ✨ Never expires
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* UPCOMING BOOKINGS */}
        {bookings.length > 0 && (
          <section>
            <h2 className="font-display text-base text-ink mb-3 flex items-center gap-2 px-1">
              <Star size={14} color="hsl(var(--mint))" /> Coming up
            </h2>
            <div className="space-y-2.5">
              {bookings.map((b, idx) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate('/orders')}
                  className="w-full bg-card rounded-[20px] p-3.5 flex items-center gap-3 shadow-soft border-2 border-ink/8 hover:scale-[1.01] transition-transform text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-sky border-2 border-ink/8 flex flex-col items-center justify-center shrink-0">
                    <span className="font-display text-sm text-ink leading-none">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </span>
                    <span className="text-[8px] font-display text-ink/70 mt-0.5">
                      {new Date(b.booking_date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-ink truncate">{b.package_name}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {fmtTime(b.slot_time)} · {b.num_kids} {b.num_kids === 1 ? 'kid' : 'kids'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-ink/60 shrink-0" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {!hasAnything && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[32px] p-8 text-center mt-4 shadow-pop border-2 border-ink/8 relative overflow-hidden"
          >
            <div className="absolute top-4 left-4 animate-bounce-soft">
              <Star size={28} color="hsl(var(--butter))" />
            </div>
            <div className="absolute top-6 right-6 animate-wobble">
              <Heart size={24} color="hsl(var(--coral))" />
            </div>
            <div className="absolute bottom-4 left-8">
              <Sparkle size={18} color="hsl(var(--mint))" />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-rainbow border-4 border-ink/8 flex items-center justify-center mx-auto mb-5 shadow-pop-coral"
            >
              <PartyPopper size={44} className="text-ink" strokeWidth={2.5} />
            </motion.div>
            <h2 className="font-display text-2xl text-ink mb-2">Let's Goof Around!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-6">
              Grab an hour pack or book a slot to start the fun.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/menu')}
              className="px-8 py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink shadow-pop-coral border-2 border-ink/8 inline-flex items-center gap-2"
            >
              Show me the fun ✨
            </motion.button>
            <p className="text-xs text-muted-foreground mt-4 font-medium">
              First time? Get <span className="text-coral font-display">1 Hour FREE</span> 🎁
            </p>
          </motion.div>
        )}

        {/* QUICK BROWSE link */}
        {hasAnything && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/menu')}
            className="w-full bg-card rounded-[20px] p-4 flex items-center justify-center gap-2 text-ink text-sm font-display shadow-soft border-2 border-dashed border-ink/15 hover:bg-mint/10 transition-colors"
          >
            <Plus size={14} strokeWidth={3} /> Browse packs & slots
          </motion.button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
