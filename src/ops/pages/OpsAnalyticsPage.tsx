import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, Users, Repeat } from 'lucide-react';

const COLORS = ['hsl(43, 80%, 55%)', 'hsl(30, 90%, 50%)', 'hsl(5, 70%, 40%)', 'hsl(200, 70%, 50%)'];

const OpsAnalyticsPage = () => {
  const [stats, setStats] = useState({ revenue: 0, aov: 0, totalCustomers: 0, repeatRate: 0 });
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: orders } = await supabase.from('orders').select('total, status, customer_phone');
    if (!orders) return;

    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const delivered = orders.filter(o => o.status === 'delivered');
    const aov = delivered.length ? revenue / delivered.length : 0;

    const phones = orders.map(o => o.customer_phone).filter(Boolean);
    const uniquePhones = new Set(phones);
    const repeatPhones = phones.filter((p, _, arr) => arr.filter(x => x === p).length > 1);
    const repeatRate = uniquePhones.size ? (new Set(repeatPhones).size / uniquePhones.size) * 100 : 0;

    setStats({ revenue, aov, totalCustomers: uniquePhones.size, repeatRate });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Analytics</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-400' },
            { label: 'Avg Order Value', value: `₹${Math.round(stats.aov)}`, icon: TrendingUp, color: 'text-secondary' },
            { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-400' },
            { label: 'Repeat Rate', value: `${Math.round(stats.repeatRate)}%`, icon: Repeat, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-muted-foreground text-xs">{stat.label}</span>
              </div>
              <p className="font-heading text-xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Order Status Distribution */}
        {statusData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-heading text-sm text-foreground mb-4">Order Status Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsAnalyticsPage;
