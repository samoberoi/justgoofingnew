import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Flame, Gift, MapPin, Copy, ChevronRight, Volume2, VolumeX, Bell, BellOff, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    userName, tier, currentStreak, longestStreak, freeDawatsEarned,
    walletBalance, isSubscriber, referralCode, savedAddresses,
    musicEnabled, setMusicEnabled, notificationsEnabled, setNotificationsEnabled,
    setLoggedIn,
  } = useAppStore();

  const menuItems = [
    { label: 'Royalty Tiers', icon: Crown, path: '/tiers', color: 'text-secondary' },
    { label: 'Sultan\'s Streak', icon: Flame, path: '/streak', color: 'text-primary' },
    { label: 'Spin the Wheel', icon: Gift, path: '/spin', color: 'text-accent' },
    { label: 'Flash Dawats', icon: Flame, path: '/flash-dawats', color: 'text-primary' },
    { label: 'Subscription', icon: Crown, path: '/subscription', color: 'text-secondary' },
    { label: 'Pre-Book Order', icon: MapPin, path: '/pre-book', color: 'text-secondary' },
  ];

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-secondary/20 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-3xl mx-auto">👑</div>
          <p className="font-heading text-lg text-foreground mt-3">{userName}</p>
          <p className="text-xs text-secondary font-medium">{tier} Tier</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-2">
        {[
          { label: 'Current Streak', value: `${currentStreak} weeks`, icon: '🔥' },
          { label: 'Longest Streak', value: `${longestStreak} weeks`, icon: '⚡' },
          { label: 'Free Dawats', value: freeDawatsEarned.toString(), icon: '🎁' },
          { label: 'Wallet', value: `${walletBalance} pts`, icon: '💰' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg">{stat.icon}</p>
            <p className="font-heading text-sm text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

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
          <p className="text-[10px] text-muted-foreground mt-2">Earn 100 points per successful referral</p>
        </div>
      </div>

      {/* Subscription badge */}
      <div className="px-4 pt-4">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-foreground">Subscription</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isSubscriber ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
            {isSubscriber ? '📦 Active' : 'Not Subscribed'}
          </span>
        </div>
      </div>

      {/* Saved addresses */}
      <div className="px-4 pt-4">
        <p className="text-sm text-foreground font-semibold mb-2">Saved Addresses</p>
        {savedAddresses.map((addr, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-secondary shrink-0" />
            <span className="text-xs text-muted-foreground">{addr}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="px-4 pt-4 space-y-1">
        {menuItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
          >
            <item.icon size={16} className={item.color} />
            <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Toggles */}
      <div className="px-4 pt-4 space-y-2">
        <button
          onClick={() => setMusicEnabled(!musicEnabled)}
          className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl"
        >
          <div className="flex items-center gap-3">
            {musicEnabled ? <Volume2 size={16} className="text-secondary" /> : <VolumeX size={16} className="text-muted-foreground" />}
            <span className="text-sm text-foreground">Music</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors ${musicEnabled ? 'bg-secondary' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>

        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl"
        >
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
        <button
          onClick={() => { setLoggedIn(false); navigate('/'); }}
          className="w-full py-3 border border-accent/30 rounded-xl text-accent text-sm font-heading flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Leave the Sultanat
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
