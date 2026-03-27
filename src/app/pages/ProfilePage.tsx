import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, ChevronRight, Volume2, VolumeX, Bell, BellOff, LogOut, Award, MapPin, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    userName, walletBalance, totalOrders, referralCode, userId,
    musicEnabled, setMusicEnabled, notificationsEnabled, setNotificationsEnabled,
    setLoggedIn, badges,
  } = useAppStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    // Fetch saved addresses
    supabase.from('addresses' as any).select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAddresses(data || []));

    // Fetch recent orders
    supabase.from('orders').select('id, order_number, total, status, created_at')
      .eq('user_id' as any, userId)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecentOrders(data || []));
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    navigate('/');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Profile</h1>
        </div>
      </header>

      {/* Profile card */}
      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-secondary/20 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-3xl mx-auto">👑</div>
          <p className="font-heading text-lg text-foreground mt-3">{userName}</p>
          <p className="text-xs text-muted-foreground">{totalOrders} orders placed</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Orders', value: totalOrders.toString(), icon: '📦' },
          { label: 'Biryan Points', value: `${walletBalance}`, icon: '💰' },
          { label: 'Badges', value: badges.length.toString(), icon: '🏅' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg">{stat.icon}</p>
            <p className="font-heading text-sm text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-foreground font-semibold flex items-center gap-1.5">
              <Package size={14} className="text-secondary" /> Recent Orders
            </p>
            <button onClick={() => navigate('/orders')} className="text-xs text-secondary font-medium">View All</button>
          </div>
          <div className="space-y-1.5">
            {recentOrders.map(o => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-heading text-foreground">{o.order_number}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-heading text-secondary">₹{Number(o.total).toLocaleString()}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    o.status === 'delivered' ? 'bg-green-500/10 text-green-500'
                    : o.status === 'cancelled' ? 'bg-red-500/10 text-red-500'
                    : 'bg-secondary/10 text-secondary'
                  }`}>
                    {o.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Addresses */}
      {addresses.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-sm text-foreground font-semibold mb-2 flex items-center gap-1.5">
            <MapPin size={14} className="text-secondary" /> Saved Addresses
          </p>
          <div className="space-y-1.5">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs font-medium text-foreground">
                  {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{addr.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-sm text-foreground font-semibold mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-secondary" /> Earned Badges
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {badges.map(b => (
              <div key={b.id} className="bg-card border border-border rounded-xl p-3 text-center min-w-[80px] shrink-0">
                <span className="text-2xl">{b.icon}</span>
                <p className="text-[10px] font-medium text-foreground mt-1">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral */}
      <div className="px-4 pt-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm font-mono text-foreground">{referralCode}</span>
            <button onClick={() => navigator.clipboard.writeText(referralCode)}>
              <Copy size={14} className="text-secondary" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Earn Biryan Points per successful referral</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 pt-4 space-y-1">
        {[
          { label: 'Biryan Points Wallet', path: '/wallet', icon: '💰' },
          { label: 'Order History', path: '/orders', icon: '📦' },
        ].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <span className="text-base">{item.icon}</span>
            <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Toggles */}
      <div className="px-4 pt-4 space-y-2">
        <button onClick={() => setMusicEnabled(!musicEnabled)}
          className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {musicEnabled ? <Volume2 size={16} className="text-secondary" /> : <VolumeX size={16} className="text-muted-foreground" />}
            <span className="text-sm text-foreground">Music</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors ${musicEnabled ? 'bg-secondary' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>
        <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? <Bell size={16} className="text-secondary" /> : <BellOff size={16} className="text-muted-foreground" />}
            <span className="text-sm text-foreground">Notifications</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors ${notificationsEnabled ? 'bg-secondary' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pt-6 pb-8">
        <button onClick={handleLogout}
          className="w-full py-3 border border-accent/30 rounded-xl text-accent text-sm font-heading flex items-center justify-center gap-2">
          <LogOut size={14} /> Leave the Sultanat
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
