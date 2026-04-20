import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { Users, Phone, Search, ArrowLeft, Ticket, CalendarCheck, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { fetchUnifiedTransactions, aggregateCustomers, type UnifiedCustomer, type UnifiedTxn } from '../lib/unifiedTransactions';

const OpsCustomersPage = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [allTxns, setAllTxns] = useState<UnifiedTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<UnifiedCustomer | null>(null);
  const [customerTxns, setCustomerTxns] = useState<UnifiedTxn[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const state = location.state as any;
    if (state?.openCustomer && customers.length > 0) {
      const match = customers.find(c => c.phone === state.openCustomer.phone);
      if (match) viewCustomer(match);
      window.history.replaceState({}, document.title);
    }
  }, [customers, location.state]);

  const fetchCustomers = async () => {
    const txns = await fetchUnifiedTransactions();
    setAllTxns(txns);
    setCustomers(aggregateCustomers(txns));
    setLoading(false);
  };

  const viewCustomer = async (customer: UnifiedCustomer) => {
    setSelectedCustomer(customer);
    window.scrollTo(0, 0);
    const matched = allTxns.filter(t => {
      if (customer.userId && t.user_id === customer.userId) return true;
      if (!customer.userId && t.customer_phone && t.customer_phone === customer.phone) return true;
      return false;
    });
    setCustomerTxns(matched);

    if (customer.userId) {
      const addrsRes = await supabase.from('addresses').select('*').eq('user_id', customer.userId).order('created_at', { ascending: false });
      setCustomerAddresses(addrsRes.data || []);
    } else {
      setCustomerAddresses([]);
    }
  };

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const txnLabel = (t: UnifiedTxn) => {
    if (t.source === 'pack') return { tag: 'PACK', cls: 'bg-purple-500/10 text-purple-400', subtitle: t.pack_name || 'Play Pack' };
    if (t.source === 'booking') return { tag: 'BOOKING', cls: 'bg-blue-500/10 text-blue-400', subtitle: `${t.package_name} · ${t.booking_date}` };
    return { tag: 'ORDER', cls: 'bg-secondary/10 text-secondary', subtitle: t.number };
  };

  if (selectedCustomer) {
    const avg = selectedCustomer.totalTransactions > 0
      ? Math.round(selectedCustomer.totalSpent / selectedCustomer.totalTransactions) : 0;
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedCustomer(null); setCustomerTxns([]); setCustomerAddresses([]); }}>
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-heading text-lg text-foreground">{selectedCustomer.name}</h1>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Users size={20} className="text-secondary" />
              </div>
              <div>
                <p className="font-heading text-base text-foreground">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} /> {selectedCustomer.phone}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div className="text-center">
                <p className="font-heading text-lg text-secondary">{selectedCustomer.totalTransactions}</p>
                <p className="text-[10px] text-muted-foreground">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg text-secondary">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg text-secondary">₹{avg}</p>
                <p className="text-[10px] text-muted-foreground">Avg Ticket</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Ticket size={10} className="text-purple-400" /> {selectedCustomer.packs} packs
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <CalendarCheck size={10} className="text-blue-400" /> {selectedCustomer.bookings} bookings
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <ShoppingBag size={10} className="text-secondary" /> {selectedCustomer.orders} orders
              </div>
            </div>
          </div>

          {customerAddresses.length > 0 && (
            <div>
              <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Saved Addresses</h2>
              <div className="space-y-2">
                {customerAddresses.map((addr: any) => (
                  <div key={addr.id} className="bg-card border border-border rounded-lg p-3">
                    <p className="text-xs font-medium text-foreground">{addr.label || 'Delivery'}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Activity History</h2>
            {customerTxns.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No activity found</p>
            ) : (
              <div className="space-y-2">
                {customerTxns.map(t => {
                  const lbl = txnLabel(t);
                  return (
                    <div key={`${t.source}-${t.id}`} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${lbl.cls}`}>{lbl.tag}</span>
                          <span className="font-heading text-sm text-foreground">{t.number}</span>
                        </div>
                        <span className="font-heading text-foreground">₹{t.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span className="truncate">{lbl.subtitle}</span>
                        <span>{formatDate(t.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <OpsBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg text-gradient-gold">Customers</h1>
          <span className="text-xs text-muted-foreground">{filtered.length} customers</span>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No customers yet</p>
            <p className="text-xs mt-1 opacity-60">Customers appear after their first pack, booking, or order</p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <motion.button
              key={c.userId || c.phone + c.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => viewCustomer(c)}
              className="w-full bg-card border border-border rounded-lg p-3 flex items-center justify-between text-left hover:border-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Users size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-heading text-secondary">₹{c.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{c.totalTransactions} sale{c.totalTransactions > 1 ? 's' : ''}</p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsCustomersPage;
