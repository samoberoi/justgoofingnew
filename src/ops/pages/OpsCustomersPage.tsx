import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { Users, Phone, ShoppingBag, Search, Crown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Customer {
  name: string;
  phone: string;
  orders: number;
  spent: number;
  lastOrderDate: string;
}

const OpsCustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, total, created_at, status')
      .order('created_at', { ascending: false });

    if (!orders) { setLoading(false); return; }

    const map = new Map<string, Customer>();
    orders.forEach(o => {
      const key = o.customer_phone || o.customer_name || 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.orders += 1;
        existing.spent += Number(o.total);
      } else {
        map.set(key, {
          name: o.customer_name || 'Guest',
          phone: o.customer_phone || '-',
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
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', customer.phone)
      .order('created_at', { ascending: false })
      .limit(20);
    setCustomerOrders(data || []);
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
            <button onClick={() => setSelectedCustomer(null)}><ArrowLeft size={20} className="text-foreground" /></button>
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
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {selectedCustomer.phone}</p>
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

          {/* Order history */}
          <div>
            <h2 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Order History</h2>
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
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="font-heading text-foreground">₹{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
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
              key={c.phone}
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
