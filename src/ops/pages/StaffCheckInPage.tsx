import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, CheckCircle2, Clock, Users, X, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import { calcAge } from '../../app/hooks/useKids';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_number: string;
  qr_code: string;
  package_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  user_id: string;
  num_kids: number;
  status: string;
  booking_date: string;
  slot_time: string;
}

interface KidRow {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  school: string | null;
}

interface ActiveSession {
  id: string;
  kid_name: string | null;
  num_kids: number;
  plus_one: boolean;
  checked_in_at: string;
  hours_consumed: number;
  user_id: string;
}

const StaffCheckInPage = () => {
  const navigate = useNavigate();
  const { user, storeId } = useAuth();

  const [tab, setTab] = useState<'checkin' | 'active'>('checkin');
  const [search, setSearch] = useState('');
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [parentKids, setParentKids] = useState<KidRow[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [now, setNow] = useState(Date.now());

  // Live clock for active session timers
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);

  // Load active sessions for this store
  const loadActive = async () => {
    let q = supabase
      .from('play_sessions' as any)
      .select('id, kid_name, num_kids, plus_one, checked_in_at, hours_consumed, user_id')
      .eq('status', 'active')
      .order('checked_in_at', { ascending: false });
    if (storeId) q = q.eq('store_id', storeId);
    const { data } = await q;
    setActiveSessions((data as any) || []);
  };

  useEffect(() => {
    loadActive();
    const ch = supabase
      .channel('staff-checkin-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_sessions' }, () => loadActive())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  // Search booking by QR code or booking number
  const handleSearch = async () => {
    if (!search.trim()) return;
    const term = search.trim();
    const { data } = await supabase
      .from('bookings' as any)
      .select('id, booking_number, qr_code, package_name, customer_name, customer_phone, user_id, num_kids, status, booking_date, slot_time')
      .or(`qr_code.eq.${term},booking_number.eq.${term.toUpperCase()}`)
      .maybeSingle();

    if (!data) {
      toast.error('Booking not found', { description: 'Check the QR code or booking number' });
      setScannedBooking(null);
      return;
    }

    if ((data as any).status === 'completed' || (data as any).status === 'cancelled') {
      toast.error(`This booking is ${(data as any).status}`);
      return;
    }

    setScannedBooking(data as any);

    // Load kids for this parent
    const { data: kids } = await supabase
      .from('kids' as any)
      .select('id, name, date_of_birth, gender, school')
      .eq('parent_user_id', (data as any).user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    setParentKids((kids as any) || []);
    setSelectedKidId(null);
    setPlusOne(false);
  };

  const handleCheckIn = async () => {
    if (!scannedBooking || !selectedKidId) return;
    setSubmitting(true);

    const kid = parentKids.find(k => k.id === selectedKidId);
    const kidsCount = plusOne ? 2 : 1;

    const { error: sessionError } = await supabase
      .from('play_sessions' as any)
      .insert({
        booking_id: scannedBooking.id,
        user_id: scannedBooking.user_id,
        kid_id: selectedKidId,
        kid_name: kid?.name || null,
        num_kids: kidsCount,
        plus_one: plusOne,
        store_id: storeId,
        staff_user_id: user?.id,
        status: 'active',
      } as any);

    if (sessionError) {
      toast.error('Check-in failed', { description: sessionError.message });
      setSubmitting(false);
      return;
    }

    await supabase
      .from('bookings' as any)
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('id', scannedBooking.id);

    toast.success(`${kid?.name} checked in! 🎉`, {
      description: plusOne ? 'With a +1 friend — 2× hours will be deducted at check-out' : '1× hours per hour',
    });

    setScannedBooking(null);
    setParentKids([]);
    setSelectedKidId(null);
    setPlusOne(false);
    setSearch('');
    setSubmitting(false);
    loadActive();
    setTab('active');
  };

  const handleCheckOut = async (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const elapsedMs = now - new Date(session.checked_in_at).getTime();
    const hoursElapsed = Math.max(0.25, elapsedMs / 3600000); // round-up min 15min
    const billableHours = Math.ceil(hoursElapsed * 4) / 4; // round to 15min
    const totalHours = billableHours * (session.plus_one ? 2 : 1);

    if (!confirm(`Check out? Will deduct ${totalHours} hours${session.plus_one ? ' (×2 for +1 friend)' : ''} from parent's pack.`)) return;

    // Update session
    await supabase
      .from('play_sessions' as any)
      .update({
        status: 'completed',
        checked_out_at: new Date().toISOString(),
        hours_consumed: totalHours,
      })
      .eq('id', sessionId);

    // Deduct from parent's active pack (oldest first)
    const { data: packs } = await supabase
      .from('user_packs' as any)
      .select('id, total_hours, hours_used')
      .eq('user_id', session.user_id)
      .eq('status', 'active')
      .order('purchased_at', { ascending: true });

    let toDeduct = totalHours;
    for (const pack of (packs as any[]) || []) {
      if (toDeduct <= 0) break;
      const remaining = Number(pack.total_hours) - Number(pack.hours_used);
      const deductFromPack = Math.min(remaining, toDeduct);
      const newUsed = Number(pack.hours_used) + deductFromPack;
      const isExhausted = newUsed >= Number(pack.total_hours);
      await supabase
        .from('user_packs' as any)
        .update({ hours_used: newUsed, status: isExhausted ? 'exhausted' : 'active' })
        .eq('id', pack.id);
      toDeduct -= deductFromPack;
    }

    toast.success('Checked out! 👋', { description: `${totalHours} hours deducted` });
    loadActive();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatDuration = (checkedInAt: string) => {
    const ms = now - new Date(checkedInAt).getTime();
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-ink">Check-In Desk 🎫</h1>
            <p className="text-[11px] text-ink/55">Scan QR · Pick kid · Toggle +1</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-ink/50 hover:text-coral">
            <LogOut size={18} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            onClick={() => setTab('checkin')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-heading border-2 transition-all ${
              tab === 'checkin' ? 'bg-coral text-white border-coral shadow-pop-coral' : 'bg-card text-ink/60 border-ink/8'
            }`}
          >
            ✨ New Check-In
          </button>
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-heading border-2 transition-all relative ${
              tab === 'active' ? 'bg-mint text-ink border-mint shadow-pop-mint' : 'bg-card text-ink/60 border-ink/8'
            }`}
          >
            🟢 Active ({activeSessions.length})
          </button>
        </div>
      </div>

      <div className="px-4 pt-5">
        {tab === 'checkin' && (
          <>
            {/* Search */}
            <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop">
              <p className="text-xs font-heading text-ink/60 mb-2">Scan QR or enter booking #</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="QR code or GOOF-12345"
                    className="w-full pl-10 pr-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral transition-colors"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="px-5 py-3 bg-gradient-coral rounded-2xl text-sm font-heading text-white shadow-pop-coral"
                >
                  Find
                </motion.button>
              </div>
            </div>

            {/* Scanned booking */}
            <AnimatePresence>
              {scannedBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 space-y-4"
                >
                  {/* Booking info */}
                  <div className="bg-gradient-butter rounded-3xl p-4 shadow-pop-butter">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-heading text-ink/70 uppercase tracking-wider">Booking</p>
                        <p className="font-display text-lg text-ink">{scannedBooking.booking_number}</p>
                      </div>
                      <button onClick={() => setScannedBooking(null)} className="w-8 h-8 rounded-xl bg-ink/10 flex items-center justify-center">
                        <X size={14} className="text-ink" />
                      </button>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm font-heading text-ink">{scannedBooking.package_name}</p>
                      <p className="text-xs text-ink/70">
                        👤 {scannedBooking.customer_name || 'Guest'} · 📞 {scannedBooking.customer_phone || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Pick a kid */}
                  <div>
                    <p className="text-xs font-heading text-ink/70 mb-2 flex items-center gap-1.5">
                      <Users size={13} /> Which kid is checking in?
                    </p>
                    {parentKids.length === 0 ? (
                      <div className="bg-card border-2 border-dashed border-coral/30 rounded-3xl p-5 text-center">
                        <p className="text-sm text-ink/60">No kids on this parent's profile</p>
                        <p className="text-[11px] text-ink/45 mt-1">Ask the parent to add their kid in their app first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {parentKids.map(kid => {
                          const age = calcAge(kid.date_of_birth);
                          const selected = selectedKidId === kid.id;
                          return (
                            <motion.button
                              key={kid.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedKidId(kid.id)}
                              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                                selected
                                  ? 'border-coral bg-coral/10 shadow-pop-coral'
                                  : 'border-ink/8 bg-card'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display text-lg text-white ${
                                  selected ? 'bg-gradient-coral' : 'bg-gradient-mint'
                                }`}>
                                  {kid.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-heading text-sm text-ink truncate">{kid.name}</p>
                                  {age !== null && <p className="text-[10px] text-ink/55">{age} yrs</p>}
                                </div>
                              </div>
                              {selected && (
                                <div className="mt-2 flex items-center gap-1 text-coral text-[11px] font-heading">
                                  <CheckCircle2 size={11} /> Selected
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* +1 toggle */}
                  {selectedKidId && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPlusOne(!plusOne)}
                      className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center justify-between ${
                        plusOne
                          ? 'bg-gradient-mint border-mint shadow-pop-mint'
                          : 'bg-card border-ink/8'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                          plusOne ? 'bg-white/30' : 'bg-mint/15'
                        }`}>
                          🤝
                        </div>
                        <div>
                          <p className={`font-heading text-sm ${plusOne ? 'text-ink' : 'text-ink'}`}>
                            +1 Friend Tagged Along
                          </p>
                          <p className={`text-[11px] ${plusOne ? 'text-ink/70' : 'text-ink/50'}`}>
                            {plusOne ? '2× hours will be deducted' : 'Tap if a friend is joining'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${
                        plusOne ? 'bg-ink/80' : 'bg-ink/15'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-soft transition-transform ${
                          plusOne ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </motion.button>
                  )}

                  {/* Confirm */}
                  {selectedKidId && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCheckIn}
                      disabled={submitting}
                      className="w-full py-4 bg-gradient-coral rounded-2xl font-heading text-base text-white shadow-pop-coral flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      {submitting ? 'Checking in…' : `Check In ${plusOne ? '(+1)' : ''}`}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {tab === 'active' && (
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <div className="bg-card border-2 border-ink/8 rounded-3xl p-8 text-center shadow-soft">
                <div className="w-16 h-16 rounded-3xl bg-mint/15 flex items-center justify-center mx-auto mb-3 text-3xl">
                  💤
                </div>
                <p className="font-display text-lg text-ink">No active sessions</p>
                <p className="text-xs text-ink/55 mt-1">Kids checked in will appear here</p>
              </div>
            ) : (
              activeSessions.map(s => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-mint flex items-center justify-center font-display text-lg text-ink shrink-0">
                        {s.kid_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base text-ink truncate">{s.kid_name || 'Guest'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className="text-mint" />
                          <span className="text-xs font-heading text-mint tabular-nums">{formatDuration(s.checked_in_at)}</span>
                          {s.plus_one && (
                            <span className="px-1.5 py-0.5 bg-coral/15 text-coral text-[9px] font-heading rounded-full">+1 ×2</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCheckOut(s.id)}
                      className="px-3.5 py-2 bg-gradient-coral rounded-xl text-xs font-heading text-white shadow-pop-coral shrink-0"
                    >
                      Check Out
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default StaffCheckInPage;
