import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, ChevronRight, Volume2, VolumeX, Bell, BellOff, LogOut, Award, MapPin, Package, Share2, Check, Crown, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    userName, phoneNumber, walletBalance, totalOrders, referralCode, userId,
    musicEnabled, setMusicEnabled, notificationsEnabled, setNotificationsEnabled,
    setLoggedIn, badges,
  } = useAppStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (supabase.from('addresses' as any).select('*') as any).eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setAddresses(data || []));

    (supabase.from('orders').select('id, order_number, total, status, created_at') as any)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }: any) => setRecentOrders(data || []));
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    navigate('/');
  };

  const handleCopyReferral = () => {
    const shareText = `Join BIRYAAN — the Sultanat of Biryani! 🍛👑\n\nUse my referral code ${referralCode} when you sign up and we both earn Biryan Points!\n\nOrder now: https://biryaan.lovable.app`;
    if (navigator.share) {
      navigator.share({ title: 'BIRYAAN Referral', text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const tierName = totalOrders >= 50 ? 'Sultan' : totalOrders >= 25 ? 'Nawab' : totalOrders >= 10 ? 'Shahzada' : 'Sipahi';
  const tierEmoji = totalOrders >= 50 ? '👑' : totalOrders >= 25 ? '🏰' : totalOrders >= 10 ? '⚔️' : '🛡️';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Profile</h1>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-secondary/10 via-card to-card border border-secondary/15 rounded-2xl p-6 text-center relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 mughal-pattern opacity-30" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border-2 border-secondary/30 flex items-center justify-center text-4xl mx-auto shadow-gold">
              {tierEmoji}
            </div>
            <p className="font-heading text-lg text-foreground mt-3">{userName || 'Royal Guest'}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Crown size={12} className="text-secondary" />
              <span className="text-xs text-secondary font-heading uppercase tracking-wider">{tierName}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalOrders} orders placed</p>
          </div>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Orders', value: totalOrders.toString(), icon: '📦', color: 'from-primary/10 to-primary/5' },
          { label: 'Biryan Points', value: `${walletBalance}`, icon: '💰', color: 'from-secondary/10 to-secondary/5' },
          { label: 'Badges', value: badges.length.toString(), icon: '🏅', color: 'from-accent/10 to-accent/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} border border-border rounded-xl p-3 text-center`}>
            <p className="text-xl">{stat.icon}</p>
            <p className="font-heading text-base text-foreground mt-1">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Card — Enhanced */}
      <div className="px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-secondary/12 to-card border border-secondary/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-secondary" />
            <p className="text-sm font-heading text-foreground">Refer & Earn</p>
          </div>
          <p className="text-xs text-muted-foreground">Share your code — both you and your friend earn Biryan Points on their first order!</p>
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl p-3 border border-border">
            <span className="text-sm font-mono text-secondary font-bold flex-1 tracking-wider">{referralCode}</span>
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check size={16} className="text-green-500" />
                </motion.div>
              ) : (
                <motion.button key="copy" whileTap={{ scale: 0.9 }} onClick={handleCopyReferral}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-saffron rounded-lg">
                  <Share2 size={12} className="text-primary-foreground" />
                  <span className="text-[10px] font-heading text-primary-foreground uppercase">Share</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-foreground font-heading flex items-center gap-1.5">
              <Package size={14} className="text-secondary" /> Recent Orders
            </p>
            <button onClick={() => navigate('/orders')} className="text-xs text-secondary font-medium">View All →</button>
          </div>
          <div className="space-y-1.5">
            {recentOrders.map(o => (
              <motion.div key={o.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/tracking/${o.id}`)}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between cursor-pointer">
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
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Addresses */}
      {addresses.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-sm text-foreground font-heading mb-2 flex items-center gap-1.5">
            <MapPin size={14} className="text-secondary" /> Saved Addresses
          </p>
          <div className="space-y-1.5">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs font-medium text-foreground">
                  {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                </p>
                {addr.label && <p className="text-[10px] text-muted-foreground mt-0.5">{addr.label}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-sm text-foreground font-heading mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-secondary" /> Earned Badges
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {badges.map(b => (
              <div key={b.id} className="bg-gradient-to-br from-secondary/10 to-card border border-secondary/15 rounded-xl p-3 text-center min-w-[80px] shrink-0">
                <span className="text-2xl">{b.icon}</span>
                <p className="text-[10px] font-medium text-foreground mt-1">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="px-4 pt-4 space-y-1.5">
        {[
          { label: 'Biryan Points Wallet', path: '/wallet', icon: '💰' },
          { label: 'Order History', path: '/orders', icon: '📦' },
        ].map(item => (
          <motion.button key={item.path} whileTap={{ scale: 0.98 }} onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-secondary/20 transition-colors">
            <span className="text-base">{item.icon}</span>
            <span className="text-sm text-foreground flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Toggles */}
      <div className="px-4 pt-4 space-y-1.5">
        <button onClick={() => setMusicEnabled(!musicEnabled)}
          className="w-full flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {musicEnabled ? <Volume2 size={16} className="text-secondary" /> : <VolumeX size={16} className="text-muted-foreground" />}
            <span className="text-sm text-foreground">Music</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors ${musicEnabled ? 'bg-secondary' : 'bg-muted'} flex items-center px-0.5`}>
            <div className={`w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
        <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-3.5 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? <Bell size={16} className="text-secondary" /> : <BellOff size={16} className="text-muted-foreground" />}
            <span className="text-sm text-foreground">Notifications</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-secondary' : 'bg-muted'} flex items-center px-0.5`}>
            <div className={`w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pt-6 pb-8">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
          className="w-full py-3.5 border border-accent/30 rounded-xl text-accent text-sm font-heading flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors">
          <LogOut size={14} /> Leave the Sultanat
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
