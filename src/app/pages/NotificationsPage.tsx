import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkle } from '../components/Stickers';

const notifications = [
  { id: '1', title: 'Your kids miss us!', body: 'It\'s been a while — book your next visit?', time: '2h', icon: '👋', bg: 'bg-gradient-coral' },
  { id: '2', title: 'New badge unlocked', body: 'You\'re officially a Pro Goofer 🏆', time: '1d', icon: '🏆', bg: 'bg-gradient-butter' },
  { id: '3', title: 'Weekend party slots open', body: 'Saturday & Sunday slots filling fast', time: '2d', icon: '🎉', bg: 'bg-gradient-mint' },
  { id: '4', title: 'Flash deal!', body: '1-hour pack at ₹249 — today only', time: '3d', icon: '⚡', bg: 'bg-gradient-lavender' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <Star className="absolute top-24 right-8 w-7 h-7 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute top-72 left-6 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <h1 className="font-display text-xl text-ink">Notifications 🔔</h1>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-3 relative z-10">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border-2 border-ink/8 rounded-3xl p-4 flex gap-3 shadow-pop"
          >
            <div className={`w-12 h-12 rounded-2xl ${notif.bg} flex items-center justify-center text-2xl shrink-0`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-ink">{notif.title}</p>
              <p className="text-xs text-ink/60 mt-0.5">{notif.body}</p>
              <p className="text-[10px] text-ink/40 mt-1 font-heading">{notif.time} ago</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
