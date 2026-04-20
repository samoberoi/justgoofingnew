import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, CheckCircle2, Clock, Users, X, LogOut, ScanLine, Wallet, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import QrScanner from '../components/QrScanner';
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

interface PendingPack {
  id: string;
  pack_name: string;
  total_hours: number;
  amount_paid: number;
  user_id: string;
  purchased_at: string;
  customer_name?: string | null;
  customer_phone?: string | null;
}

const StaffCheckInPage = () => {
  const navigate = useNavigate();
  const { user, storeId } = useAuth();

  const [tab, setTab] = useState<'checkin' | 'active' | 'pending'>('checkin');
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [parentKids, setParentKids] = useState<KidRow[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [pendingPacks, setPendingPacks] = useState<PendingPack[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
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

  // Load packs awaiting payment settlement (this store, or all if super-admin with no store)
  const loadPending = async () => {
    let q = supabase
      .from('user_packs' as any)
      .select('id, pack_name, total_hours, amount_paid, user_id, purchased_at')
      .eq('status', 'pending')
      .order('purchased_at', { ascending: false });
    if (storeId) q = q.eq('store_id', storeId);
    const { data: packsData } = await q;
    const list = (packsData as any[]) || [];
    if (list.length === 0) { setPendingPacks([]); return; }
    const userIds = Array.from(new Set(list.map(p => p.user_id)));
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', userIds);
    const profMap = new Map<string, any>((profs || []).map((p: any) => [p.user_id, p]));
    setPendingPacks(list.map(p => ({
      ...p,
      customer_name: profMap.get(p.user_id)?.full_name || null,
      customer_phone: profMap.get(p.user_id)?.phone || null,
    })));
  };

  useEffect(() => {
    loadActive();
    loadPending();
    const ch = supabase
      .channel('staff-checkin-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_sessions' }, () => loadActive())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_packs' }, () => loadPending())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  // Settle payment for a pending pack
  const handleSettlePayment = async (packId: string, method: 'cash' | 'upi' | 'card' | 'online') => {
    setSettlingId(packId);
    const { error } = await supabase
      .from('user_packs' as any)
      .update({
        status: 'active',
        payment_status: 'paid',
        payment_method: method,
        paid_at: new Date().toISOString(),
        settled_by: user?.id || null,
      } as any)
      .eq('id', packId);

    if (error) {
      toast.error('Could not settle payment', { description: error.message });
      setSettlingId(null);
      return;
    }

    // Award Goofy Points on settlement
    const pack = pendingPacks.find(p => p.id === packId);
    if (pack && Number(pack.amount_paid) > 0) {
      const { data: settings } = await supabase
        .from('points_settings')
        .select('earning_enabled, earning_percent, max_earn_per_order, expiry_days')
        .limit(1).maybeSingle();
      if (settings?.earning_enabled) {
        let earned = Math.floor((Number(pack.amount_paid) * Number(settings.earning_percent)) / 100);
        if (settings.max_earn_per_order) earned = Math.min(earned, Number(settings.max_earn_per_order));
        if (earned > 0) {
          const { data: prevTx } = await supabase
            .from('points_transactions')
            .select('balance_after')
            .eq('user_id', pack.user_id)
            .order('created_at', { ascending: false })
            .limit(1).maybeSingle();
          const balanceAfter = Number(prevTx?.balance_after || 0) + earned;
          const expiresAt = settings.expiry_days
            ? new Date(Date.now() + Number(settings.expiry_days) * 86400000).toISOString()
            : null;
          await supabase.from('points_transactions').insert({
            user_id: pack.user_id,
            type: 'earned',
            amount: earned,
            balance_after: balanceAfter,
            description: `Earned on ${pack.pack_name}`,
            expires_at: expiresAt,
          });
        }
      }
    }

    toast.success(`Payment settled via ${method.toUpperCase()} ✅`, {
      description: 'Pack is now active for the customer.',
    });
    setSettlingId(null);
    loadPending();
  };

  // Helper: load a customer by user_id and prepare a synthetic "checkin context"
  const loadCustomerByUserId = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', userId)
      .maybeSingle();

    // Look for an upcoming/active booking
    const today = new Date().toISOString().split('T')[0];
    const { data: booking } = await supabase
      .from('bookings' as any)
      .select('id, booking_number, qr_code, package_name, customer_name, customer_phone, user_id, num_kids, status, booking_date, slot_time')
      .eq('user_id', userId)
      .in('status', ['booked', 'pending', 'confirmed'])
      .gte('booking_date', today)
      .order('booking_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    let bookingForCheckin: Booking;
    if (booking) {
      bookingForCheckin = booking as any;
    } else {
      // Look for an active pack — synthesize a "walk-in" booking shell
      const { data: activePackRaw } = await supabase
        .from('user_packs' as any)
        .select('id, pack_name, total_hours, hours_used, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('purchased_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const activePack = activePackRaw as any;

      if (!activePack) {
        // Maybe they have a pending (unpaid) pack
        const { data: pendingPackRaw } = await supabase
          .from('user_packs' as any)
          .select('id, pack_name, status')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();
        const pendingPack = pendingPackRaw as any;
        if (pendingPack) {
          toast.error('Pack not paid yet', {
            description: `Settle ₹ in the Pay tab first, then scan again.`,
          });
          setTab('pending');
          return;
        }
        toast.error('No active pack or booking', {
          description: `${profile?.full_name || 'Customer'} has nothing to check in to.`,
        });
        return;
      }

      const remaining = Number(activePack.total_hours) - Number(activePack.hours_used);
      bookingForCheckin = {
        id: '',
        booking_number: 'WALK-IN',
        qr_code: '',
        package_name: `${activePack.pack_name} · ${remaining}h left`,
        customer_name: profile?.full_name || null,
        customer_phone: profile?.phone || null,
        user_id: userId,
        num_kids: 1,
        status: 'walkin',
        booking_date: today,
        slot_time: '00:00:00',
      };
    }

    setScannedBooking(bookingForCheckin);

    const { data: kids } = await supabase
      .from('kids' as any)
      .select('id, name, date_of_birth, gender, school')
      .eq('parent_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    setParentKids((kids as any) || []);
    setSelectedKidId(null);
    setPlusOne(false);
  };

  // Search booking by QR code, booking number, customer QR token, or phone number
  const handleSearch = async () => {
    if (!search.trim()) return;
    const term = search.trim();

    // Customer QR token format: "JG:<userId>:<ts>:<rand>"
    if (term.startsWith('JG:')) {
      const parts = term.split(':');
      const userId = parts[1];
      const ts = Number(parts[2]);
      if (!userId) {
        toast.error('Invalid QR code');
        return;
      }
      // Token is valid for 5 minutes (refreshes every minute, give buffer)
      if (ts && Date.now() / 1000 - ts > 300) {
        toast.error('QR code expired', { description: 'Ask customer to refresh their code' });
        return;
      }
      await loadCustomerByUserId(userId);
      return;
    }

    // Phone search (10 digits)
    if (/^\d{10}$/.test(term)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', term)
        .maybeSingle();
      if (profile?.user_id) {
        await loadCustomerByUserId(profile.user_id);
        return;
      }
    }

    // Booking lookup
    const { data } = await supabase
      .from('bookings' as any)
      .select('id, booking_number, qr_code, package_name, customer_name, customer_phone, user_id, num_kids, status, booking_date, slot_time')
      .or(`qr_code.eq.${term},booking_number.eq.${term.toUpperCase()}`)
      .maybeSingle();

    if (!data) {
      toast.error('Not found', { description: 'Try QR scan, booking #, or 10-digit phone' });
      setScannedBooking(null);
      return;
    }

    if ((data as any).status === 'completed' || (data as any).status === 'cancelled') {
      toast.error(`This booking is ${(data as any).status}`);
      return;
    }

    setScannedBooking(data as any);

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

    const isWalkIn = !scannedBooking.id;

    const { error: sessionError } = await supabase
      .from('play_sessions' as any)
      .insert({
        booking_id: isWalkIn ? null : scannedBooking.id,
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

    if (!isWalkIn) {
      await supabase
        .from('bookings' as any)
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', scannedBooking.id);
    }

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
        <div className="flex gap-1.5 px-4 pb-3">
          <button
            onClick={() => setTab('checkin')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-heading border-2 transition-all ${
              tab === 'checkin' ? 'bg-coral text-white border-coral shadow-pop-coral' : 'bg-card text-ink/60 border-ink/8'
            }`}
          >
            ✨ Check-In
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-heading border-2 transition-all ${
              tab === 'pending' ? 'bg-butter text-ink border-butter shadow-pop-butter' : 'bg-card text-ink/60 border-ink/8'
            }`}
          >
            💰 Pay ({pendingPacks.length})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-heading border-2 transition-all ${
              tab === 'active' ? 'bg-mint text-ink border-mint shadow-pop-mint' : 'bg-card text-ink/60 border-ink/8'
            }`}
          >
            🟢 Active ({activeSessions.length})
          </button>
        </div>
      </div>

      <AnimatePresence>
        {scannerOpen && (
          <QrScanner
            onClose={() => setScannerOpen(false)}
            onResult={(text) => {
              setScannerOpen(false);
              setSearch(text);
              setTimeout(() => handleSearch(), 50);
            }}
          />
        )}
      </AnimatePresence>

      <div className="px-4 pt-5">
        {tab === 'checkin' && (
          <>
            {/* Search */}
            <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop">
              <p className="text-xs font-heading text-ink/60 mb-2">Scan customer QR · or type booking # / phone</p>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setScannerOpen(true)}
                  className="px-3 py-3 bg-ink rounded-2xl text-cream shadow-pop flex items-center gap-1.5"
                  title="Open camera scanner"
                >
                  <ScanLine size={18} />
                  <span className="text-xs font-heading hidden sm:inline">Scan</span>
                </motion.button>
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="QR or GOOF-12345"
                    className="w-full pl-10 pr-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral transition-colors"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="px-4 py-3 bg-gradient-coral rounded-2xl text-sm font-heading text-white shadow-pop-coral"
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

        {tab === 'pending' && (
          <div className="space-y-3">
            {pendingPacks.length === 0 ? (
              <div className="bg-card border-2 border-ink/8 rounded-3xl p-8 text-center shadow-soft">
                <div className="w-16 h-16 rounded-3xl bg-butter/30 flex items-center justify-center mx-auto mb-3 text-3xl">💰</div>
                <p className="font-display text-lg text-ink">All paid up!</p>
                <p className="text-xs text-ink/55 mt-1">No packs waiting for payment</p>
              </div>
            ) : (
              pendingPacks.map(p => (
                <SettleCard
                  key={p.id}
                  pack={p}
                  onSettle={(method) => handleSettlePayment(p.id, method)}
                  busy={settlingId === p.id}
                />
              ))
            )}
          </div>
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

const SettleCard = ({ pack, onSettle, busy }: { pack: PendingPack; onSettle: (m: 'cash' | 'upi' | 'card' | 'online') => void; busy: boolean }) => {
  const [picking, setPicking] = useState(false);
  const methods: { key: 'cash' | 'upi' | 'card' | 'online'; label: string; emoji: string }[] = [
    { key: 'cash', label: 'Cash', emoji: '💵' },
    { key: 'upi', label: 'UPI / Paytm', emoji: '📱' },
    { key: 'card', label: 'Card', emoji: '💳' },
    { key: 'online', label: 'Online', emoji: '🌐' },
  ];
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-base text-ink truncate">{pack.pack_name}</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-coral text-white font-display">PENDING</span>
          </div>
          <p className="text-xs text-ink/70 mt-1">
            👤 {pack.customer_name || 'Guest'} · 📞 {pack.customer_phone || '—'}
          </p>
          <p className="text-xs text-ink/60 mt-0.5">
            {pack.total_hours} hrs · reserved {new Date(pack.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-2xl text-ink leading-none">₹{Number(pack.amount_paid)}</p>
        </div>
      </div>
      {!picking ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setPicking(true)}
          disabled={busy}
          className="mt-3 w-full py-3 bg-gradient-coral rounded-2xl text-sm font-heading text-white shadow-pop-coral flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Wallet size={16} /> Settle Payment
        </motion.button>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {methods.map(m => (
            <motion.button
              key={m.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSettle(m.key)}
              disabled={busy}
              className="py-3 bg-mint/20 border-2 border-ink/8 rounded-2xl text-xs font-heading text-ink hover:bg-mint/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{m.emoji}</span> {m.label}
            </motion.button>
          ))}
          <button
            onClick={() => setPicking(false)}
            disabled={busy}
            className="col-span-2 py-2 text-xs text-ink/50 font-heading"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default StaffCheckInPage;
