import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const flashDeals = [
  { id: '1', name: 'Badshahi Murgh Biryani', originalPrice: 349, offerPrice: 249, endsIn: 3600, description: 'Emperor\'s recipe at a royal discount' },
  { id: '2', name: 'Nawabi Gosht Biryani', originalPrice: 449, offerPrice: 329, endsIn: 7200, description: 'The Nawab\'s feast, timed and treasured' },
];

const FlashDawatsPage = () => {
  const navigate = useNavigate();
  const [timers, setTimers] = useState(flashDeals.map(d => d.endsIn));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Flash Dawats</h1>
          <Zap size={16} className="text-primary" />
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
          <p className="font-heading text-sm text-accent">⚡ The Sultan Declares a Timed Feast</p>
          <p className="text-[10px] text-muted-foreground mt-1">Nawab & Sultan tiers get 30-min early access</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {flashDeals.map((deal, i) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-primary" />
              <span className="text-xs text-primary font-mono font-bold">{formatTime(timers[i])}</span>
            </div>
            <h3 className="font-heading text-base text-foreground">{deal.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{deal.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground line-through text-sm">₹{deal.originalPrice}</span>
                <span className="font-heading text-lg text-secondary">₹{deal.offerPrice}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-saffron rounded-lg text-xs font-heading uppercase tracking-wider text-primary-foreground"
              >
                Grab Now
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FlashDawatsPage;
