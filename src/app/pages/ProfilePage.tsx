import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, Volume2, VolumeX, Bell, BellOff,
  LogOut, Package, Crown, Leaf,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

// Sub-components
import ProfileHero from '../components/profile/ProfileHero';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileReferral from '../components/profile/ProfileReferral';
import ProfileDates from '../components/profile/ProfileDates';
import ProfileRecentOrders from '../components/profile/ProfileRecentOrders';
import ProfileAddresses from '../components/profile/ProfileAddresses';
import ProfileBadges from '../components/profile/ProfileBadges';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    userName, phoneNumber, walletBalance, totalOrders, referralCode, userId,
    musicEnabled, setMusicEnabled, notificationsEnabled, setNotificationsEnabled,
    vegMode, setVegMode, setLoggedIn, badges,
  } = useAppStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Fetch addresses
    (supabase.from('addresses' as any).select('*') as any).eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setAddresses(data || []));

    // Fetch recent orders
    (supabase.from('orders').select('id, order_number, total, status, created_at') as any)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }: any) => setRecentOrders(data || []));

    // Fetch profile details (avatar, birthday, anniversary)
    supabase.from('profiles')
      .select('avatar_url, birthday, anniversary')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          setBirthday(data.birthday);
          setAnniversary(data.anniversary);
        }
      });
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    navigate('/');
  };

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

      {/* Profile Hero with Avatar */}
      <ProfileHero
        userId={userId}
        userName={userName}
        phoneNumber={phoneNumber}
        tierName={tierName}
        tierEmoji={tierEmoji}
        totalOrders={totalOrders}
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
      />

      {/* Stats */}
      <ProfileStats totalOrders={totalOrders} walletBalance={walletBalance} badgeCount={badges.length} />

      {/* Birthday & Anniversary */}
      <ProfileDates
        userId={userId}
        birthday={birthday}
        anniversary={anniversary}
        setBirthday={setBirthday}
        setAnniversary={setAnniversary}
      />

      {/* Referral */}
      <ProfileReferral referralCode={referralCode} />

      {/* Recent Orders */}
      <ProfileRecentOrders orders={recentOrders} navigate={navigate} />

      {/* Saved Addresses */}
      <ProfileAddresses addresses={addresses} />

      {/* Badges */}
      <ProfileBadges badges={badges} />

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
        {/* Veg Mode */}
        <button onClick={() => setVegMode(!vegMode)}
          className={`w-full flex items-center justify-between p-3.5 bg-card border rounded-xl transition-colors ${vegMode ? 'border-green-500/30' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <Leaf size={16} className={vegMode ? 'text-green-500' : 'text-muted-foreground'} />
            <div className="text-left">
              <span className="text-sm text-foreground block">Veg Mode</span>
              <span className="text-[10px] text-muted-foreground">{vegMode ? 'Only vegetarian dishes' : 'Showing all dishes'}</span>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors ${vegMode ? 'bg-green-500' : 'bg-muted'} flex items-center px-0.5`}>
            <div className={`w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${vegMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
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
