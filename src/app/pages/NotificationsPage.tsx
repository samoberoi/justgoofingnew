import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import Icon3D, { Icon3DName } from '../components/Icon3D';

const notifications: { id: string; title: string; body: string; time: string; icon: Icon3DName; bg: string }[] = [
  { id: '1', title: 'Your kids miss us!', body: "It's been a while — book your next visit?", time: '2h', icon: 'kid', bg: 'bg-coral' },
  { id: '2', title: 'New badge unlocked', body: "You're officially a Pro Goofer", time: '1d', icon: 'badge', bg: 'bg-butter' },
  { id: '3', title: 'Weekend party slots open', body: 'Saturday & Sunday slots filling fast', time: '2d', icon: 'calendar', bg: 'bg-mint' },
  { id: '4', title: 'Flash deal!', body: '1-hour pack at ₹249 — today only', time: '3d', icon: 'gift', bg: 'bg-lavender' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const goBack = useSafeBack();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={goBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Notifications</h1>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-2.5 max-w-lg mx-auto">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card rounded-[24px] p-4 flex gap-3 shadow-soft border border-border"
          >
            <div className={`w-14 h-14 rounded-2xl ${notif.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
              <Icon3D name={notif.icon} size={48} alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-ink">{notif.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-heading">{notif.body}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 font-heading">{notif.time} ago</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
