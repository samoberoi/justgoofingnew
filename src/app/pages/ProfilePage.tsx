import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Volume2, VolumeX, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import Icon3D from '../components/Icon3D';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import ProfileHero from '../components/profile/ProfileHero';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileKids from '../components/profile/ProfileKids';
import ProfileParents from '../components/profile/ProfileParents';
import ProfileReferral from '../components/profile/ProfileReferral';
import ProfileRecentOrders from '../components/profile/ProfileRecentOrders';
import ProfileAddresses from '../components/profile/ProfileAddresses';
import ProfileBadges from '../components/profile/ProfileBadges';


const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    userName, phoneNumber, walletBalance, totalOrders, referralCode, userId,
    musicEnabled, setMusicEnabled, notificationsEnabled, setNotificationsEnabled,
    setLoggedIn, badges,
  } = useAppStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    (supabase.from('addresses' as any).select('*') as any).eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setAddresses(data || []));

    (supabase.from('orders').select('id, order_number, total, status, created_at') as any)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }: any) => setRecentOrders(data || []));

    supabase.from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setAvatarUrl(data.avatar_url);
      });
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    navigate('/');
  };

  const tierName = totalOrders >= 50 ? 'Legend' : totalOrders >= 25 ? 'Elite' : totalOrders >= 10 ? 'Pro' : 'Rookie';
  const tierEmoji = totalOrders >= 50 ? '👑' : totalOrders >= 25 ? '🏆' : totalOrders >= 10 ? '⭐' : '🌱';

  return (
    <div className="min-h-screen bg-background pb-32">
      <header
        className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            aria-label="Go back"
            className="relative z-50 w-12 h-12 shrink-0 rounded-full bg-muted flex items-center justify-center pointer-events-auto"
          >
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <div className="flex items-center gap-2 flex-1">
            <Icon3D name="badge" size={26} alt="" />
            <h1 className="font-display text-xl text-ink -tracking-wide">Profile</h1>
          </div>
        </div>
      </header>

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

      <ProfileStats totalOrders={totalOrders} walletBalance={walletBalance} badgeCount={badges.length} />

      {/* Parents — top-level (one set per account) */}
      <ProfileParents userId={userId} />

      {/* Kids */}
      <ProfileKids userId={userId} />

      <ProfileReferral referralCode={referralCode} />

      <ProfileRecentOrders orders={recentOrders} navigate={navigate} />

      <ProfileAddresses addresses={addresses} />

      <ProfileBadges badges={badges} />

      {/* Quick links */}
      <div className="px-4 pt-5 space-y-2">
        {[
          { label: 'Rewards Wallet', path: '/wallet', icon: 'wallet' as const },
          { label: 'My Bookings', path: '/orders', icon: 'orders' as const },
          { label: 'My Kids', path: '/kids', icon: 'kid' as const },
          { label: 'Notifications', path: '/notifications', icon: 'bell' as const },
        ].map(item => (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl shadow-soft"
          >
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
              <Icon3D name={item.icon} size={26} alt="" />
            </div>
            <span className="text-sm font-heading text-ink flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-ink/40" />
          </motion.button>
        ))}
      </div>

      {/* Toggles */}
      <div className="px-4 pt-3 space-y-2">
        <button
          onClick={() => setMusicEnabled(!musicEnabled)}
          className="w-full flex items-center justify-between p-3.5 bg-card border border-border rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
              {musicEnabled ? <Volume2 size={18} className="text-ink" /> : <VolumeX size={18} className="text-ink/40" />}
            </div>
            <span className="text-sm font-heading text-ink">Music</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${musicEnabled ? 'bg-primary' : 'bg-ink/15'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-3.5 bg-card border border-border rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
              <Icon3D name="bell" size={26} alt="" className={notificationsEnabled ? '' : 'opacity-40 grayscale'} />
            </div>
            <span className="text-sm font-heading text-ink">Notifications</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${notificationsEnabled ? 'bg-primary' : 'bg-ink/15'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pt-5 pb-8">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full py-3.5 border-2 border-coral/30 bg-coral/5 rounded-2xl text-coral text-sm font-heading flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Sign Out
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
