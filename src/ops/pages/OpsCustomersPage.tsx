import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { Users, Phone, ShoppingBag } from 'lucide-react';

const OpsCustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: orders } = await supabase.from('orders').select('customer_name, customer_phone, total, created_at').order('created_at', { ascending: false });
    if (!orders) { setLoading(false); return; }

    // Aggregate by phone
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number }>();
    orders.forEach(o => {
      const key = o.customer_phone || o.customer_name || 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.orders += 1;
        existing.spent += Number(o.total);
      } else {
        map.set(key, { name: o.customer_name || 'Unknown', phone: o.customer_phone || '-', orders: 1, spent: Number(o.total) });
      }
    });

    setCustomers(Array.from(map.values()).sort((a, b) => b.spent - a.spent));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Customers</h1>
        <p className="text-xs text-muted-foreground">{customers.length} unique customers</p>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No customers yet</p>
          </div>
        ) : (
          customers.map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">₹{c.spent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{c.orders} orders</p>
              </div>
            </div>
          ))
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsCustomersPage;
