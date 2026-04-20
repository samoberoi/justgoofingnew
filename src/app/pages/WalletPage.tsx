import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import { Star, Sparkle } from '../components/Stickers';

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance, transactions } = useAppStore();

  const iconMap: Record<string, any> = { earned: TrendingUp, spent: TrendingDown, bonus: Gift };
  const colorMap: Record<string, string> = { earned: 'bg-mint/30', spent: 'bg-coral/20', bonus: 'bg-butter/30' };

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <Star className="absolute top-32 right-8 w-7 h-7 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute top-72 left-6 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <h1 className="font-display text-xl text-ink">Goofy Points 💰</h1>
        </div>
      </header>

      {/* Balance hero */}
      <div className="px-4 pt-6 relative z-10">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-butter rounded-3xl p-7 text-center shadow-pop-butter relative overflow-hidden"
        >
          <Sparkle className="absolute top-3 right-4 w-6 h-6 text-white/60 animate-wobble" />
          <Star className="absolute bottom-3 left-4 w-5 h-5 text-white/60" />
          <div className="w-16 h-16 rounded-3xl bg-white/30 mx-auto mb-3 flex items-center justify-center">
            <Coins size={28} className="text-ink" />
          </div>
          <p className="text-[11px] text-ink/70 uppercase tracking-wider font-heading">Goofy Points</p>
          <p className="font-display text-6xl text-ink mt-2">{walletBalance}</p>
          <p className="text-xs text-ink/70 mt-2">1 point = ₹1 · Redeem anytime</p>
        </motion.div>
      </div>

      {/* Earn ways */}
      <div className="px-4 pt-6 relative z-10">
        <h3 className="font-display text-lg text-ink mb-3">Ways to Earn ✨</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { points: '2.5%', desc: 'Every Booking', icon: '🎟️', bg: 'bg-gradient-mint' },
            { points: '+100', desc: 'Refer a Friend', icon: '🤝', bg: 'bg-gradient-coral' },
            { points: 'Bonus', desc: 'Streak Reward', icon: '🔥', bg: 'bg-gradient-lavender' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`${item.bg} rounded-2xl p-3 text-center text-white`}
            >
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="font-display text-base">{item.points}</p>
              <p className="text-[10px] opacity-90 mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      {transactions.length > 0 && (
        <div className="px-4 pt-6 relative z-10">
          <h3 className="font-display text-lg text-ink mb-3">History 📜</h3>
          <div className="space-y-2">
            {transactions.map((tx, i) => {
              const Icon = iconMap[tx.type] || Gift;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border-2 border-ink/8 rounded-2xl p-3.5 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[tx.type] || 'bg-mint/30'}`}>
                    <Icon size={16} className="text-ink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading text-ink truncate">{tx.description}</p>
                    <p className="text-[11px] text-ink/50">{tx.date}</p>
                  </div>
                  <span className={`font-display text-base tabular-nums ${tx.amount > 0 ? 'text-mint' : 'text-coral'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="px-4 pt-12 text-center relative z-10">
          <div className="text-5xl mb-3">🎈</div>
          <p className="font-heading text-base text-ink">No history yet</p>
          <p className="text-xs text-ink/55 mt-1">Make your first booking to start earning!</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default WalletPage;
