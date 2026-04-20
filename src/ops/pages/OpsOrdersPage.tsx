import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import DateRangeFilter, { DateRange, getDateRange } from '../components/DateRangeFilter';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Phone, Ticket, CalendarCheck, ShoppingBag,
  AlertTriangle, Clock, Package, Hourglass, ChevronRight,
} from 'lucide-react';

/* ── Types ── */
type SaleKind = 'pack' | 'booking' | 'order';

interface Sale {
  kind: SaleKind;
  id: string;
  number: string;
  customer_name: string;
  customer_phone: string;
  user_id: string | null;
  amount: number;
  status: string;
  created_at: string;
  // pack
  pack_name?: string;
  pack_type?: string;
  total_hours?: number;
  hours_used?: number;
  expires_at?: string | null;
  // booking
  package_name?: string;
  booking_date?: string;
  slot_time?: string;
  num_kids?: number;
}

const PACK_EXPIRY_DAYS = 60; // default expiry after purchase if pack hasn't been used up

/* ── Helpers ── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

const computePackExpiry = (purchasedAt: string) => {
  const d = new Date(purchasedAt);
  d.setDate(d.getDate() + PACK_EXPIRY_DAYS);
  return d.toISOString();
};

/* ── Tag styles per kind ── */
const KIND_META: Record<SaleKind, { label: string; icon: any; color: string; bg: string; border: string }> = {
  pack: { label: 'Pack', icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-l-purple-500' },
  booking: { label: 'Booking', icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
  order: { label: 'Food Order', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
};

/* ══════════════════════════════════════════════ */

const OpsOrdersPage = () => {
  const navigate = useNavigate();
  const { role, storeId } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | SaleKind | 'expiring'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('ops-sales-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_packs' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dateRange, customFrom, customTo, storeId, role]);

  const fetchAll = async () => {
    const { from, to } = getDateRange(dateRange, customFrom, customTo);

    const ordersQuery = supabase.from('orders').select('*').gte('created_at', from).lte('created_at', to);
    if (role === 'store_manager' && storeId) ordersQuery.eq('store_id', storeId);

    const [packsRes, bookingsRes, ordersRes, profilesRes] = await Promise.all([
      supabase.from('user_packs').select('*').gte('purchased_at', from).lte('purchased_at', to),
      supabase.from('bookings').select('*').gte('created_at', from).lte('created_at', to),
      ordersQuery,
      supabase.from('profiles').select('user_id, phone, full_name'),
    ]);

    const profileMap = new Map<string, { phone: string | null; name: string | null }>();
    (profilesRes.data || []).forEach(p => profileMap.set(p.user_id, { phone: p.phone, name: p.full_name }));

    const merged: Sale[] = [];

    (packsRes.data || []).forEach((p: any) => {
      const prof = profileMap.get(p.user_id);
      merged.push({
        kind: 'pack',
        id: p.id,
        number: `PACK-${p.id.slice(0, 6).toUpperCase()}`,
        customer_name: prof?.name || 'Goofer',
        customer_phone: prof?.phone || '',
        user_id: p.user_id,
        amount: Number(p.amount_paid) || 0,
        status: p.status,
        created_at: p.purchased_at,
        pack_name: p.pack_name,
        pack_type: 'Hour Pack',
        total_hours: Number(p.total_hours) || 0,
        hours_used: Number(p.hours_used) || 0,
        expires_at: computePackExpiry(p.purchased_at),
      });
    });

    (bookingsRes.data || []).forEach((b: any) => {
      const prof = b.user_id ? profileMap.get(b.user_id) : null;
      merged.push({
        kind: 'booking',
        id: b.id,
        number: b.booking_number || `GOOF-${b.id.slice(0, 6).toUpperCase()}`,
        customer_name: b.customer_name || prof?.name || 'Goofer',
        customer_phone: b.customer_phone || prof?.phone || '',
        user_id: b.user_id,
        amount: Number(b.total_amount) || 0,
        status: b.status,
        created_at: b.created_at,
        package_name: b.package_name,
        booking_date: b.booking_date,
        slot_time: b.slot_time,
        num_kids: b.num_kids,
      });
    });

    (ordersRes.data || []).forEach((o: any) => {
      const prof = o.user_id ? profileMap.get(o.user_id) : null;
      merged.push({
        kind: 'order',
        id: o.id,
        number: o.order_number,
        customer_name: o.customer_name || prof?.name || 'Goofer',
        customer_phone: o.customer_phone || prof?.phone || '',
        user_id: o.user_id,
        amount: Number(o.total) || 0,
        status: o.status,
        created_at: o.created_at,
      });
    });

    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setSales(merged);
    setLoading(false);
  };

  /* ── Computed counts ── */
  const expiringPacks = sales.filter(s => {
    if (s.kind !== 'pack' || s.status !== 'active') return false;
    if (!s.expires_at) return false;
    const days = daysUntil(s.expires_at);
    const hoursLeft = (s.total_hours || 0) - (s.hours_used || 0);
    return days <= 14 && hoursLeft > 0;
  });

  const counts = {
    all: sales.length,
    pack: sales.filter(s => s.kind === 'pack').length,
    booking: sales.filter(s => s.kind === 'booking').length,
    order: sales.filter(s => s.kind === 'order').length,
    expiring: expiringPacks.length,
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);

  const filtered = sales.filter(s => {
    if (kindFilter === 'expiring') {
      if (!expiringPacks.find(e => e.id === s.id)) return false;
    } else if (kindFilter !== 'all' && s.kind !== kindFilter) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.number.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q) ||
      s.customer_phone.includes(search)
    );
  });

  const goToCustomer = (s: Sale) => {
    navigate('/ops/customers', {
      state: { openCustomer: { phone: s.customer_phone, name: s.customer_name, userId: s.user_id } },
    });
  };

  const FILTER_TABS: { key: typeof kindFilter; label: string; count: number; tone: string }[] = [
    { key: 'all', label: 'All Sales', count: counts.all, tone: 'text-foreground' },
    { key: 'pack', label: 'Packs', count: counts.pack, tone: 'text-purple-500' },
    { key: 'booking', label: 'Bookings', count: counts.booking, tone: 'text-blue-500' },
    { key: 'order', label: 'Food', count: counts.order, tone: 'text-amber-500' },
    { key: 'expiring', label: '⚠ Expiring', count: counts.expiring, tone: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-heading text-lg text-gradient-gold">Sales</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {counts.all} total · ₹{totalRevenue.toLocaleString()} revenue
            </p>
          </div>
          {counts.expiring > 0 && (
            <button
              onClick={() => setKindFilter('expiring')}
              className="px-2.5 py-1 bg-red-500/15 border border-red-500/25 rounded-full text-xs font-bold text-red-500 flex items-center gap-1 animate-pulse"
            >
              <AlertTriangle size={10} /> {counts.expiring} expiring
            </button>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search number, name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary"
          />
        </div>

        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map(t => {
          const isActive = kindFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setKindFilter(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-secondary/20 text-secondary border-secondary/30 scale-105'
                  : `bg-card ${t.tone} border-border hover:border-muted-foreground/30`
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-secondary/30 text-secondary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sales list */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No sales found</p>
            <p className="text-xs mt-1 opacity-60">
              {kindFilter === 'expiring' ? 'No packs expiring soon — great!' : 'Try a different date or filter'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((s, idx) => {
              const meta = KIND_META[s.kind];
              const Icon = meta.icon;

              // Pack expiry computation
              const isPack = s.kind === 'pack';
              const hoursLeft = isPack ? (s.total_hours || 0) - (s.hours_used || 0) : 0;
              const daysToExpiry = isPack && s.expires_at ? daysUntil(s.expires_at) : 0;
              const isExpired = isPack && daysToExpiry <= 0 && hoursLeft > 0;
              const isExpiringSoon = isPack && daysToExpiry > 0 && daysToExpiry <= 14 && hoursLeft > 0;
              const isUsedUp = isPack && hoursLeft <= 0;

              return (
                <motion.div
                  key={`${s.kind}-${s.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`bg-card border border-border rounded-2xl border-l-4 ${meta.border} overflow-hidden`}
                >
                  <div className="p-4 space-y-2.5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} flex items-center gap-1`}>
                            <Icon size={10} /> {meta.label}
                          </span>
                          <span className="font-heading text-sm text-foreground truncate">{s.number}</span>
                          <span className="font-heading text-sm text-secondary">₹{s.amount.toLocaleString()}</span>
                        </div>

                        {/* Customer button — links to profile */}
                        <button
                          onClick={() => goToCustomer(s)}
                          className="mt-2 flex items-center gap-2 group"
                        >
                          <span className="text-sm font-medium text-foreground group-hover:text-secondary transition-colors">
                            {s.customer_name}
                          </span>
                          {s.customer_phone ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone size={10} /> {s.customer_phone}
                            </span>
                          ) : (
                            <span className="text-xs text-red-400 italic">no phone</span>
                          )}
                          <ChevronRight size={12} className="text-muted-foreground group-hover:text-secondary transition-colors" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock size={10} /> {fmtTime(s.created_at)}
                        </div>
                        <div className="mt-0.5">{fmtDate(s.created_at)}</div>
                      </div>
                    </div>

                    {/* Pack-specific row: hours + expiry */}
                    {isPack && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Hourglass size={11} className="text-purple-500" />
                            <span className="text-foreground font-medium">{hoursLeft}h</span> of {s.total_hours}h left
                          </span>
                          <span className="text-foreground/70">{s.pack_name}</span>
                        </div>
                        {isExpired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30">
                            EXPIRED
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                            ⚠ {daysToExpiry}d to expire
                          </span>
                        ) : isUsedUp ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            USED
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {daysToExpiry}d valid
                          </span>
                        )}
                      </div>
                    )}

                    {/* Booking-specific row */}
                    {s.kind === 'booking' && (
                      <div className="flex items-center gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarCheck size={11} className="text-blue-500" />
                          <span className="text-foreground">{s.booking_date}</span>
                        </span>
                        <span>{String(s.slot_time || '').slice(0, 5)}</span>
                        <span>{s.num_kids} kid{(s.num_kids || 0) > 1 ? 's' : ''}</span>
                        <span className="text-foreground/70 truncate">{s.package_name}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsOrdersPage;
