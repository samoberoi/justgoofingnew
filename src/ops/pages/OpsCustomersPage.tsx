import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { Users, Phone, ShoppingBag, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface Customer {
  name: string;
  phone: string;
  userId: string | null;
  orders: number;
  spent: number;
  lastOrderDate: string;
}

const OpsCustomersPage = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
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
    // Fetch orders and profiles in parallel
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from('orders').select('customer_name, customer_phone, total, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, phone, full_name'),
    ]);

    const orders = ordersRes.data;
    const profiles = profilesRes.data || [];
    if (!orders) { setLoading(false); return; }

    // Build a profile lookup by user_id
    const profileMap = new Map<string, { phone: string | null; name: string | null }>();
    profiles.forEach(p => profileMap.set(p.user_id, { phone: p.phone, name: p.full_name }));

    // Aggregate by user_id first, fallback to phone/name
    const map = new Map<string, Customer>();
    orders.forEach(o => {
      const profile = o.user_id ? profileMap.get(o.user_id) : null;
      const phone = o.customer_phone || profile?.phone || '';
      const name = o.customer_name || profile?.name || 'Guest';
      const key = o.user_id || phone || name;

      const existing = map.get(key);
      if (existing) {
        existing.orders += 1;
        existing.spent += Number(o.total);
        // Update phone/name if we now have better data
        if (!existing.phone && phone) existing.phone = phone;
        if (existing.name === 'Guest' && name !== 'Guest') existing.name = name;
      } else {
        map.set(key, {
          name,
          phone: phone || '-',
          userId: o.user_id || null,
          orders: 1,
          spent: Number(o.total),
          lastOrderDate: o.created_at,
        });
      }
    });

    setCustomers(Array.from(map.values()).sort((a, b) => b.spent - a.spent));
    setLoading(false);
  };

  const viewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    window.scrollTo(0, 0);

    // Build query based on available identifiers
    let ordersQuery = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
    if (customer.userId) {
      ordersQuery = ordersQuery.eq('user_id', customer.userId);
    } else if (customer.phone && customer.phone !== '-') {
      ordersQuery = ordersQuery.eq('customer_phone', customer.phone);
    } else {
      ordersQuery = ordersQuery.eq('customer_name', customer.name);
    }

    const ordersRes = await ordersQuery;
    setCustomerOrders(ordersRes.data || []);

    // Fetch addresses if we have a userId
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

  if (selectedCustomer) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); setCustomerAddresses([]); }}>
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-heading text-lg text-foreground">{selectedCustomer.name}</h1>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Customer summary */}
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
                <p className="font-heading text-lg text-secondary">{selectedCustomer.orders}</p>
                <p className="text-[10px] text-muted-foreground">Orders</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg text-secondary">₹{selectedCustomer.spent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg text-secondary">₹{Math.round(selectedCustomer.spent / selectedCustomer.orders)}</p>
                <p className="text-[10px] text-muted-foreground">Avg Order</p>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
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

          {/* Order history */}
          <div>
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Order History</h2>
            {customerOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No orders found</p>
            ) : (
              <div className="space-y-2">
                {customerOrders.map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm text-foreground">{order.order_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-500'
                          : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {order.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="font-heading text-foreground">₹{Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
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
            <p className="text-sm">No customers found</p>
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
                <p className="text-sm font-heading text-secondary">₹{c.spent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{c.orders} order{c.orders > 1 ? 's' : ''}</p>
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
