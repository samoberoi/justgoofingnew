import { motion } from 'framer-motion';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const notifications = [
  { id: '1', title: 'The Court Awaits Your Presence This Week', body: 'Order now to keep your streak alive!', time: '2 hours ago', icon: '🏛️' },
  { id: '2', title: 'Your Lucky Wheel Awaits', body: 'You have 1 free spin available this week.', time: '1 day ago', icon: '🎡' },
  { id: '3', title: 'Climbing the Ranks', body: 'Just 13 orders to reach the next tier!', time: '2 days ago', icon: '🏆' },
  { id: '4', title: 'Flash Deal Drop', body: 'Special offer at ₹249 for 1 hour only!', time: '3 days ago', icon: '⚡' },
  { id: '5', title: 'We Miss You', body: 'It has been a while since your last order. Come back!', time: '5 days ago', icon: '💌' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Royal Notifications</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-xl p-4 flex gap-3"
          >
            <span className="text-2xl shrink-0">{notif.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-semibold">{notif.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
