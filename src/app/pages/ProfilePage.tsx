import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Volume2, VolumeX, Bell, BellOff, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import { supabase } from '@/integrations/supabase/client';

import ProfileHero from '../components/profile/ProfileHero';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileKids from '../components/profile/ProfileKids';
import ProfileReferral from '../components/profile/ProfileReferral';
import ProfileDates from '../components/profile/ProfileDates';
import ProfileRecentOrders from '../components/profile/ProfileRecentOrders';
import ProfileAddresses from '../components/profile/ProfileAddresses';
import ProfileBadges from '../components/profile/ProfileBadges';
import { Star, Sparkle, Squiggle } from '../components/Stickers';

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
  const [birthday, setBirthday] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);

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

  const tierName = totalOrders >= 50 ? 'Legend' : totalOrders >= 25 ? 'Elite' : totalOrders >= 10 ? 'Pro' : 'Rookie';
  const tierEmoji = totalOrders >= 50 ? '👑' : totalOrders >= 25 ? '🏆' : totalOrders >= 10 ? '⭐' : '🌱';

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Decorative stickers */}
      <Star className="absolute top-20 right-6 w-7 h-7 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute top-40 left-5 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />
      <Squiggle className="absolute top-72 right-8 w-12 h-6 text-mint opacity-40" />

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <h1 className="font-display text-xl text-ink">Profile 🎈</h1>
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

      {/* Kids — new section */}
      <ProfileKids userId={userId} />

      <ProfileDates
        userId={userId}
        birthday={birthday}
        anniversary={anniversary}
        setBirthday={setBirthday}
        setAnniversary={setAnniversary}
      />

      <ProfileReferral referralCode={referralCode} />

      <ProfileRecentOrders orders={recentOrders} navigate={navigate} />

      <ProfileAddresses addresses={addresses} />

      <ProfileBadges badges={badges} />

      {/* Quick links */}
      <div className="px-4 pt-5 space-y-2">
        {[
          { label: 'Goofy Points Wallet', path: '/wallet', icon: '💰', bg: 'bg-gradient-butter' },
          { label: 'My Bookings', path: '/orders', icon: '🎟️', bg: 'bg-gradient-mint' },
        ].map(item => (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3.5 bg-card border-2 border-ink/8 rounded-2xl shadow-soft"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-lg`}>
              {item.icon}
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
          className="w-full flex items-center justify-between p-3.5 bg-card border-2 border-ink/8 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender/25 flex items-center justify-center">
              {musicEnabled ? <Volume2 size={16} className="text-grape" /> : <VolumeX size={16} className="text-ink/40" />}
            </div>
            <span className="text-sm font-heading text-ink">Music</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${musicEnabled ? 'bg-coral' : 'bg-ink/15'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-3.5 bg-card border-2 border-ink/8 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky/25 flex items-center justify-center">
              {notificationsEnabled ? <Bell size={16} className="text-sky" /> : <BellOff size={16} className="text-ink/40" />}
            </div>
            <span className="text-sm font-heading text-ink">Notifications</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${notificationsEnabled ? 'bg-coral' : 'bg-ink/15'}`}>
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
