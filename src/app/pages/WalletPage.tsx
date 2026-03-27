import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance, transactions } = useAppStore();

  const iconMap: Record<string, any> = { earned: TrendingUp, spent: TrendingDown, bonus: Gift };
  const colorMap: Record<string, string> = { earned: 'text-green-500', spent: 'text-accent', bonus: 'text-secondary' };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Biryan Points</h1>
        </div>
      </header>

      {/* Balance card */}
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-card via-card to-secondary/5 border border-secondary/20 rounded-2xl p-6 text-center"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Biryan Points</p>
          <p className="font-display text-4xl text-gradient-gold mt-2">{walletBalance}</p>
          <p className="text-xs text-muted-foreground mt-1">1 Point = ₹1</p>
        </motion.div>
      </div>

      {/* Ways to earn */}
      <div className="px-4 pt-6">
        <h3 className="font-heading text-sm text-foreground mb-3">Earn Points</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { points: '2.5%', desc: 'Every Order' },
            { points: '100', desc: 'Successful Referral' },
            { points: '🎡', desc: 'Spin the Wheel' },
            { points: '📦', desc: 'Streak Bonus' },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-heading text-lg text-secondary">{item.points}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 pt-6">
        <h3 className="font-heading text-sm text-foreground mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">No transactions yet — place your first order!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const Icon = iconMap[tx.type] || Gift;
              return (
                <div key={tx.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${colorMap[tx.type] || 'text-secondary'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`font-heading text-sm ${tx.amount > 0 ? 'text-green-500' : 'text-accent'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
