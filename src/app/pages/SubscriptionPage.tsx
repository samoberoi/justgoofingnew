import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BIRYANI_MENU } from '../store';

const mealOptions = [3, 5, 7];
const slots = ['12:00 PM', '1:00 PM', '7:00 PM', '8:00 PM'];

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<'weekly' | 'monthly'>('weekly');
  const [meals, setMeals] = useState(3);
  const [selectedBiryani, setSelectedBiryani] = useState(BIRYANI_MENU[0].id);
  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
  const [subscribed, setSubscribed] = useState(false);

  const basePrice = BIRYANI_MENU.find(b => b.id === selectedBiryani)?.price || 299;
  const total = basePrice * meals * 0.9; // 10% discount

  if (subscribed) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center space-y-4">
          <div className="text-6xl">📦</div>
          <h1 className="font-heading text-2xl text-gradient-gold">Royal Subscriber</h1>
          <p className="text-muted-foreground text-sm">Your biryani subscription is active</p>
          <div className="flex gap-3">
            <button onClick={() => setSubscribed(false)} className="px-4 py-2 bg-muted rounded-lg text-xs font-heading text-foreground flex items-center gap-1">
              <Pause size={12} /> Pause
            </button>
            <button onClick={() => navigate('/app')} className="px-4 py-2 bg-gradient-saffron rounded-lg text-xs font-heading text-primary-foreground">
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Royal Subscription</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        {/* Plan toggle */}
        <div className="flex bg-muted rounded-xl p-1">
          {(['weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-heading capitalize transition-colors ${plan === p ? 'bg-gradient-saffron text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Meals */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Meals per {plan === 'weekly' ? 'week' : 'month'}</p>
          <div className="flex gap-2">
            {mealOptions.map(m => (
              <button
                key={m}
                onClick={() => setMeals(m)}
                className={`flex-1 py-3 rounded-xl border text-sm font-heading ${meals === m ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-card text-muted-foreground'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Biryani type */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Choose Biryani</p>
          <div className="space-y-2">
            {BIRYANI_MENU.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBiryani(b.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border ${selectedBiryani === b.id ? 'border-secondary bg-secondary/5' : 'border-border bg-card'}`}
              >
                <span className="text-2xl">{b.image}</span>
                <span className="text-sm text-foreground flex-1 text-left">{b.name}</span>
                {selectedBiryani === b.id && <Check size={16} className="text-secondary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery slot */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Delivery Slot</p>
          <div className="grid grid-cols-2 gap-2">
            {slots.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSlot(s)}
                className={`py-2.5 rounded-xl border text-xs font-heading ${selectedSlot === s ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-card text-muted-foreground'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
          <p className="font-heading text-sm text-secondary mb-2">Subscriber Benefits</p>
          {['10% cheaper on every order', 'Double points earned', 'Priority preparation', 'Pause / modify anytime'].map(b => (
            <p key={b} className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <Check size={12} className="text-secondary" /> {b}
            </p>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setSubscribed(true)}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron"
        >
          Subscribe • ₹{Math.round(total)} / {plan === 'weekly' ? 'week' : 'month'}
        </motion.button>
      </div>
    </div>
  );
};

export default SubscriptionPage;
