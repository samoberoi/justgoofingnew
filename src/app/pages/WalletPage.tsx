import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Gift, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance, transactions } = useAppStore();

  const iconMap: Record<string, any> = { earned: TrendingUp, spent: TrendingDown, bonus: Gift };
  const colorMap: Record<string, string> = { earned: 'text-green-500', spent: 'text-accent', bonus: 'text-secondary' };
  const bgMap: Record<string, string> = { earned: 'bg-green-500/10', spent: 'bg-accent/10', bonus: 'bg-secondary/10' };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Biryan Points</h1>
        </div>
      </header>

      {/* Balance Hero */}
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-secondary/15 via-card to-card border border-secondary/20 rounded-2xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 mughal-pattern opacity-20" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-secondary/15 border border-secondary/25 flex items-center justify-center mx-auto mb-3">
              <Coins size={24} className="text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-heading">Biryan Points</p>
            <p className="font-display text-5xl text-gradient-gold mt-2">{walletBalance}</p>
            <p className="text-xs text-muted-foreground mt-2">1 Point = ₹1 • Redeem at checkout</p>
          </div>
        </motion.div>
      </div>

      {/* Earn Points */}
      <div className="px-4 pt-6">
        <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em] mb-3">Ways to Earn</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { points: '2.5%', desc: 'Every Order', icon: '📦' },
            { points: '+100', desc: 'Refer a Friend', icon: '🤝' },
            { points: 'Bonus', desc: 'Streak Rewards', icon: '🔥' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="font-heading text-sm text-secondary">{item.points}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      {transactions.length > 0 && (
        <div className="px-4 pt-6">
          <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em] mb-3">History</h3>
          <div className="space-y-1.5">
            {transactions.map((tx, i) => {
              const Icon = iconMap[tx.type] || Gift;
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${bgMap[tx.type] || 'bg-secondary/10'} ${colorMap[tx.type] || 'text-secondary'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`font-heading text-sm tabular-nums ${tx.amount > 0 ? 'text-green-500' : 'text-accent'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="px-4 pt-12 text-center">
          <p className="text-muted-foreground text-sm">No transactions yet</p>
          <p className="text-[11px] text-muted-foreground mt-1">Place your first order to start earning!</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default WalletPage;
