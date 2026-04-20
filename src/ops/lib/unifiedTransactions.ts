// Unified data layer for play-center business.
// Revenue = user_packs + bookings + orders combined.
// Customers = anyone who has bought a pack, made a booking, or placed an order.

import { supabase } from '@/integrations/supabase/client';

export type TxnSource = 'pack' | 'booking' | 'order';

export interface UnifiedTxn {
  id: string;
  source: TxnSource;
  number: string;            // display number (BRY-xxx, GOOF-xxx, or pack-id)
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  amount: number;
  status: string;
  created_at: string;
  // pack-specific
  pack_name?: string;
  total_hours?: number;
  hours_used?: number;
  // booking-specific
  booking_date?: string;
  slot_time?: string;
  package_name?: string;
  num_kids?: number;
  // order-specific
  discount?: number;
}

export interface UnifiedCustomer {
  userId: string | null;
  name: string;
  phone: string;
  totalSpent: number;
  totalTransactions: number;
  packs: number;
  bookings: number;
  orders: number;
  lastActivity: string;
  kidNames: string[];
}

/** Fetch packs+bookings+orders within a date range and unify them into one list. */
export const fetchUnifiedTransactions = async (
  fromIso?: string,
  toIso?: string
): Promise<UnifiedTxn[]> => {
  const packsQuery = supabase.from('user_packs').select('*').order('purchased_at', { ascending: false });
  const bookingsQuery = supabase.from('bookings').select('*').order('created_at', { ascending: false });
  const ordersQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });

  if (fromIso) {
    packsQuery.gte('purchased_at', fromIso);
    bookingsQuery.gte('created_at', fromIso);
    ordersQuery.gte('created_at', fromIso);
  }
  if (toIso) {
    packsQuery.lte('purchased_at', toIso);
    bookingsQuery.lte('created_at', toIso);
    ordersQuery.lte('created_at', toIso);
  }

  const [packsRes, bookingsRes, ordersRes, profilesRes, kidsRes] = await Promise.all([
    packsQuery,
    bookingsQuery,
    ordersQuery,
    supabase.from('profiles').select('user_id, phone, full_name, parent1_name, parent2_name'),
    supabase.from('kids').select('parent_user_id, name').eq('is_active', true),
  ]);

  const profileMap = new Map<string, { phone: string | null; name: string | null }>();
  (profilesRes.data || []).forEach((p: any) => {
    // Prefer full_name, fall back to parent1_name then parent2_name
    const resolved = p.full_name || p.parent1_name || p.parent2_name || null;
    profileMap.set(p.user_id, { phone: p.phone, name: resolved });
  });

  const kidsMap = new Map<string, string[]>();
  (kidsRes.data || []).forEach((k: any) => {
    if (!k.parent_user_id || !k.name) return;
    const arr = kidsMap.get(k.parent_user_id) || [];
    arr.push(k.name);
    kidsMap.set(k.parent_user_id, arr);
  });

  const txns: UnifiedTxn[] = [];

  (packsRes.data || []).forEach(p => {
    const profile = profileMap.get(p.user_id);
    txns.push({
      id: p.id,
      source: 'pack',
      number: `PACK-${p.id.slice(0, 6).toUpperCase()}`,
      user_id: p.user_id,
      customer_name: profile?.name || 'Guest',
      customer_phone: profile?.phone || '',
      amount: Number(p.amount_paid) || 0,
      status: p.status,
      created_at: p.purchased_at,
      pack_name: p.pack_name,
      total_hours: Number(p.total_hours) || 0,
      hours_used: Number(p.hours_used) || 0,
    });
  });

  (bookingsRes.data || []).forEach(b => {
    const profile = b.user_id ? profileMap.get(b.user_id) : null;
    txns.push({
      id: b.id,
      source: 'booking',
      number: b.booking_number || `GOOF-${b.id.slice(0, 6).toUpperCase()}`,
      user_id: b.user_id,
      customer_name: profile?.name || b.customer_name || 'Guest',
      customer_phone: b.customer_phone || profile?.phone || '',
      amount: Number(b.total_amount) || 0,
      status: b.status,
      created_at: b.created_at,
      package_name: b.package_name,
      booking_date: b.booking_date,
      slot_time: b.slot_time,
      num_kids: b.num_kids,
    });
  });

  (ordersRes.data || []).forEach(o => {
    const profile = o.user_id ? profileMap.get(o.user_id) : null;
    txns.push({
      id: o.id,
      source: 'order',
      number: o.order_number,
      user_id: o.user_id,
      customer_name: profile?.name || o.customer_name || 'Guest',
      customer_phone: o.customer_phone || profile?.phone || '',
      amount: Number(o.total) || 0,
      status: o.status,
      created_at: o.created_at,
      discount: Number(o.discount) || 0,
    });
  });

  txns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  // Attach kids list onto each txn via a side map (returned separately below)
  (txns as any)._kidsMap = kidsMap;
  return txns;
};

/** Aggregate transactions into customers by user_id (or phone fallback). */
export const aggregateCustomers = (txns: UnifiedTxn[]): UnifiedCustomer[] => {
  const kidsMap: Map<string, string[]> = (txns as any)._kidsMap || new Map();
  const map = new Map<string, UnifiedCustomer>();
  txns.forEach(t => {
    const key = t.user_id || t.customer_phone || t.customer_name || 'unknown';
    const existing = map.get(key);
    if (existing) {
      existing.totalSpent += t.amount;
      existing.totalTransactions += 1;
      if (t.source === 'pack') existing.packs += 1;
      if (t.source === 'booking') existing.bookings += 1;
      if (t.source === 'order') existing.orders += 1;
      if (new Date(t.created_at) > new Date(existing.lastActivity)) {
        existing.lastActivity = t.created_at;
      }
      if ((existing.name === 'Guest' || existing.name === 'Goofer') && t.customer_name && t.customer_name !== 'Guest' && t.customer_name !== 'Goofer') {
        existing.name = t.customer_name;
      }
      if (!existing.phone && t.customer_phone) existing.phone = t.customer_phone;
    } else {
      map.set(key, {
        userId: t.user_id,
        name: t.customer_name || 'Guest',
        phone: t.customer_phone || '-',
        totalSpent: t.amount,
        totalTransactions: 1,
        packs: t.source === 'pack' ? 1 : 0,
        bookings: t.source === 'booking' ? 1 : 0,
        orders: t.source === 'order' ? 1 : 0,
        lastActivity: t.created_at,
        kidNames: [],
      });
    }
  });
  // Attach kid names per customer
  map.forEach(c => {
    if (c.userId) c.kidNames = kidsMap.get(c.userId) || [];
  });
  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
};
